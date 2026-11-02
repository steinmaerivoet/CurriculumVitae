/**
 * What the browser reports about a visit (see src/web/analytics/visit.ts),
 * checked and trimmed before anything is stored. Pure: no Cloudflare APIs, so
 * the unit tests can import it.
 */

export type Beacon = {
  /** Random id the page made for this visit. Lives only in the page's memory. */
  id: string;
  theme: string;
  /** The `?ref=` or `utm_source` tag of the link the visitor came in on. */
  ref: string | null;
  /** Only the host of the referring page, never its path or query. */
  referrer: string | null;
  language: string | null;
  viewport: string | null;
  /** Milliseconds each slide was on screen, while the tab was visible and in use. */
  slides: Record<string, number>;
  /** The order slides were visited in. */
  path: string[];
  /** The deck's slide order, so the dashboard can show slides in order. */
  order: string[];
  /** Sum of `slides`. */
  total: number;
};

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const WORD = /^[a-z][a-z0-9-]{0,23}$/;
const TAG = /^[\w.@-]{1,48}$/;
const MAX_SLIDE_MS = 6 * 60 * 60 * 1000;
const MAX_SLIDES = 24;
const MAX_PATH = 60;

const str = (v: unknown) => (typeof v === "string" ? v : null);
const words = (v: unknown, max: number) => (Array.isArray(v) ? v.filter((w): w is string => typeof w === "string" && WORD.test(w)).slice(0, max) : []);

/** The host of a referrer URL, or null for none, our own site and anything unparsable. */
export function referrerHost(url: string | null, siteHost: string): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    if (!host || host === siteHost.replace(/^www\./, "")) return null;
    return host.slice(0, 80);
  } catch {
    return null;
  }
}

/** Parses a beacon body. Returns null when it is not a beacon from our page. */
export function parseBeacon(body: unknown, siteHost: string): Beacon | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const id = str(b["v"]);
  const theme = str(b["t"]);
  if (!id || !ID.test(id) || !theme || !WORD.test(theme)) return null;

  const slides: Record<string, number> = {};
  const rawSlides = b["s"];
  if (rawSlides && typeof rawSlides === "object") {
    for (const [k, v] of Object.entries(rawSlides).slice(0, MAX_SLIDES)) {
      if (WORD.test(k) && typeof v === "number" && Number.isFinite(v) && v > 0) slides[k] = Math.min(Math.round(v), MAX_SLIDE_MS);
    }
  }
  const ref = str(b["r"]);
  const language = str(b["l"]);
  const w = b["w"];
  const h = b["h"];
  const viewport = typeof w === "number" && typeof h === "number" && w > 0 && h > 0 && w < 20000 && h < 20000 ? `${Math.round(w)}×${Math.round(h)}` : null;

  return {
    id,
    theme,
    ref: ref && TAG.test(ref) ? ref.toLowerCase() : null,
    referrer: referrerHost(str(b["d"]), siteHost),
    language: language && /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(language) ? language.slice(0, 16) : null,
    viewport,
    slides,
    path: words(b["p"], MAX_PATH),
    order: words(b["o"], MAX_SLIDES),
    total: Object.values(slides).reduce((a, c) => a + c, 0),
  };
}
