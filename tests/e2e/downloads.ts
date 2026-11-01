import { expect, type Page } from "@playwright/test";

/**
 * Clicks a corner download button, checks that it opens the preview dialog
 * with the file's images, and downloads from the dialog's Download button.
 */
export async function downloadViaPreview(page: Page, name: RegExp) {
  const button = page.getByRole("link", { name });
  await expect(button).toBeVisible();
  await button.click();

  const dialog = page.getByRole("dialog", { name });
  await expect(dialog).toBeVisible();
  const first = dialog.locator("img").first();
  await expect.poll(() => first.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

  const [download] = await Promise.all([page.waitForEvent("download"), dialog.getByRole("link", { name: "Download", exact: true }).click()]);
  await expect(dialog).toBeHidden();
  return download;
}
