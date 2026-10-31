import { test, expect } from "@playwright/test";
import { SLIDES, expectAtRestOn, openDeck } from "./helpers";

for (const [i, id] of SLIDES.entries()) {
  test(`${id}: fits the screen and has no sideways overflow`, async ({ page, isMobile }, info) => {
    await openDeck(page, id);
    await expectAtRestOn(page, i);
    await page.waitForTimeout(1800); // reveal finished

    const docOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(docOverflow).toBeLessThanOrEqual(0);

    // Nothing in the slide may stick out sideways (carousels scroll inside themselves).
    const wide = await page.evaluate((sid) => {
      const slide = document.getElementById(sid)!;
      const vw = window.innerWidth;
      return [...slide.querySelectorAll<HTMLElement>("h1,h2,h3,p,li,a,button")]
        .filter((el) => !el.closest("[data-carousel]"))
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.right > vw + 1 || r.left < -1);
        })
        .map((el) => el.textContent?.trim().slice(0, 40));
    }, id);
    expect(wide).toEqual([]);

    // On desktop and laptop every slide fits without scrolling.
    if (!isMobile) {
      const overflow = await page.evaluate((sid) => {
        const s = document.getElementById(sid)!.querySelector<HTMLElement>(".slide-scroll")!;
        return s.scrollHeight - s.clientHeight;
      }, id);
      expect(overflow).toBeLessThanOrEqual(1);
    }

    await page.screenshot({ path: `test-results/screens/${info.project.name}-${String(i).padStart(2, "0")}-${id}.png` });
  });
}
