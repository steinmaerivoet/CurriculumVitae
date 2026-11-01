import type { APIRoute, GetStaticPaths } from "astro";
import { getCv } from "@/core";
import { cvSlug, PREVIEW_WIDTH, QR_PNG_SIZE, qrSlug, shareSlug } from "@/bff/shared/files";
import { buildPdfModel } from "@/bff/pdf/document";
import { buildShareCard } from "@/bff/seo";
import { styledQrPng } from "@/qr/styledQr";
import { shareCardPng } from "@/og/shareCard";
import { renderCvPdf } from "@/pdf/render";
import { pdfFirstPagePng } from "@/pdf/preview";

/**
 * PNG files rendered once at build time:
 * - the styled QR code for the site URL (QR_PNG_SIZE pixels wide);
 * - the share card (Open Graph image) that link previews show;
 * - small previews of the PDF's first page and of the share card, shown next to their download buttons.
 */
const renderers: Record<string, () => Uint8Array | Promise<Uint8Array>> = {
  [qrSlug(getCv())]: () => new Uint8Array(styledQrPng(getCv().meta.url, QR_PNG_SIZE)),
  [shareSlug(getCv())]: () => shareCardPng(buildShareCard(getCv())),
  [`${shareSlug(getCv())}-preview`]: () => shareCardPng(buildShareCard(getCv()), PREVIEW_WIDTH),
  [`${cvSlug(getCv())}-preview`]: async () => {
    // The same PDF as src/pages/[file].pdf.ts, so the preview matches the download.
    const model = buildPdfModel(getCv());
    const pdf = await renderCvPdf(model, { qrPng: styledQrPng(model.website.url, 600) });
    return pdfFirstPagePng(new Uint8Array(pdf), PREVIEW_WIDTH);
  },
};

export const getStaticPaths: GetStaticPaths = () => Object.keys(renderers).map((file) => ({ params: { file } }));

export const GET: APIRoute = async ({ params }) => {
  const render = renderers[params["file"] ?? ""];
  if (!render) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(await render()), { headers: { "Content-Type": "image/png" } });
};
