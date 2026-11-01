import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { expect, test } from "@playwright/test";
import { prepareZXingModule, readBarcodes } from "zxing-wasm/reader";
import { downloadViaPreview } from "./downloads";

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

test("corner button previews and downloads a QR code that scans to the site", async ({ page }) => {
  await page.goto("/");
  const download = await downloadViaPreview(page, /Download QR code/);
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

test("corner button previews and downloads the share card, and its QR code scans to the site", async ({ page }) => {
  await page.goto("/");
  const download = await downloadViaPreview(page, /Download share card/);
  expect(download.suggestedFilename()).toBe("stein-maerivoet-share-card.png");

  const response = await page.request.get("/stein-maerivoet-share-card.png");
  expect(response.ok()).toBe(true);
  const result = await decode(await response.body(), "image/png");
  expect(result?.text).toBe("https://steinmaerivoet.dev");
});

test("the three downloads are small, stacked CV, QR code, share card, and grow on hover", async ({ page }, info) => {
  await page.goto("/#contact");
  const buttons = [/Download CV/, /Download QR code/, /Download share card/].map((name) => page.getByRole("link", { name }));
  for (const b of buttons) await expect(b).toBeVisible();
  // The column slides in with the rest of the chrome: measure once it has settled,
  // and all three in the same frame, so the boxes are comparable.
  const column = page.locator(".downloads");
  await column.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
  const measure = () =>
    column.evaluate((el) => [...el.querySelectorAll(".dl")].map((a) => a.getBoundingClientRect().toJSON() as { x: number; y: number; width: number; height: number }));
  const boxes = await measure();
  expect(boxes[0]!.y + boxes[0]!.height).toBeLessThanOrEqual(boxes[1]!.y);
  expect(boxes[1]!.y + boxes[1]!.height).toBeLessThanOrEqual(boxes[2]!.y);
  // At rest they are logos only.
  for (const box of boxes) expect(box.width).toBeLessThan(44);

  // Where a pointer can hover, a button grows to show its label, and its neighbours stay put.
  if (info.project.name !== "desktop" && info.project.name !== "laptop") return;
  await buttons[0]!.hover();
  await expect(async () => expect((await buttons[0]!.boundingBox())!.width).toBeGreaterThan(200)).toPass();
  await expect(page.locator(".dl-cv .dl-label")).toHaveCSS("opacity", "1");
  expect((await measure())[1]).toEqual(boxes[1]);
});

test("the PDF preview pages are images", async ({ page }) => {
  for (const path of ["/stein-maerivoet-curriculum-vitae-page-1.png", "/stein-maerivoet-curriculum-vitae-page-2.png"]) {
    const response = await page.request.get(path);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("image/png");
  }
});
