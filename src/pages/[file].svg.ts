import type { APIRoute, GetStaticPaths } from "astro";
import { getCv } from "@/core";
import { qrSlug } from "@/bff/shared/files";
import { styledQrSvg } from "@/qr/styledQr";

// Same QR code as the PNG, as a vector for print at any size.
export const getStaticPaths: GetStaticPaths = () => [{ params: { file: qrSlug(getCv()) } }];

export const GET: APIRoute = () => new Response(styledQrSvg(getCv().meta.url), { headers: { "Content-Type": "image/svg+xml" } });
