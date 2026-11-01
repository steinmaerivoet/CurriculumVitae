import type { APIRoute, GetStaticPaths } from "astro";
import { getCv } from "@/core";
import { cvSlug } from "@/bff/shared/files";
import { buildPdfModel } from "@/bff/pdf/document";
import { styledQrPng } from "@/qr/styledQr";
import { renderCvPdf } from "@/pdf/render";

// Rendered once at build time from the same content as the site, with the
// site's own QR code (light colours, best for print) in the header.
export const getStaticPaths: GetStaticPaths = () => [{ params: { file: cvSlug(getCv()) } }];

export const GET: APIRoute = async () => {
  const model = buildPdfModel(getCv());
  const qrPng = styledQrPng(model.website.url, 600);
  return new Response(new Uint8Array(await renderCvPdf(model, { qrPng })), {
    headers: { "Content-Type": "application/pdf" },
  });
};
