import { parseBeacon } from "./beacon";
import { isBot, readDevice } from "./device";
import { saveBeacon, loadVisits, purge } from "./store";
import { accessToken, verifyAccess } from "./access";
import { RANGES, renderDashboard, renderCsv } from "./dashboard";

/**
 * The site's Worker. Static files are served from ./dist as before; the Worker
 * only runs first for three paths (see `run_worker_first` in wrangler.jsonc):
 *
 *   POST /t                 visit beacons from the deck (src/web/analytics)
 *   GET  /stats             the private visit statistics, behind Cloudflare Access
 *   GET  /stats/visits.csv  the same visits as CSV
 *
 * See ANALYTICS.md for what is stored and how /stats is protected.
 */

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  /** The production host. Beacons from any other host (previews, local) are ignored. */
  SITE_HOST: string;
  /** Cloudflare Access team domain, e.g. https://<team>.cloudflareaccess.com. */
  ACCESS_TEAM_DOMAIN?: string;
  /** Application Audience (AUD) tag of the Access application that guards /stats. */
  ACCESS_AUD?: string;
  /** Time zone the dashboard shows times in. */
  STATS_TIMEZONE?: string;
}

const MAX_BODY = 8 * 1024;
const noStore = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

async function collect(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const done = new Response(null, { status: 204, headers: noStore });
  if (req.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "POST" } });

  const url = new URL(req.url);
  const origin = req.headers.get("Origin");
  if (url.hostname !== env.SITE_HOST || (origin && new URL(origin).hostname !== env.SITE_HOST)) return done;
  const ua = req.headers.get("User-Agent") ?? "";
  if (isBot(ua) || req.headers.get("DNT") === "1" || req.headers.get("Sec-GPC") === "1") return done;

  const text = await req.text();
  if (text.length > MAX_BODY) return new Response(null, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  const beacon = parseBeacon(body, env.SITE_HOST);
  if (!beacon) return new Response(null, { status: 400 });

  // Coarse origin only, from Cloudflare's own lookup. The IP address itself is never stored.
  const cf = (req.cf ?? {}) as IncomingRequestCfProperties;
  const where = {
    country: typeof cf.country === "string" ? cf.country : null,
    region: typeof cf.region === "string" ? cf.region : null,
    city: typeof cf.city === "string" ? cf.city : null,
    org: typeof cf.asOrganization === "string" ? cf.asOrganization : null,
  };
  ctx.waitUntil(saveBeacon(env.DB, beacon, where, readDevice(ua), Date.now()).catch((e) => console.error("beacon", e)));
  return done;
}

async function stats(req: Request, env: Env): Promise<Response> {
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) {
    return new Response("Statistics are not set up yet: protect /stats with Cloudflare Access and set ACCESS_TEAM_DOMAIN and ACCESS_AUD (see ANALYTICS.md).", {
      status: 503,
      headers: { ...noStore, "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const viewer = await verifyAccess(accessToken(req), { teamDomain: env.ACCESS_TEAM_DOMAIN, aud: env.ACCESS_AUD });
  if (!viewer) return new Response("Forbidden", { status: 403, headers: noStore });

  const url = new URL(req.url);
  const asked = Number(url.searchParams.get("days"));
  const days = (RANGES as readonly number[]).includes(asked) ? asked : 30;
  const now = Date.now();
  const visits = await loadVisits(env.DB, now - days * 86_400_000);

  if (url.pathname === "/stats/visits.csv") {
    return new Response(renderCsv(visits), {
      headers: { ...noStore, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="visits-${days}d.csv"` },
    });
  }
  const html = renderDashboard({ visits, days, now, timeZone: env.STATS_TIMEZONE || "Europe/Brussels", viewer });
  return new Response(html, {
    headers: {
      ...noStore,
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    },
  });
}

export default {
  async fetch(req, env, ctx) {
    const { pathname } = new URL(req.url);
    if (pathname === "/t") return collect(req, env, ctx);
    if (pathname === "/stats" || pathname === "/stats/" || pathname === "/stats/visits.csv") return stats(req, env);
    return env.ASSETS.fetch(req);
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(purge(env.DB, Date.now()));
  },
} satisfies ExportedHandler<Env>;
