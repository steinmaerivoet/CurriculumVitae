import type { Beacon } from "./beacon";
import type { Device } from "./device";
import type { Visit } from "./visit";

/**
 * The visit log in D1: one row per visit, updated by every beacon of that
 * visit. The table creates itself, so a fresh database needs no migration.
 */

/** Visits are deleted after this many days (see `purge`, run daily by the cron trigger). */
export const RETENTION_DAYS = 180;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS visits (
    id TEXT PRIMARY KEY,
    started_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    theme TEXT NOT NULL,
    ref TEXT,
    referrer TEXT,
    country TEXT,
    region TEXT,
    city TEXT,
    org TEXT,
    device TEXT NOT NULL,
    browser TEXT NOT NULL,
    os TEXT NOT NULL,
    language TEXT,
    viewport TEXT,
    total_ms INTEGER NOT NULL,
    slides TEXT NOT NULL,
    path TEXT NOT NULL,
    slide_order TEXT NOT NULL,
    beacons INTEGER NOT NULL DEFAULT 1
  )`,
  `CREATE INDEX IF NOT EXISTS visits_started_at ON visits (started_at)`,
];

const ensureSchema = (db: D1Database) => db.batch(SCHEMA.map((s) => db.prepare(s)));

/** Runs `fn`, creating the table first if it does not exist yet. */
async function withSchema<T>(db: D1Database, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (!String(e).includes("no such table")) throw e;
    await ensureSchema(db);
    return fn();
  }
}

export type Origin = { country: string | null; region: string | null; city: string | null; org: string | null };

export function saveBeacon(db: D1Database, b: Beacon, origin: Origin, device: Device, now: number) {
  // The first beacon fixes where and how the visit came in; later ones only
  // grow the times. A late, out-of-order beacon never shrinks them.
  const stmt = db
    .prepare(
      `INSERT INTO visits (id, started_at, updated_at, theme, ref, referrer, country, region, city, org, device, browser, os, language, viewport, total_ms, slides, path, slide_order)
       VALUES (?1, ?2, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)
       ON CONFLICT (id) DO UPDATE SET
         updated_at = excluded.updated_at,
         total_ms = excluded.total_ms,
         slides = excluded.slides,
         path = excluded.path,
         slide_order = excluded.slide_order,
         beacons = visits.beacons + 1
       WHERE excluded.total_ms >= visits.total_ms`,
    )
    .bind(
      b.id,
      now,
      b.theme,
      b.ref,
      b.referrer,
      origin.country,
      origin.region,
      origin.city,
      origin.org,
      device.device,
      device.browser,
      device.os,
      b.language,
      b.viewport,
      b.total,
      JSON.stringify(b.slides),
      JSON.stringify(b.path),
      JSON.stringify(b.order),
    );
  return withSchema(db, () => stmt.run());
}

type Row = {
  id: string;
  started_at: number;
  updated_at: number;
  theme: string;
  ref: string | null;
  referrer: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  org: string | null;
  device: string;
  browser: string;
  os: string;
  language: string | null;
  viewport: string | null;
  total_ms: number;
  slides: string;
  path: string;
  slide_order: string;
};

const json = <T>(s: string, fallback: T): T => {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
};

const toVisit = (r: Row): Visit => ({
  id: r.id,
  startedAt: r.started_at,
  updatedAt: r.updated_at,
  theme: r.theme,
  ref: r.ref,
  referrer: r.referrer,
  country: r.country,
  region: r.region,
  city: r.city,
  org: r.org,
  device: r.device,
  browser: r.browser,
  os: r.os,
  language: r.language,
  viewport: r.viewport,
  totalMs: r.total_ms,
  slides: json(r.slides, {}),
  path: json(r.path, []),
  order: json(r.slide_order, []),
});

/** Visits that started at or after `since`, newest first. */
export async function loadVisits(db: D1Database, since: number, limit = 5000): Promise<Visit[]> {
  const { results } = await withSchema(db, () =>
    db.prepare(`SELECT * FROM visits WHERE started_at >= ?1 ORDER BY started_at DESC LIMIT ?2`).bind(since, limit).all<Row>(),
  );
  return results.map(toVisit);
}

/** Deletes visits older than the retention period. */
export function purge(db: D1Database, now: number) {
  const cutoff = now - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return withSchema(db, () => db.prepare(`DELETE FROM visits WHERE started_at < ?1`).bind(cutoff).run());
}
