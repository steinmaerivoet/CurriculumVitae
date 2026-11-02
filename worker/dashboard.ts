import type { Visit } from "./visit";

/**
 * The private statistics page at /stats, rendered on the server as plain HTML
 * with no scripts. Pure: it only turns visits into markup, so the unit tests
 * can render it without Cloudflare.
 */

export const RANGES = [7, 30, 90, 180] as const;
/** Visits shorter than this are counted but treated as a bounce. */
export const ENGAGED_MS = 10_000;
/** A slide counts as seen after this long on screen. */
const SEEN_MS = 1_000;
const RECENT = 250;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function duration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, "0")}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
};

const label = (id: string) => id.charAt(0).toUpperCase() + id.slice(1);

/** Slides in deck order: the order the newest visit reported, then any others seen. */
export function slideOrder(visits: Visit[]): string[] {
  const order = [...(visits.find((v) => v.order.length)?.order ?? [])];
  for (const v of visits) for (const id of Object.keys(v.slides)) if (!order.includes(id)) order.push(id);
  return order;
}

/** Where a visit came from, in order of what tells most: a tagged link, a referring site, or nothing. */
export const sourceOf = (v: Visit) => (v.ref ? `ref: ${v.ref}` : (v.referrer ?? "direct"));

export type SlideStat = { id: string; reach: number; medianMs: number };

export function summarize(visits: Visit[]) {
  const engaged = visits.filter((v) => v.totalMs >= ENGAGED_MS);
  const slides: SlideStat[] = slideOrder(visits).map((id) => {
    const seen = visits.map((v) => v.slides[id] ?? 0).filter((ms) => ms >= SEEN_MS);
    return { id, reach: visits.length ? seen.length / visits.length : 0, medianMs: median(seen) };
  });
  return {
    visits: visits.length,
    engaged: engaged.length,
    medianMs: median(engaged.map((v) => v.totalMs)),
    tagged: visits.filter((v) => v.ref).length,
    slides,
  };
}

function top(visits: Visit[], key: (v: Visit) => string | null, n = 8): [string, number][] {
  const counts = new Map<string, number>();
  for (const v of visits) {
    const k = key(v);
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);
}

type Options = { visits: Visit[]; days: number; now: number; timeZone: string; viewer: string };

const dayKey = (t: number, timeZone: string) => new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(t);

function perDay(visits: Visit[], days: number, now: number, timeZone: string) {
  const counts = new Map<string, number>();
  for (const v of visits) counts.set(dayKey(v.startedAt, timeZone), (counts.get(dayKey(v.startedAt, timeZone)) ?? 0) + 1);
  const out: { day: string; n: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = dayKey(now - i * 86_400_000, timeZone);
    out.push({ day, n: counts.get(day) ?? 0 });
  }
  return out;
}

const flag = (cc: string | null) =>
  cc && /^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 0x1f1a5 + c.charCodeAt(0))) : "";

const where = (v: Visit) => [v.city, v.country].filter(Boolean).join(", ") || "unknown";

function list(title: string, rows: [string, number][], total: number) {
  const body = rows.length
    ? rows
        .map(
          ([k, n]) =>
            `<tr><td>${esc(k)}</td><td class="num">${n}</td><td class="bar-cell"><span class="bar" style="--w:${((n / Math.max(1, rows[0]![1])) * 100).toFixed(1)}%"></span></td></tr>`,
        )
        .join("")
    : `<tr><td colspan="3" class="mute">Nothing yet</td></tr>`;
  return `<section class="card"><h2>${esc(title)}</h2><table class="list"><thead><tr><th>${esc(title)}</th><th class="num">Visits</th><th><span class="sr">Share of ${total}</span></th></tr></thead><tbody>${body}</tbody></table></section>`;
}

export function renderDashboard({ visits, days, now, timeZone, viewer }: Options): string {
  const sum = summarize(visits);
  const daily = perDay(visits, days, now, timeZone);
  const maxDay = Math.max(1, ...daily.map((d) => d.n));
  const maxSlide = Math.max(1, ...sum.slides.map((s) => s.medianMs));
  const time = new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const recent = visits.slice(0, RECENT);
  const order = sum.slides.map((s) => s.id);
  const maxCell = Math.max(1, ...recent.flatMap((v) => Object.values(v.slides)));

  const tiles = [
    ["Visits", String(sum.visits), `in the last ${days} days`],
    ["Stayed 10s or more", String(sum.engaged), sum.visits ? `${Math.round((sum.engaged / sum.visits) * 100)}% of visits` : "—"],
    ["Median time on site", sum.engaged ? duration(sum.medianMs) : "—", "of visits that stayed"],
    ["From a tagged link", String(sum.tagged), "links with ?ref="],
  ]
    .map(([k, v, note]) => `<div class="tile"><div class="tile-k">${k}</div><div class="tile-v">${v}</div><div class="tile-n">${note}</div></div>`)
    .join("");

  const columns = daily
    .map(
      (d) =>
        `<div class="col" title="${esc(d.day)}: ${d.n} visit${d.n === 1 ? "" : "s"}"><span style="--h:${((d.n / maxDay) * 100).toFixed(1)}%"></span></div>`,
    )
    .join("");

  const slideRows = sum.slides
    .map(
      (s) =>
        `<tr title="${esc(label(s.id))}: seen in ${Math.round(s.reach * 100)}% of visits, median ${duration(s.medianMs)}"><td>${esc(label(s.id))}</td><td class="num">${Math.round(s.reach * 100)}%</td><td class="num">${s.medianMs ? duration(s.medianMs) : "—"}</td><td class="bar-cell"><span class="bar" style="--w:${((s.medianMs / maxSlide) * 100).toFixed(1)}%"></span></td></tr>`,
    )
    .join("");

  const visitRows = recent
    .map((v) => {
      const cells = order
        .map((id) => {
          const ms = v.slides[id] ?? 0;
          const a = ms ? 0.12 + 0.88 * Math.sqrt(ms / maxCell) : 0;
          return `<td class="heat${ms ? "" : " none"}" style="--a:${a.toFixed(2)}" title="${esc(label(id))}: ${ms ? duration(ms) : "not seen"}">${ms >= SEEN_MS ? duration(ms) : ""}</td>`;
        })
        .join("");
      const trail = v.path.map(label).join(" → ");
      return `<tr${v.totalMs < ENGAGED_MS ? ' class="bounce"' : ""}>
        <td class="nowrap" title="${esc(new Date(v.startedAt).toISOString())}">${esc(time.format(v.startedAt))}</td>
        <td>${flag(v.country)} ${esc(where(v))}</td>
        <td>${esc(v.org ?? "—")}</td>
        <td>${v.ref ? `<strong>${esc(v.ref)}</strong>` : esc(v.referrer ?? "direct")}</td>
        <td class="nowrap">${esc(`${v.device} · ${v.browser} · ${v.os}`)}</td>
        <td>${esc(v.theme)}</td>
        <td class="num nowrap" title="${esc(trail)}">${duration(v.totalMs)}</td>
        ${cells}
      </tr>`;
    })
    .join("");

  const range = RANGES.map((d) => `<a href="?days=${d}"${d === days ? ' aria-current="page"' : ""}>${d} days</a>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Visit statistics</title>
<style>
:root{--bg:#f6f6f4;--surface:#fcfcfb;--ink:#1d1d1b;--ink-2:#55554f;--mute:#8a8a83;--line:#e4e3de;--accent:#2a78d6;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#121211;--surface:#1a1a19;--ink:#f1f0ec;--ink-2:#bdbcb5;--mute:#85847d;--line:#2e2e2b;--accent:#3987e5;color-scheme:dark}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1280px;margin:0 auto;padding:24px 16px 64px}
header{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:20px}
h1{font-size:22px;margin:0}
h2{font-size:13px;font-weight:600;margin:0 0 12px;color:var(--ink-2)}
.mute,.tile-n,.note{color:var(--mute)}
nav{display:flex;flex-wrap:wrap;gap:4px}
nav a{color:var(--ink-2);text-decoration:none;padding:4px 10px;border-radius:999px;border:1px solid var(--line)}
nav a[aria-current]{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:12px}
.tile,.card{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:16px}
.tile-k{color:var(--ink-2);font-size:12px}.tile-v{font-size:28px;font-weight:650;margin:2px 0}.tile-n{font-size:12px}
.grid{display:grid;align-items:start;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;margin-bottom:12px}
.cols{display:flex;align-items:flex-end;gap:2px;height:120px;border-bottom:1px solid var(--line)}
.col{flex:1;height:100%;display:flex;align-items:flex-end;min-width:2px}
.col span{display:block;width:100%;height:var(--h);min-height:0;background:var(--accent);border-radius:4px 4px 0 0}
.col:hover span{opacity:.75}
.axis{display:flex;justify-content:space-between;font-size:11px;color:var(--mute);margin-top:4px}
table{border-collapse:collapse;width:100%}
th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:middle}
th{font-size:12px;font-weight:600;color:var(--ink-2)}
.num{text-align:right;font-variant-numeric:tabular-nums}
.nowrap{white-space:nowrap}
.bar-cell{width:40%}
.bar{display:block;height:8px;width:var(--w);background:var(--accent);border-radius:0 4px 4px 0}
.list td:first-child{max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.scroll{overflow-x:auto}
.visits{font-size:13px}
.visits td{white-space:nowrap}
.heat{text-align:center;font-variant-numeric:tabular-nums;font-size:12px;background:color-mix(in srgb,var(--accent) calc(var(--a)*100%),transparent);border-left:2px solid var(--surface)}
.heat.none{background:transparent}
.bounce{color:var(--mute)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.note{font-size:12px;margin-top:16px}
a{color:var(--accent)}
</style>
</head>
<body>
<main>
<header>
  <div><h1>Visit statistics</h1><div class="mute">Signed in as ${esc(viewer)} · times in ${esc(timeZone)}</div></div>
  <nav aria-label="Period">${range}<a href="/stats/visits.csv?days=${days}">CSV</a></nav>
</header>
<div class="tiles">${tiles}</div>
<div class="grid">
  <section class="card"><h2>Visits per day</h2><div class="cols" role="img" aria-label="Visits per day over the last ${days} days">${columns}</div><div class="axis"><span>${esc(daily[0]?.day ?? "")}</span><span>max ${maxDay}</span><span>${esc(daily.at(-1)?.day ?? "")}</span></div></section>
  <section class="card"><h2>Time per slide</h2><table><thead><tr><th>Slide</th><th class="num">Seen by</th><th class="num">Median</th><th><span class="sr">Median time</span></th></tr></thead><tbody>${slideRows || `<tr><td colspan="4" class="mute">Nothing yet</td></tr>`}</tbody></table></section>
</div>
<div class="grid">
  ${list("Source", top(visits, sourceOf), sum.visits)}
  ${list("Network", top(visits, (v) => v.org), sum.visits)}
  ${list("Country", top(visits, (v) => (v.country ? `${flag(v.country)} ${v.country}` : null)), sum.visits)}
  ${list("Device", top(visits, (v) => `${v.device} · ${v.browser}`), sum.visits)}
</div>
<section class="card">
  <h2>Visits${visits.length > RECENT ? ` (newest ${RECENT})` : ""}</h2>
  <div class="scroll"><table class="visits">
    <thead><tr><th>When</th><th>Where</th><th>Network</th><th>Source</th><th>Device</th><th>Theme</th><th class="num">Total</th>${order.map((id) => `<th class="num">${esc(label(id))}</th>`).join("")}</tr></thead>
    <tbody>${visitRows || `<tr><td colspan="${7 + order.length}" class="mute">No visits yet</td></tr>`}</tbody>
  </table></div>
  <p class="note">Grey rows stayed under ${ENGAGED_MS / 1000}s. Hover a total for the order the slides were visited in. Time counts only while the tab was visible and someone was using it. No cookies or IP addresses are stored; visits are deleted after 180 days.</p>
</section>
</main>
</body>
</html>`;
}

const csvCell = (v: string | number | null) => {
  let s = v === null ? "" : String(v);
  // A cell starting with = + - @ would run as a formula in a spreadsheet.
  if (typeof v === "string" && /^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function renderCsv(visits: Visit[]): string {
  const order = slideOrder(visits);
  const head = ["started_at", "theme", "ref", "referrer", "country", "region", "city", "network", "device", "browser", "os", "language", "viewport", "total_s", ...order.map((id) => `${id}_s`), "path"];
  const rows = visits.map((v) => [
    new Date(v.startedAt).toISOString(),
    v.theme,
    v.ref,
    v.referrer,
    v.country,
    v.region,
    v.city,
    v.org,
    v.device,
    v.browser,
    v.os,
    v.language,
    v.viewport,
    Math.round(v.totalMs / 1000),
    ...order.map((id) => Math.round((v.slides[id] ?? 0) / 1000)),
    v.path.join(" > "),
  ]);
  return [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n") + "\n";
}
