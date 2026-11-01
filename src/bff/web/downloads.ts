import type { Cv } from "@/core";
import { SHARE_CARD } from "../seo";
import { cvSlug, files, QR_PNG_SIZE, qrSlug, shareSlug } from "../shared/files";

/**
 * The download buttons in the bottom-right corner, top to bottom: the PDF CV,
 * the QR code and the share card, each with a preview image. Labels come from data.yaml; the detail line
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
  /** A small image of the file, shown next to the button on hover. Width and height give its shape. */
  preview: { src: string; width: number; height: number };
};

export function buildDownloads(cv: Cv): Download[] {
  const f = files(cv);
  const { width, height } = SHARE_CARD;
  return [
    {
      id: "cv",
      label: cv.ui.downloadCv,
      detail: "PDF · A4",
      href: f.pdf,
      filename: `${cvSlug(cv)}.pdf`,
      preview: { src: f.pdfPreview, width: 210, height: 297 },
    },
    {
      id: "qr",
      label: cv.ui.downloadQr,
      detail: `PNG · ${QR_PNG_SIZE} × ${QR_PNG_SIZE}`,
      href: f.qrPng,
      filename: `${qrSlug(cv)}.png`,
      preview: { src: f.qrSvg, width: 1, height: 1 },
    },
    {
      id: "share",
      label: cv.ui.downloadShareCard,
      detail: `PNG · ${width} × ${height}`,
      href: f.shareImage,
      filename: `${shareSlug(cv)}.png`,
      preview: { src: f.sharePreview, width, height },
    },
  ];
}
