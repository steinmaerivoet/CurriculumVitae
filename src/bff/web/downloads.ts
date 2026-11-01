import type { Cv } from "@/core";
import { SHARE_CARD } from "../seo";
import { cvSlug, files, pdfPageSlug, QR_PNG_SIZE, qrSlug, shareSlug } from "../shared/files";

/**
 * The download buttons in the bottom-right corner, top to bottom: the PDF CV,
 * the QR code and the share card. A click first opens a preview of the file,
 * and the download starts from there. Labels come from data.yaml; the detail
 * line (format and size) and the preview images are derived from how the
 * files are generated.
 */
export type DownloadId = "cv" | "qr" | "share";

export type PreviewImage = { src: string; width: number; height: number; caption?: string };

export type Download = {
  id: DownloadId;
  label: string;
  /** "PDF · A4", "PNG · 2048 × 2048" */
  detail: string;
  href: string;
  /** Name the browser saves the file under. */
  filename: string;
  /** What the preview shows: one image, or every page of the PDF. */
  preview: PreviewImage[];
};

export type DownloadsModel = {
  items: Download[];
  /** The dialog's buttons. */
  downloadAction: string;
  closeAction: string;
};

/** `pdfPages` is how many pages the rendered PDF has (known once it is built). */
export function buildDownloads(cv: Cv, { pdfPages }: { pdfPages: number }): DownloadsModel {
  const f = files(cv);
  const { width, height } = SHARE_CARD;
  const A4 = { width: 210, height: 297 };
  const pageCaption = (page: number) => cv.ui.previewPage.replace("{page}", String(page)).replace("{pages}", String(pdfPages));
  return {
    downloadAction: cv.ui.downloadAction,
    closeAction: cv.ui.closeAction,
    items: [
      {
        id: "cv",
        label: cv.ui.downloadCv,
        detail: "PDF · A4",
        href: f.pdf,
        filename: `${cvSlug(cv)}.pdf`,
        preview: Array.from({ length: pdfPages }, (_, i) => ({ src: `/${pdfPageSlug(cv, i + 1)}.png`, ...A4, caption: pageCaption(i + 1) })),
      },
      {
        id: "qr",
        label: cv.ui.downloadQr,
        detail: `PNG · ${QR_PNG_SIZE} × ${QR_PNG_SIZE}`,
        href: f.qrPng,
        filename: `${qrSlug(cv)}.png`,
        preview: [{ src: f.qrPng, width: QR_PNG_SIZE, height: QR_PNG_SIZE }],
      },
      {
        id: "share",
        label: cv.ui.downloadShareCard,
        detail: `PNG · ${width} × ${height}`,
        href: f.shareImage,
        filename: `${shareSlug(cv)}.png`,
        preview: [{ src: f.shareImage, width, height }],
      },
    ],
  };
}
