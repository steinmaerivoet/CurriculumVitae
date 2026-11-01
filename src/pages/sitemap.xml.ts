import type { APIRoute } from "astro";
import { getCv } from "@/core";
import { files } from "@/bff/shared/files";

/**
 * The pages worth indexing: the CV (every theme points its canonical URL at
 * "/", so the themes are not listed separately) and the PDF.
 */
export const GET: APIRoute = () => {
  const cv = getCv();
  const urls = ["/", files(cv).pdf].map((path) => `  <url><loc>${new URL(path, cv.meta.url)}</loc></url>`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
