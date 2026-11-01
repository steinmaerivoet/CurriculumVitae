import type { APIRoute, GetStaticPaths } from "astro";
import { getCv } from "@/core";
import { pdfPageSlug, QR_PNG_SIZE, qrSlug, shareSlug } from "@/bff/shared/files";
import { buildShareCard } from "@/bff/seo";
import { styledQrPng } from "@/qr/styledQr";
import { shareCardPng } from "@/og/shareCard";
import { cvPdfPages } from "@/pdf/build";

/**
 * PNG files rendered once at build time:
 * - the styled QR code for the site URL (QR_PNG_SIZE pixels wide);
 * - the share card (Open Graph image) that link previews show;
 * - every page of the PDF, for the preview shown before the CV is downloaded.
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const cv = getCv();
  const pages = await cvPdfPages(cv);
  return [qrSlug(cv), shareSlug(cv), ...pages.map((_, i) => pdfPageSlug(cv, i + 1))].map((file) => ({ params: { file } }));
};

export const GET: APIRoute = async ({ params }) => {
  const cv = getCv();
  const file = params["file"] ?? "";
  if (file === qrSlug(cv)) return png(new Uint8Array(styledQrPng(cv.meta.url, QR_PNG_SIZE)));
  if (file === shareSlug(cv)) return png(shareCardPng(buildShareCard(cv)));
  const pages = await cvPdfPages(cv);
  const page = pages.findIndex((_, i) => pdfPageSlug(cv, i + 1) === file);
  if (page !== -1) return png(pages[page]!);
  return new Response(null, { status: 404 });
};

const png = (bytes: Uint8Array) => new Response(new Uint8Array(bytes), { headers: { "Content-Type": "image/png" } });
