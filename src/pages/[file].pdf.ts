import type { APIRoute, GetStaticPaths } from "astro";
import { getCv } from "@/core";
import { cvSlug } from "@/bff/shared/files";
import { cvPdf } from "@/pdf/build";

// Rendered once at build time from the same content as the site (see src/pdf/build.ts).
export const getStaticPaths: GetStaticPaths = () => [{ params: { file: cvSlug(getCv()) } }];

export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await cvPdf(getCv())), { headers: { "Content-Type": "application/pdf" } });
