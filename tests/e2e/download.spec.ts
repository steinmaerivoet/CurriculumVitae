import { expect, test } from "@playwright/test";
import { downloadViaPreview } from "./downloads";

test("corner button previews and downloads the PDF CV generated from data.yaml", async ({ page }) => {
  await page.goto("/");
  const download = await downloadViaPreview(page, /Download CV/);
  expect(download.suggestedFilename()).toBe("stein-maerivoet-curriculum-vitae.pdf");

  const response = await page.request.get("/stein-maerivoet-curriculum-vitae.pdf");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("application/pdf");
  expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
});

test("download button stays visible on every slide", async ({ page }) => {
  await page.goto("/#contact");
  await expect(page.getByRole("link", { name: /Download CV/ })).toBeVisible();
});

test("the PDF preview shows every page and scrolls without moving the slideshow", async ({ page }, info) => {
  await page.goto("/#about");
  await page.getByRole("link", { name: /Download CV/ }).click();
  const dialog = page.getByRole("dialog", { name: /Download CV/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("figure")).toHaveCount(2);
  await expect(dialog.locator("figcaption").last()).toHaveText("Page 2 of 2");

  const body = dialog.locator(".dlm-body");
  if (info.project.name === "desktop" || info.project.name === "laptop") {
    await body.hover();
    await page.mouse.wheel(0, 800);
  } else {
    await body.evaluate((el) => el.scrollBy(0, 800));
  }
  await expect.poll(() => body.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await page.waitForTimeout(600);
  expect(new URL(page.url()).hash).toBe("#about");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
