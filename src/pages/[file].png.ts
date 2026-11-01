import type { APIRoute, GetStaticPaths } from "astro";
import { getCv } from "@/core";
import { QR_PNG_SIZE, qrSlug, shareSlug } from "@/bff/shared/files";
import { buildShareCard } from "@/bff/seo";
import { styledQrPng } from "@/qr/styledQr";
import { shareCardPng } from "@/og/shareCard";

/**
 * PNG files rendered once at build time:
 * - the styled QR code for the site URL (QR_PNG_SIZE pixels wide);
 * - the share card (Open Graph image) that link previews show.
 */
const renderers: Record<string, () => Uint8Array> = {
  [qrSlug(getCv())]: () => new Uint8Array(styledQrPng(getCv().meta.url, QR_PNG_SIZE)),
  [shareSlug(getCv())]: () => shareCardPng(buildShareCard(getCv())),
};

export const getStaticPaths: GetStaticPaths = () => Object.keys(renderers).map((file) => ({ params: { file } }));

export const GET: APIRoute = ({ params }) => {
  const render = renderers[params["file"] ?? ""];
  if (!render) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(render()), { headers: { "Content-Type": "image/png" } });
};
