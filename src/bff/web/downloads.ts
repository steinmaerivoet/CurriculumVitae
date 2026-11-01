import type { Cv } from "@/core";
import { SHARE_CARD } from "../seo";
import { cvSlug, files, QR_PNG_SIZE, qrSlug, shareSlug } from "../shared/files";

/**
 * The download buttons in the bottom-right corner, top to bottom: the PDF CV,
 * the QR code and the share card. Labels come from data.yaml; the detail line
 * (format and size) is derived from how the files are generated.
 */
export type DownloadId = "cv" | "qr" | "share";

export type Download = {
  id: DownloadId;
  label: string;
  /** "PDF · A4", "PNG · 2048 × 2048" */
  detail: string;
  href: string;
  /** Name the browser saves the file under. */
  filename: string;
};

export function buildDownloads(cv: Cv): Download[] {
  const f = files(cv);
  const { width, height } = SHARE_CARD;
  return [
    { id: "cv", label: cv.ui.downloadCv, detail: "PDF · A4", href: f.pdf, filename: `${cvSlug(cv)}.pdf` },
    { id: "qr", label: cv.ui.downloadQr, detail: `PNG · ${QR_PNG_SIZE} × ${QR_PNG_SIZE}`, href: f.qrPng, filename: `${qrSlug(cv)}.png` },
    { id: "share", label: cv.ui.downloadShareCard, detail: `PNG · ${width} × ${height}`, href: f.shareImage, filename: `${shareSlug(cv)}.png` },
  ];
}
