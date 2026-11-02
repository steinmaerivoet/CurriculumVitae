import { useEffect, useRef } from "react";

/**
 * Anonymous visit statistics: how long each slide was on screen.
 *
 * The page makes a random id for this visit and keeps it in memory only: no
 * cookie, no storage, nothing that recognises a visitor again later. Time
 * counts while the tab is visible and someone used it in the last two minutes.
 * The Worker (worker/index.ts) stores the beacons; ANALYTICS.md has the rest.
 *
 * Nothing is sent when:
 * - the page is not the production site (previews, `npm run dev`, tests),
 * - the browser asks not to be tracked (Do Not Track, Global Privacy Control),
 * - the browser is automated (navigator.webdriver),
 * - this browser opted out: open the site once with `?notrack` (and `?track` to undo).
 */

const ENDPOINT = "/t";
const TICK_MS = 1000;
/** Without any input for this long, the visitor is assumed away and time stops counting. */
const IDLE_MS = 2 * 60 * 1000;
const HEARTBEAT_MS = 30 * 1000;
const OPT_OUT_KEY = "cv:notrack";

function optedOut(): boolean {
  const params = new URLSearchParams(location.search);
  try {
    if (params.has("notrack")) localStorage.setItem(OPT_OUT_KEY, "1");
    if (params.has("track")) localStorage.removeItem(OPT_OUT_KEY);
    return localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch {
    return params.has("notrack");
  }
}

function enabled(): boolean {
  const site = import.meta.env.SITE;
  if (!site || location.origin !== new URL(site).origin) return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.webdriver || nav.doNotTrack === "1" || nav.globalPrivacyControl) return false;
  return !optedOut();
}

/** The tag of the link the visitor came in on: `?ref=acme`, or a `utm_source`. */
const refTag = () => {
  const p = new URLSearchParams(location.search);
  return p.get("ref") ?? p.get("utm_source");
};

export function useVisitTracking(theme: string, ids: readonly string[], index: number) {
  const current = useRef(ids[index]);
  const changed = useRef<(() => void) | null>(null);
  current.current = ids[index];

  useEffect(() => {
    changed.current?.();
  }, [index]);

  useEffect(() => {
    if (!enabled()) return;

    const id = crypto.randomUUID();
    const slides: Record<string, number> = {};
    const path: string[] = [];
    const base = {
      v: id,
      t: theme,
      r: refTag(),
      d: document.referrer || null,
      l: navigator.language,
      w: window.innerWidth,
      h: window.innerHeight,
      o: ids,
    };

    let lastInput = performance.now();
    let lastTick = performance.now();
    let dirty = true;
    /** The slide time is being counted for; moves on only after the time so far is booked. */
    let onSlide = current.current;

    const visit = (slide: string | undefined) => {
      if (slide && path.at(-1) !== slide && path.length < 60) path.push(slide);
    };
    visit(onSlide);

    const send = () => {
      if (!dirty) return;
      dirty = false;
      const body = JSON.stringify({ ...base, s: slides, p: path });
      // sendBeacon survives the page being closed; text/plain keeps it a simple request.
      const blob = new Blob([body], { type: "text/plain" });
      if (!navigator.sendBeacon?.(ENDPOINT, blob)) {
        fetch(ENDPOINT, { method: "POST", body, keepalive: true }).catch(() => {});
      }
    };

    const tick = () => {
      const now = performance.now();
      const delta = Math.min(now - lastTick, 2 * TICK_MS);
      lastTick = now;
      const slide = onSlide;
      if (slide && document.visibilityState === "visible" && now - lastInput < IDLE_MS) {
        slides[slide] = Math.round((slides[slide] ?? 0) + delta);
        dirty = true;
      }
    };

    const onInput = () => {
      lastInput = performance.now();
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        tick();
        send();
      } else {
        lastTick = lastInput = performance.now();
      }
    };
    const onPageHide = () => {
      tick();
      send();
    };
    changed.current = () => {
      tick();
      onSlide = current.current;
      visit(onSlide);
      dirty = true;
      send();
    };

    const inputs = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;
    inputs.forEach((e) => window.addEventListener(e, onInput, { passive: true, capture: true }));
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    const ticker = window.setInterval(tick, TICK_MS);
    const heartbeat = window.setInterval(send, HEARTBEAT_MS);
    send();

    return () => {
      inputs.forEach((e) => window.removeEventListener(e, onInput, { capture: true }));
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
      window.clearInterval(ticker);
      window.clearInterval(heartbeat);
      changed.current = null;
      onPageHide();
    };
  }, [theme, ids]);
}
