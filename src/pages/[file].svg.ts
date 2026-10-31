import type { APIRoute, GetStaticPaths } from "astro";
import { cv } from "@/lib/cv";
import { qrSlug } from "@/qr/filename";
import { styledQrSvg } from "@/qr/styledQr";

// Same QR code as the PNG, as a vector for print at any size.
export const getStaticPaths: GetStaticPaths = () => [{ params: { file: qrSlug(cv) } }];

export const GET: APIRoute = () =>
  new Response(styledQrSvg(cv.meta.url), { headers: { "Content-Type": "image/svg+xml" } });
