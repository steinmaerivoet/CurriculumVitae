import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { prepareZXingModule, readBarcodes } from "zxing-wasm/reader";
import { buildPdfModel } from "@/bff/pdf/document";
import { styledQrPng } from "@/qr/styledQr";
import { renderCvPdf } from "@/pdf/render";
import { cv } from "./fixture";

// Load the decoder from node_modules instead of a CDN.
const wasm = readFileSync(createRequire(import.meta.url).resolve("zxing-wasm/reader/zxing_reader.wasm"));
prepareZXingModule({ overrides: { wasmBinary: wasm.buffer }, fireImmediately: true });

/** Someone with only the PDF must be able to reach the site: by clicking or by scanning. */
describe("PDF CV", () => {
  const model = buildPdfModel(cv);
  const qrPng = styledQrPng(model.website.url, 600);

  it("puts the site's QR code in the header, and it scans to the site", async () => {
    const [result] = await readBarcodes(new Blob([new Uint8Array(qrPng)], { type: "image/png" }), { formats: ["QRCode"] });
    expect(result?.text).toBe(cv.meta.url);
    expect(model.website.caption).toBe(cv.ui.pdfQrCaption);
  });

  it("links to the site", async () => {
    const pdf = (await renderCvPdf(model, { qrPng })).toString("latin1");
    expect(pdf.startsWith("%PDF-")).toBe(true);
    expect(pdf).toContain(`/URI (${cv.meta.url})`);
  }, 30_000);
});
