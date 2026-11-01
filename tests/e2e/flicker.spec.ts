import { test, expect, type Page } from "@playwright/test";
import { SLIDES, expectAtRestOn, openDeck } from "./helpers";

/**
 * Switching inside a slide (employers, skill filters, skills, projects) may
 * fade the new content in, but nothing may flicker: once a switch has
 * started, an element only gets more opaque until the next click. Clicking
 * through quickly is the hard case, because an earlier fade that is still
 * running must not fight the new one (that made the Plain experience panel
 * blink between both).
 */
const THEMES = [
  { id: "plain", path: "/" },
  { id: "terminal", path: "/terminal/" },
  { id: "reference", path: "/api-reference/" },
  { id: "git", path: "/commit-graph/" },
] as const;

const CONTROLS = "[role=tab], button[aria-expanded], button[aria-pressed], [role=option]";

/** Records every frame the opacity of each element on screen in the slide, and which frames follow a click. */
async function sampleFrames(page: Page, slideId: string) {
  await page.evaluate((id) => {
    const slide = document.getElementById(id)!;
    const w = window as unknown as { __frames: { click: boolean; o: Map<Element, number> }[]; __clicked: boolean };
    w.__frames = [];
    w.__clicked = false;
    document.addEventListener("pointerdown", () => (w.__clicked = true), true);
    const loop = () => {
      const o = new Map<Element, number>();
      for (const el of slide.querySelectorAll("*")) {
        const r = el.getBoundingClientRect();
        if (r.width && r.bottom > 0 && r.top < innerHeight) o.set(el, Number(getComputedStyle(el).opacity));
      }
      w.__frames.push({ click: w.__clicked, o });
      w.__clicked = false;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, slideId);
}

/** Elements whose opacity dropped while no switch was starting. */
async function flickers(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as { __frames: { click: boolean; o: Map<Element, number> }[] };
    const last = new Map<Element, number>();
    const found = new Set<string>();
    let sinceClick = Infinity;
    for (const { click, o } of w.__frames) {
      sinceClick = click ? 0 : sinceClick + 1;
      for (const [el, v] of o) {
        const prev = last.get(el);
        // A switch may reset its content in the frames right after the click.
        if (prev !== undefined && v < prev - 0.15 && sinceClick > 2) {
          found.add(`${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 30)}" ${prev.toFixed(2)} → ${v.toFixed(2)}`);
        }
        last.set(el, v);
      }
      for (const el of [...last.keys()]) if (!o.has(el)) last.delete(el);
    }
    return [...found].slice(0, 5);
  });
}

for (const theme of THEMES) {
  for (const slideId of ["experience", "skills", "projects"] as const) {
    test(`${theme.id}: switching on the ${slideId} slide never flickers`, async ({ page }) => {
      await openDeck(page, slideId, theme.path);
      await expectAtRestOn(page, SLIDES.indexOf(slideId));
      await page.waitForTimeout(1500); // reveal finished
      const controls = page.locator(`#${slideId}`).locator(CONTROLS);
      const n = await controls.count();
      test.skip(n < 2, "nothing to switch on this slide");

      await sampleFrames(page, slideId);
      // Faster than the fades last, back and forth.
      for (const i of [1, 2, 1, 0, 2, 1]) {
        const c = controls.nth(i % n);
        if (!(await c.isVisible())) continue;
        await c.click();
        await page.waitForTimeout(150);
      }
      await page.waitForTimeout(1500);
      expect(await flickers(page)).toEqual([]);
    });
  }
}
