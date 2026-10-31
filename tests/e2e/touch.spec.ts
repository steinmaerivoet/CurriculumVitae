import { test, expect } from "@playwright/test";
import { SLIDES, deckHeight, expectAtRestOn, openDeck, touchDrag, trackY } from "./helpers";

test.describe("touch", () => {
  test.skip(({ isMobile }) => !isMobile, "touch devices only");

  test("a swipe moves exactly one slide, both ways", async ({ page }) => {
    await openDeck(page);
    const h = await deckHeight(page);
    await touchDrag(page, { x: 180, y: h * 0.75 }, { x: 180, y: h * 0.3 });
    await expectAtRestOn(page, 1);
    await touchDrag(page, { x: 180, y: h * 0.3 }, { x: 180, y: h * 0.75 });
    await expectAtRestOn(page, 0);
  });

  test("the page follows the finger, and a short drag snaps back", async ({ page }) => {
    await openDeck(page);
    const h = await deckHeight(page);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 180, y: h * 0.6 }] });
    for (let i = 1; i <= 6; i++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 180, y: h * 0.6 - i * 10 }] });
      await page.waitForTimeout(30);
    }
    const mid = await trackY(page);
    expect(mid).toBeLessThan(-20); // following the finger
    await page.waitForTimeout(200); // finger rests: no momentum
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expectAtRestOn(page, 0);
  });

  test("a quick flick is enough", async ({ page }) => {
    await openDeck(page);
    const h = await deckHeight(page);
    await touchDrag(page, { x: 180, y: h * 0.6 }, { x: 180, y: h * 0.6 - 90 }, { steps: 5, stepMs: 16 });
    await expectAtRestOn(page, 1);
  });

  test("swiping past the last slide springs back", async ({ page }) => {
    await openDeck(page, "contact");
    const last = SLIDES.length - 1;
    await expectAtRestOn(page, last);
    const h = await deckHeight(page);
    // Scroll any overflowing content to its end first.
    await page.evaluate(() => {
      const s = document.querySelector<HTMLElement>(".slide[data-active='true'] .slide-scroll");
      if (s) s.scrollTop = s.scrollHeight;
    });
    await touchDrag(page, { x: 180, y: h * 0.7 }, { x: 180, y: h * 0.2 });
    await expectAtRestOn(page, last);
  });

  test("swiping sideways through projects does not change the slide", async ({ page }) => {
    await openDeck(page, "projects");
    const i = SLIDES.indexOf("projects");
    await expectAtRestOn(page, i);
    const box = await page.locator("#projects ul").first().boundingBox();
    const y = box!.y + box!.height / 2;
    await touchDrag(page, { x: 320, y }, { x: 60, y: y + 10 });
    await expectAtRestOn(page, i);
  });
});
