import { createCanvas } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * Every page of a PDF as a PNG, `width` pixels wide: the preview shown before
 * the CV is downloaded. Rasterised with pdf.js at build time, so visitors see
 * the pages in any browser, phones included, without a PDF viewer.
 */
export async function pdfPagesPng(pdf: Uint8Array, width: number): Promise<Uint8Array[]> {
  const doc = await getDocument({ data: new Uint8Array(pdf), verbosity: 0 }).promise;
  try {
    const out: Uint8Array[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });
      const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
      await page.render({ canvas: canvas as unknown as HTMLCanvasElement, viewport }).promise;
      out.push(new Uint8Array(canvas.toBuffer("image/png")));
    }
    return out;
  } finally {
    await doc.destroy();
  }
}
