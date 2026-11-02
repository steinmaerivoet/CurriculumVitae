import { test, expect } from "@playwright/test";
import { SLIDES, activeIndex, deckHeight, expectAtRestOn, openDeck, trackY, trackpadFlick, wheel } from "./helpers";

test.describe("snapping with mouse, trackpad and keyboard", () => {
  test.skip(({ isMobile }) => isMobile, "desktop input");

  test("magnet: one wheel click pulls the page along, then springs back", async ({ page }) => {
    await openDeck(page);
    await page.mouse.move(600, 400);
    await page.mouse.wheel(0, 100);
    await expect.poll(() => trackY(page), { timeout: 1000 }).toBeLessThan(-20); // pulled towards slide 2
    await expectAtRestOn(page, 0); // let go: back where it was
  });

  test("magnet: scrolling on past the pull point commits to the next slide", async ({ page }) => {
    await openDeck(page);
    await page.mouse.move(600, 400);
    await wheel(page, [100, 100], 90); // two quick clicks of a mouse wheel
    await expectAtRestOn(page, 1);
    await page.waitForTimeout(500);
    await wheel(page, [-100, -100], 90);
    await expectAtRestOn(page, 0);
  });

  test("glide: one more wheel click pulls the glide along but doesn't carry on", async ({ page }) => {
    await openDeck(page);
    await page.mouse.move(600, 400);
    await wheel(page, [100, 100, 100], 90);
    await expectAtRestOn(page, 1);
  });

  test("glide: spinning the wheel on carries on without waiting for the glide", async ({ page }) => {
    await openDeck(page);
    await page.mouse.move(600, 400);
    await wheel(page, [100, 100, 100, 100, 100], 90); // two clicks to go, three more to carry on mid-glide
    await expectAtRestOn(page, 2);
  });

  test("glide: scrolling back mid-glide turns the page around", async ({ page }) => {
    await openDeck(page);
    await page.mouse.move(600, 400);
    await wheel(page, [100, 100, -100, -100], 90); // the last two land mid-glide
    await expectAtRestOn(page, 0);
  });

  test("glide: turning around and carrying on never jumps the page", async ({ page }) => {
    await openDeck(page, "about");
    await page.mouse.move(600, 400);
    const h = await deckHeight(page);
    // Record the track every frame while the wheel steers the glide.
    const record = page.evaluate(
      () =>
        new Promise<number[]>((resolve) => {
          const el = document.querySelector<HTMLElement>(".deck-track")!;
          const ys: number[] = [];
          const t0 = performance.now();
          const tick = () => {
            ys.push(new DOMMatrixReadOnly(getComputedStyle(el).transform).m42);
            if (performance.now() - t0 < 2500) requestAnimationFrame(tick);
            else resolve(ys);
          };
          requestAnimationFrame(tick);
        }),
    );
    await wheel(page, [100, 100, -100, -100, 100, 100, 100], 90);
    const ys = await record;
    // Speed changes gradually: no frame moves the page much further than the one before.
    const steps = ys.slice(1).map((y, i) => y - ys[i]!);
    const jolts = steps.slice(1).map((d, i) => Math.abs(d - steps[i]!));
    expect(Math.max(...jolts)).toBeLessThan(h * 0.04);
    await expectAtRestOn(page, await activeIndex(page));
  });

  test("glide: a trackpad flick back mid-glide turns the page around", async ({ page }) => {
    await openDeck(page, "about");
    await page.mouse.move(600, 400);
    await wheel(page, [100, 100], 90);
    await page.waitForTimeout(200);
    await trackpadFlick(page, -1);
    await expectAtRestOn(page, 1);
  });

  test("glide: a second trackpad flick mid-glide moves on one more slide", async ({ page }) => {
    await openDeck(page);
    await page.mouse.move(600, 400);
    await trackpadFlick(page, 1);
    await expectAtRestOn(page, 1);
    // A new flick while the first one's glide is still running.
    const flick = [2, 6, 14, 30, 50, 60, 55, 45, 38, 30, 24, 18, 14, 10, 8, 6, 5, 4, 3, 2, 2, 1, 1, 1];
    await wheel(page, [...flick.slice(0, 8), ...flick, ...Array.from({ length: 50 }, () => 1)]);
    await expectAtRestOn(page, 3);
  });

  test("magnet: a gentle trackpad scroll springs back", async ({ page }) => {
    await openDeck(page);
    await page.mouse.move(600, 400);
    await wheel(page, Array.from({ length: 12 }, () => 6));
    expect(await trackY(page)).toBeLessThan(-5); // it follows the scroll
    await expectAtRestOn(page, 0);
  });

  test("a trackpad flick with inertia moves exactly one slide", async ({ page }) => {
    await openDeck(page);
    await page.mouse.move(600, 400);
    await trackpadFlick(page, 1);
    await expectAtRestOn(page, 1);
    await page.waitForTimeout(400);
    await trackpadFlick(page, -1);
    await expectAtRestOn(page, 0);
  });

  test("keyboard: arrows, page keys, space, home and end", async ({ page }) => {
    await openDeck(page);
    await page.keyboard.press("ArrowDown");
    await expectAtRestOn(page, 1);
    await page.keyboard.press("PageDown");
    await expectAtRestOn(page, 2);
    await page.keyboard.press("ArrowUp");
    await expectAtRestOn(page, 1);
    await page.keyboard.press("End");
    await expectAtRestOn(page, SLIDES.length - 1);
    await page.keyboard.press("Home");
    await expectAtRestOn(page, 0);
  });

  test("dots and deep links go straight to a slide", async ({ page }) => {
    await openDeck(page, "projects");
    await expectAtRestOn(page, SLIDES.indexOf("projects"));
    await page.getByRole("navigation", { name: "Slides" }).getByRole("button").nth(1).click();
    await expectAtRestOn(page, 1);
    await expect(page).toHaveURL(/#about$/);
  });

  test("pulling past the first slide springs back", async ({ page }) => {
    await openDeck(page);
    await page.mouse.move(600, 400);
    await trackpadFlick(page, -1);
    await expectAtRestOn(page, 0);
  });

  test("slides sit on one page: neighbours stay attached while gliding", async ({ page }) => {
    await openDeck(page);
    const h = await deckHeight(page);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(400); // mid-glide
    const y = await trackY(page);
    expect(y).toBeLessThan(-5);
    expect(y).toBeGreaterThan(-h + 5);
    const [a, b] = await page.evaluate(() =>
      [...document.querySelectorAll(".slide")].slice(0, 2).map((s) => s.getBoundingClientRect()),
    );
    expect(Math.abs(a!.bottom - b!.top)).toBeLessThan(1);
    await expectAtRestOn(page, 1);
  });

  test("never comes to rest between two slides", async ({ page }) => {
    await openDeck(page);
    await page.mouse.move(600, 400);
    const h = await deckHeight(page);
    const inputs = [
      () => page.mouse.wheel(0, 120),
      () => page.mouse.wheel(0, 40),
      () => page.keyboard.press("ArrowDown"),
      () => trackpadFlick(page, 1),
      () => page.mouse.wheel(0, -90),
      () => trackpadFlick(page, -1),
      () => page.keyboard.press("PageDown"),
    ];
    for (const input of inputs) {
      await input();
      await page.waitForTimeout(1300);
      const y = await trackY(page);
      const i = await activeIndex(page);
      expect(Math.abs(y - -i * h)).toBeLessThan(1);
    }
  });
});
