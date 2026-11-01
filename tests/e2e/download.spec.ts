import { expect, test } from "@playwright/test";

test("corner button downloads the PDF CV generated from data.yaml", async ({ page }) => {
  await page.goto("/");
  const button = page.getByRole("link", { name: /Download CV/ });
  await expect(button).toBeVisible();

  const [download] = await Promise.all([page.waitForEvent("download"), button.click()]);
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
