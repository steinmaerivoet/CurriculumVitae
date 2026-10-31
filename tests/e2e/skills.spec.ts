import { test, expect } from "@playwright/test";
import { SLIDES, expectAtRestOn, openDeck } from "./helpers";

test("filters narrow the board to one group", async ({ page }) => {
  await openDeck(page, "skills");
  await expectAtRestOn(page, SLIDES.indexOf("skills"));
  const board = page.locator("#skills [data-tile]");
  await page.locator("#skills").getByRole("tab", { name: /Cloud & platform/ }).click();
  await page.waitForTimeout(800);
  const visible = await board.evaluateAll((els) => els.filter((e) => (e as HTMLElement).style.display !== "none").length);
  const expected = await page.locator("#skills").getByRole("tab", { name: /Cloud & platform/ }).locator("span").innerText();
  expect(visible).toBe(Number(expected));
});

test("selecting a skill shows its level and where it was used", async ({ page, isMobile }) => {
  await openDeck(page, "skills");
  await expectAtRestOn(page, SLIDES.indexOf("skills"));
  await page.locator("#skills").getByRole("tab", { name: /Cloud & platform/ }).click();
  await page.waitForTimeout(700);
  await page.locator("#skills").getByRole("button", { name: /Kubernetes/ }).click();
  const detail = page.locator("#skills").getByRole("heading", { name: "Kubernetes", level: 3 }).locator("visible=true");
  await expect(detail).toBeVisible();
  await expect(page.locator("#skills").getByText("Lead Engineer").locator("visible=true").first()).toBeVisible();
  if (isMobile) {
    // The card must be on screen, not below the fold.
    const box = await detail.boundingBox();
    const vh = page.viewportSize()!.height;
    expect(box!.y).toBeGreaterThan(0);
    expect(box!.y + box!.height).toBeLessThan(vh);
  }
});
