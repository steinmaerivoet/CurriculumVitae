import { createCanvas } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * The first page of a PDF as a PNG, `width` pixels wide: the preview next to
 * the "Download CV" button. Rasterised with pdf.js at build time, so the
 * preview is always the PDF that the button downloads.
 */
export async function pdfFirstPagePng(pdf: Uint8Array, width: number): Promise<Uint8Array> {
  const doc = await getDocument({ data: new Uint8Array(pdf), verbosity: 0 }).promise;
  try {
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });
    const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
    await page.render({ canvas: canvas as unknown as HTMLCanvasElement, viewport }).promise;
    return new Uint8Array(canvas.toBuffer("image/png"));
  } finally {
    await doc.destroy();
  }
}
