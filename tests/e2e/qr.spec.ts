import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { expect, test } from "@playwright/test";
import { prepareZXingModule, readBarcodes } from "zxing-wasm/reader";

// Load the decoder from node_modules instead of a CDN.
const wasm = readFileSync(createRequire(import.meta.url).resolve("zxing-wasm/reader/zxing_reader.wasm"));
prepareZXingModule({ overrides: { wasmBinary: wasm.buffer }, fireImmediately: true });

const decode = async (bytes: Buffer, type: string) => {
  const [result] = await readBarcodes(new Blob([new Uint8Array(bytes)], { type }), {
    formats: ["QRCode"],
    tryInvert: true,
  });
  return result;
};

test("corner button downloads a QR code that scans to the site", async ({ page }) => {
  await page.goto("/");
  const button = page.getByRole("link", { name: /Download QR code/ });
  await expect(button).toBeVisible();

  const [download] = await Promise.all([page.waitForEvent("download"), button.click()]);
  expect(download.suggestedFilename()).toBe("stein-maerivoet-qr-code.png");

  const response = await page.request.get("/stein-maerivoet-qr-code.png");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("image/png");

  const result = await decode(await response.body(), "image/png");
  expect(result?.text).toBe("https://steinmaerivoet.dev");
  // High error correction keeps it readable with the logo in the middle.
  expect(result?.ecLevel).toBe("H");
});

test("QR code also ships as SVG", async ({ page }) => {
  const response = await page.request.get("/stein-maerivoet-qr-code.svg");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("image/svg+xml");
  expect((await response.text()).startsWith("<svg")).toBe(true);
});

test("both download buttons sit in the corner on every slide", async ({ page }) => {
  await page.goto("/#contact");
  const qr = page.getByRole("link", { name: /Download QR code/ });
  const cv = page.getByRole("link", { name: /Download CV/ });
  await expect(qr).toBeVisible();
  await expect(cv).toBeVisible();
  const [q, c] = [await qr.boundingBox(), await cv.boundingBox()];
  expect(q!.y + q!.height).toBeLessThanOrEqual(c!.y);
});
