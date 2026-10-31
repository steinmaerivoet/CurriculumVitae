import type { APIRoute, GetStaticPaths } from "astro";
import { getCv } from "@/core";
import { cvSlug } from "@/bff/shared/files";
import { buildPdfModel } from "@/bff/pdf/document";
import { renderCvPdf } from "@/pdf/render";

// Rendered once at build time from the same content as the site.
export const getStaticPaths: GetStaticPaths = () => [{ params: { file: cvSlug(getCv()) } }];

export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await renderCvPdf(buildPdfModel(getCv()))), {
    headers: { "Content-Type": "application/pdf" },
  });
