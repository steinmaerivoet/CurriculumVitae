import { test, expect } from "@playwright/test";
import { SLIDES, expectAtRestOn, openDeck } from "./helpers";

test("experience: every employer and every project fits, and the list never moves", async ({ page, isMobile }) => {
  await openDeck(page, "experience");
  await expectAtRestOn(page, SLIDES.indexOf("experience"));
  await page.waitForTimeout(1500); // reveal finished
  const slide = page.locator("#experience");
  // Position within the slide's content (phones may scroll the content itself).
  const listTop = () =>
    slide.getByRole("tablist").evaluate((el) => {
      const s = el.closest(".slide-scroll")!;
      return el.getBoundingClientRect().top - s.getBoundingClientRect().top + s.scrollTop;
    });
  const overflow = () =>
    slide.locator(".slide-scroll").evaluate((s) => s.scrollHeight - s.clientHeight);
  const top = await listTop();

  const employers = slide.getByRole("tab");
  const n = await employers.count();
  expect(n).toBeGreaterThan(1);
  for (let i = 0; i < n; i++) {
    await employers.nth(i).click();
    const projects = slide.locator("#experience-panel button[aria-expanded]");
    const p = await projects.count();
    for (let j = 0; j < Math.max(1, p); j++) {
      if (p && (await projects.nth(j).getAttribute("aria-expanded")) !== "true") await projects.nth(j).click();
      await page.waitForTimeout(700);
      expect(await listTop()).toBeCloseTo(top, 0);
      if (!isMobile) expect(await overflow(), `employer ${i}, project ${j}`).toBeLessThanOrEqual(1);
    }
  }
});
