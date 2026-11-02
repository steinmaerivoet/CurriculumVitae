/**
 * Checks that a request went through Cloudflare Access: the Access login in
 * front of /stats signs a JWT for every request it lets through. The Worker
 * verifies that token itself, so /stats stays closed even if the Access
 * application were removed or misconfigured.
 *
 * https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/
 */

export type AccessConfig = {
  /** e.g. https://<team>.cloudflareaccess.com */
  teamDomain: string;
  /** The Application Audience (AUD) tag of the Access application. */
  aud: string;
};

type Jwk = JsonWebKey & { kid?: string };
type Claims = { aud?: string | string[]; iss?: string; exp?: number; nbf?: number; email?: string };

const certCache = new Map<string, { keys: Jwk[]; at: number }>();
const CERT_TTL = 60 * 60 * 1000;

const b64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), (c) => c.charCodeAt(0));
const decodeJson = <T>(s: string) => JSON.parse(new TextDecoder().decode(b64url(s))) as T;

async function keysFor(teamDomain: string, refresh = false): Promise<Jwk[]> {
  const hit = certCache.get(teamDomain);
  if (hit && !refresh && Date.now() - hit.at < CERT_TTL) return hit.keys;
  const res = await fetch(`${teamDomain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`Access certs: HTTP ${res.status}`);
  const { keys } = (await res.json()) as { keys: Jwk[] };
  certCache.set(teamDomain, { keys, at: Date.now() });
  return keys;
}

/** The token Access attached to the request: the header, or the CF_Authorization cookie. */
export function accessToken(req: Request): string | null {
  const header = req.headers.get("Cf-Access-Jwt-Assertion");
  if (header) return header;
  const cookie = req.headers.get("Cookie") ?? "";
  const m = /(?:^|;\s*)CF_Authorization=([^;]+)/.exec(cookie);
  return m?.[1] ?? null;
}

/** Returns the signed-in email when the token is valid for this application, otherwise null. */
export async function verifyAccess(token: string | null, cfg: AccessConfig, now = Date.now()): Promise<string | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, sig] = parts as [string, string, string];
  try {
    const header = decodeJson<{ alg?: string; kid?: string }>(h);
    if (header.alg !== "RS256") return null;
    const claims = decodeJson<Claims>(p);
    const team = cfg.teamDomain.replace(/\/$/, "");
    const auds = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (claims.iss !== team || !auds.includes(cfg.aud)) return null;
    if (!claims.exp || claims.exp * 1000 < now || (claims.nbf && claims.nbf * 1000 > now + 60_000)) return null;

    let jwk = (await keysFor(team)).find((k) => k.kid === header.kid);
    // Access rotates its keys: on an unknown kid, fetch them once more.
    if (!jwk) jwk = (await keysFor(team, true)).find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64url(sig), new TextEncoder().encode(`${h}.${p}`));
    return ok ? (claims.email ?? "unknown") : null;
  } catch {
    return null;
  }
}
