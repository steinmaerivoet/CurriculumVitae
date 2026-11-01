import type { Cv } from "@/core";
import { slug } from "@/core/matching";
import { apiPath } from "../api/resources";

/**
 * Names and paths of the files the site publishes next to its pages.
 * Shared by the pages that generate them and the links that point to them.
 */

/** "Stein Maerivoet" → "stein-maerivoet-curriculum-vitae" */
export const cvSlug = (cv: Pick<Cv, "person">): string => slug(`${cv.person.firstName} ${cv.person.lastName} curriculum vitae`);

/** "Stein Maerivoet" → "stein-maerivoet-qr-code" */
export const qrSlug = (cv: Pick<Cv, "person">): string => cvSlug(cv).replace(/-curriculum-vitae$/, "-qr-code");

/** "Stein Maerivoet" → "stein-maerivoet-share-card": the Open Graph image. */
export const shareSlug = (cv: Pick<Cv, "person">): string => cvSlug(cv).replace(/-curriculum-vitae$/, "-share-card");

/** Width and height of the QR code PNG: large enough for print, small enough to share. */
export const QR_PNG_SIZE = 2048;

/** "stein-maerivoet-curriculum-vitae-page-1": an image of one page of the PDF, for its preview. */
export const pdfPageSlug = (cv: Pick<Cv, "person">, page: number): string => `${cvSlug(cv)}-page-${page}`;

export const files = (cv: Pick<Cv, "person">) => ({
  pdf: `/${cvSlug(cv)}.pdf`,
  qrPng: `/${qrSlug(cv)}.png`,
  qrSvg: `/${qrSlug(cv)}.svg`,
  shareImage: `/${shareSlug(cv)}.png`,
  api: apiPath("cv"),
});
