import type { APIRoute, GetStaticPaths } from "astro";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { cv } from "@/lib/cv";
import CvDocument from "@/pdf/CvDocument";
import { cvSlug } from "@/pdf/filename";

// Rendered once at build time from src/content/cv.yaml into a static PDF.
export const getStaticPaths: GetStaticPaths = () => [{ params: { file: cvSlug(cv) } }];

export const GET: APIRoute = async () => {
  const pdf = await renderToBuffer(createElement(CvDocument, { cv }) as Parameters<typeof renderToBuffer>[0]);
  return new Response(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf" },
  });
};
