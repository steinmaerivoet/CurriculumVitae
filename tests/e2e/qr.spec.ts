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

test("corner button downloads the share card, and its QR code scans to the site", async ({ page }) => {
  await page.goto("/");
  const button = page.getByRole("link", { name: /Download share card/ });
  await expect(button).toBeVisible();

  const [download] = await Promise.all([page.waitForEvent("download"), button.click()]);
  expect(download.suggestedFilename()).toBe("stein-maerivoet-share-card.png");

  const response = await page.request.get("/stein-maerivoet-share-card.png");
  expect(response.ok()).toBe(true);
  const result = await decode(await response.body(), "image/png");
  expect(result?.text).toBe("https://steinmaerivoet.dev");
});

test("the three downloads are stacked CV, QR code, share card, and open on the contact slide", async ({ page }, info) => {
  await page.goto("/#contact");
  const buttons = [/Download CV/, /Download QR code/, /Download share card/].map((name) => page.getByRole("link", { name }));
  const boxes = [];
  for (const b of buttons) {
    await expect(b).toBeVisible();
    boxes.push((await b.boundingBox())!);
  }
  expect(boxes[0]!.y + boxes[0]!.height).toBeLessThanOrEqual(boxes[1]!.y);
  expect(boxes[1]!.y + boxes[1]!.height).toBeLessThanOrEqual(boxes[2]!.y);

  // Desktop and laptop show the label and format next to the logo; phones keep the logos only.
  const label = page.locator(".dl-cv .dl-label");
  if (info.project.name === "desktop" || info.project.name === "laptop") {
    await expect(async () => expect((await buttons[0]!.boundingBox())!.width).toBeGreaterThan(200)).toPass();
    await expect(label).toHaveCSS("opacity", "1");
  } else {
    expect(boxes[0]!.width).toBeLessThan(50);
  }
});
