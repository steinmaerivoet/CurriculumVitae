import { expect, type Page } from "@playwright/test";

export const SLIDES = ["hero", "about", "experience", "skills", "projects", "education", "contact"] as const;

/** Current vertical offset of the slide track, in px. */
export async function trackY(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.querySelector<HTMLElement>(".deck-track");
    return el ? new DOMMatrixReadOnly(getComputedStyle(el).transform).m42 : NaN;
  });
}

export async function deckHeight(page: Page): Promise<number> {
  return page.evaluate(() => document.querySelector<HTMLElement>("[data-ready]")!.clientHeight);
}

export async function activeIndex(page: Page): Promise<number> {
  return page.evaluate(() => [...document.querySelectorAll(".slide")].findIndex((s) => s.getAttribute("data-active") === "true"));
}

/** Waits until the track has stopped moving, then checks it rests exactly on a slide. */
export async function expectAtRestOn(page: Page, index: number) {
  await expect.poll(() => activeIndex(page), { timeout: 5000 }).toBe(index);
  const h = await deckHeight(page);
  // Still for half a second: longer than the magnet holds a pull (380ms)
  // before it springs back, so a held pull never passes for "at rest".
  let prev = NaN;
  let stillFor = 0;
  await expect
    .poll(
      async () => {
        const y = await trackY(page);
        stillFor = Math.abs(y - prev) < 0.5 ? stillFor + 1 : 0;
        prev = y;
        return stillFor >= 5;
      },
      { timeout: 6000, intervals: [100] },
    )
    .toBe(true);
  expect(Math.abs((await trackY(page)) - -index * h)).toBeLessThan(1);
  // And that slide is what's actually on screen.
  const top = await page.evaluate((i) => document.querySelectorAll(".slide")[i]!.getBoundingClientRect().top, index);
  expect(Math.abs(top)).toBeLessThan(1);
}

/** Opens a theme's page (Plain by default) on the slide in `hash`. */
export async function openDeck(page: Page, hash = "", path = "/") {
  await page.goto(`${path}${hash ? "#" + hash : ""}`);
  await page.waitForSelector("[data-ready='true']");
  await page.waitForTimeout(300);
}

/**
 * Fires wheel events from inside the page at a steady pace, like a real
 * trackpad or mouse does. (Sending them one by one from the test runner adds
 * a round trip per event, which on a busy machine stretches a gesture into
 * many separate ones.)
 */
export async function wheel(page: Page, deltas: number[], intervalMs = 16) {
  await page.evaluate(
    async ({ deltas, intervalMs }) => {
      const x = innerWidth / 2;
      const y = innerHeight / 2;
      const target = document.elementFromPoint(x, y) ?? document.body;
      for (const d of deltas) {
        target.dispatchEvent(
          new WheelEvent("wheel", { deltaY: d, deltaMode: 0, clientX: x, clientY: y, bubbles: true, cancelable: true }),
        );
        await new Promise((r) => setTimeout(r, intervalMs));
      }
    },
    { deltas, intervalMs },
  );
}

/** A trackpad flick: ramps up, then a long inertia tail. */
export async function trackpadFlick(page: Page, direction: 1 | -1 = 1) {
  const deltas = [2, 6, 14, 30, 50, 60, 55, 45, 38, 30, 24, 18, 14, 10, 8, 6, 5, 4, 3, 2, 2, 1, 1, 1];
  const tail = Array.from({ length: 50 }, () => 1);
  await wheel(page, [...deltas, ...tail].map((d) => d * direction));
}

/**
 * Touch drag with real touch events (Chromium DevTools protocol). Events carry
 * explicit timestamps, so speed-based gestures (flicks) behave the same on a
 * slow test machine as on a real phone.
 */
export async function touchDrag(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
  { steps = 8, stepMs = 16, holdMs = 0 } = {},
) {
  const cdp = await page.context().newCDPSession(page);
  const t0 = Date.now() / 1000;
  const at = (ms: number) => t0 + ms / 1000;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [from], timestamp: at(0) });
  for (let i = 1; i <= steps; i++) {
    const p = { x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps };
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [p], timestamp: at(i * stepMs) });
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
    timestamp: at(steps * stepMs + stepMs + holdMs),
  });
  await cdp.detach();
}
