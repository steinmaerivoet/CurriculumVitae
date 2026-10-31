import type { APIRoute, GetStaticPaths } from "astro";
import { Resvg } from "@resvg/resvg-js";
import { getCv } from "@/core";
import { qrSlug } from "@/bff/shared/files";
import { styledQrSvg } from "@/qr/styledQr";

// Styled QR code for the site URL, rendered once at build time as a 2048 px PNG:
// large enough for print, small enough to share.
export const getStaticPaths: GetStaticPaths = () => [{ params: { file: qrSlug(getCv()) } }];

export const GET: APIRoute = () => {
  const png = new Resvg(styledQrSvg(getCv().meta.url), { fitTo: { mode: "width", value: 2048 } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
