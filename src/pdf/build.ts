import type { Cv } from "@/core";
import { buildPdfModel } from "@/bff/pdf/document";
import { styledQrPng } from "@/qr/styledQr";
import { pdfPagesPng } from "./preview";
import { renderCvPdf } from "./render";

/**
 * The CV as PDF, rendered once per build and shared by everything that needs
 * it: the PDF download itself and the page images of its preview. Both come
 * from these same bytes, so the preview always shows what gets downloaded.
 */
let pdf: Promise<Uint8Array> | undefined;
export function cvPdf(cv: Cv): Promise<Uint8Array> {
  pdf ??= (async () => {
    const model = buildPdfModel(cv);
    // The site's own QR code (light colours, best for print) in the header.
    const qrPng = styledQrPng(model.website.url, 600);
    return new Uint8Array(await renderCvPdf(model, { qrPng }));
  })();
  return pdf;
}

/** Width in pixels of a preview page: sharp at the dialog's width on retina screens. */
export const PDF_PAGE_WIDTH = 1240;

let pages: Promise<Uint8Array[]> | undefined;
export function cvPdfPages(cv: Cv): Promise<Uint8Array[]> {
  pages ??= cvPdf(cv).then((bytes) => pdfPagesPng(bytes, PDF_PAGE_WIDTH));
  return pages;
}
