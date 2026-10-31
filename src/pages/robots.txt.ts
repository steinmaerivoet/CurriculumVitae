import type { APIRoute } from "astro";
import { getCv } from "@/core";

/** Everything may be crawled; the sitemap names the one canonical page. */
export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL("/sitemap.xml", getCv().meta.url)}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
