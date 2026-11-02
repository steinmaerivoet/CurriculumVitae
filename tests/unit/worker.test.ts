import { describe, expect, it } from "vitest";
import { parseBeacon, referrerHost } from "../../worker/beacon";
import { isBot, readDevice } from "../../worker/device";
import { duration, renderCsv, renderDashboard, slideOrder, summarize } from "../../worker/dashboard";
import type { Visit } from "../../worker/visit";

const HOST = "steinmaerivoet.dev";
const ID = "0b7c8f4e-2f1a-4c55-9a6e-3d2b1c0a9f8e";

describe("beacon", () => {
  it("keeps only what is expected, trimmed", () => {
    const b = parseBeacon(
      {
        v: ID,
        t: "plain",
        r: "Acme",
        d: "https://www.linkedin.com/in/someone?trk=abc",
        l: "nl-BE",
        w: 1440,
        h: 900,
        s: { hero: 4200.4, skills: 12000, "<script>": 5, bad: -1, worse: "x" },
        p: ["hero", "skills", 3, "NOPE"],
        o: ["hero", "about", "skills"],
        extra: "ignored",
      },
      HOST,
    );
    expect(b).toEqual({
      id: ID,
      theme: "plain",
      ref: "acme",
      referrer: "linkedin.com",
      language: "nl-BE",
      viewport: "1440×900",
      slides: { hero: 4200, skills: 12000 },
      path: ["hero", "skills"],
      order: ["hero", "about", "skills"],
      total: 16200,
    });
  });

  it("rejects bodies that are not ours", () => {
    expect(parseBeacon(null, HOST)).toBeNull();
    expect(parseBeacon({ v: "not-a-uuid", t: "plain" }, HOST)).toBeNull();
    expect(parseBeacon({ v: ID, t: "<b>" }, HOST)).toBeNull();
  });

  it("drops our own site and junk as referrer", () => {
    expect(referrerHost("https://steinmaerivoet.dev/#skills", HOST)).toBeNull();
    expect(referrerHost("not a url", HOST)).toBeNull();
    expect(referrerHost("https://www.google.com/", HOST)).toBe("google.com");
  });

  it("caps a slide's time", () => {
    const b = parseBeacon({ v: ID, t: "plain", s: { hero: 1e12 } }, HOST);
    expect(b?.slides["hero"]).toBe(6 * 60 * 60 * 1000);
  });
});

describe("device", () => {
  it("reads device, browser and OS", () => {
    expect(readDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1")).toEqual({
      device: "phone",
      browser: "Safari",
      os: "iOS",
    });
    expect(readDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36 Edg/141.0")).toEqual({
      device: "desktop",
      browser: "Edge",
      os: "Windows",
    });
  });

  it("recognises bots", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
    expect(isBot("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0 Safari/537.36")).toBe(true);
    expect(isBot("")).toBe(true);
  });
});

const visit = (over: Partial<Visit>): Visit => ({
  id: ID,
  startedAt: Date.UTC(2026, 10, 2, 9, 30),
  updatedAt: Date.UTC(2026, 10, 2, 9, 35),
  theme: "plain",
  ref: null,
  referrer: null,
  country: "BE",
  region: "Flanders",
  city: "Ghent",
  org: "Proximus NV",
  device: "desktop",
  browser: "Chrome",
  os: "macOS",
  language: "nl-BE",
  viewport: "1440×900",
  totalMs: 0,
  slides: {},
  path: [],
  order: ["hero", "about", "experience"],
  ...over,
});

describe("dashboard", () => {
  const visits = [
    visit({ ref: "acme", totalMs: 95_000, slides: { hero: 5_000, experience: 90_000 }, path: ["hero", "experience"] }),
    visit({ referrer: "linkedin.com", totalMs: 3_000, slides: { hero: 3_000 }, path: ["hero"], org: "=cmd()" }),
  ];

  it("formats durations", () => {
    expect(duration(4_400)).toBe("4s");
    expect(duration(65_000)).toBe("1m 05s");
    expect(duration(3_720_000)).toBe("1h 02m");
  });

  it("summarizes visits and slides in deck order", () => {
    const sum = summarize(visits);
    expect(sum).toMatchObject({ visits: 2, engaged: 1, medianMs: 95_000, tagged: 1 });
    expect(sum.slides.map((s) => [s.id, s.reach, s.medianMs])).toEqual([
      ["hero", 1, 4_000],
      ["about", 0, 0],
      ["experience", 0.5, 90_000],
    ]);
    expect(slideOrder([visit({ order: [], slides: { contact: 1 } })])).toEqual(["contact"]);
  });

  it("renders escaped HTML", () => {
    const html = renderDashboard({ visits: [visit({ org: "<img src=x>" })], days: 7, now: Date.UTC(2026, 10, 2, 12), timeZone: "Europe/Brussels", viewer: "me@example.com" });
    expect(html).toContain("&#60;img src=x&#62;");
    expect(html).not.toContain("<img");
    expect(html).toContain("Ghent, BE");
  });

  it("exports CSV without spreadsheet formulas", () => {
    const csv = renderCsv(visits);
    expect(csv.split("\n")[0]).toBe("started_at,theme,ref,referrer,country,region,city,network,device,browser,os,language,viewport,total_s,hero_s,about_s,experience_s,path");
    expect(csv).toContain("'=cmd()");
    expect(csv).toContain("hero > experience");
  });
});

describe("access", async () => {
  const { verifyAccess, accessToken } = await import("../../worker/access");
  const team = "https://stein.cloudflareaccess.com";
  const aud = "aud-tag";
  const pair = (await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  const jwk = { ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid: "k1" };
  const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const sign = async (claims: object, kid = "k1") => {
    const data = `${enc({ alg: "RS256", kid })}.${enc(claims)}`;
    const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, new TextEncoder().encode(data));
    return `${data}.${Buffer.from(sig).toString("base64url")}`;
  };
  const now = Date.UTC(2026, 10, 2);
  const exp = now / 1000 + 3600;
  globalThis.fetch = (async () => new Response(JSON.stringify({ keys: [jwk] }))) as typeof fetch;

  it("accepts a token Access signed for this application", async () => {
    expect(await verifyAccess(await sign({ iss: team, aud: [aud], exp, email: "me@example.com" }), { teamDomain: team, aud }, now)).toBe("me@example.com");
  });

  it("rejects other audiences, issuers, expired tokens and bad signatures", async () => {
    const cfg = { teamDomain: team, aud };
    expect(await verifyAccess(await sign({ iss: team, aud: ["other"], exp }), cfg, now)).toBeNull();
    expect(await verifyAccess(await sign({ iss: "https://evil.cloudflareaccess.com", aud: [aud], exp }), cfg, now)).toBeNull();
    expect(await verifyAccess(await sign({ iss: team, aud: [aud], exp: now / 1000 - 1 }), cfg, now)).toBeNull();
    const good = await sign({ iss: team, aud: [aud], exp });
    expect(await verifyAccess(good.slice(0, -4) + "AAAA", cfg, now)).toBeNull();
    expect(await verifyAccess(null, cfg, now)).toBeNull();
  });

  it("reads the token from the header or the cookie", () => {
    expect(accessToken(new Request("https://x/", { headers: { "Cf-Access-Jwt-Assertion": "a.b.c" } }))).toBe("a.b.c");
    expect(accessToken(new Request("https://x/", { headers: { Cookie: "x=1; CF_Authorization=d.e.f" } }))).toBe("d.e.f");
  });
});
