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
