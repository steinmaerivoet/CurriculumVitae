import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { SHARE_CARD, type ShareCard } from "@/bff/seo";
import { woffToSfnt } from "./woff";

/**
 * The share card: the image LinkedIn, Slack and messengers show for a link
 * to the site. A still of the Plain intro slide (serif name, italic surname
 * in the accent colour, headline and tagline), drawn as SVG and rendered to
 * PNG with resvg at build time. Content comes from the SEO BFF; this file
 * only knows about the canvas.
 */

/* Plain theme tokens, light mode (src/web/themes/plain/theme.css). */
const C = { bg: "#f7f7f4", fg: "#141518", mute: "#6a6c73", line: "rgba(20,21,24,0.07)", accent: "#2e4ee6" };

const require = createRequire(import.meta.url);
const FONTS = [
  "@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff",
  "@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff",
  "@fontsource/inter/files/inter-latin-400-normal.woff",
  "@fontsource/inter/files/inter-latin-500-normal.woff",
  "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff",
];

/** resvg reads TTF/OTF from disk only: unwrap the site's WOFF files into a temp folder once. */
let fontFiles: string[] | undefined;
function fonts(): string[] {
  if (fontFiles) return fontFiles;
  const dir = join(tmpdir(), "cv-share-card-fonts");
  mkdirSync(dir, { recursive: true });
  fontFiles = FONTS.map((spec) => {
    const file = join(dir, spec.split("/").pop()!.replace(/\.woff$/, ".ttf"));
    writeFileSync(file, woffToSfnt(readFileSync(require.resolve(spec))));
    return file;
  });
  return fontFiles;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Greedy word wrap by character count: good enough for one short tagline. */
function wrap(text: string, max: number, lines: number): string[] {
  const out: string[] = [];
  for (const word of text.split(/\s+/)) {
    const last = out.at(-1);
    if (last !== undefined && (last + " " + word).length <= max) out[out.length - 1] = `${last} ${word}`;
    else out.push(word);
  }
  if (out.length > lines) {
    out.length = lines;
    out[lines - 1] = out[lines - 1]!.replace(/[\s,.;:]*$/, "…");
  }
  return out;
}

export function shareCardSvg(card: ShareCard): string {
  const { width: W, height: H } = SHARE_CARD;
  const pad = 80;
  const tagline = wrap(card.tagline, 50, 3);
  const grid = Array.from({ length: Math.ceil(W / 72) }, (_, i) => `M${i * 72} 0V${H}`)
    .concat(Array.from({ length: Math.ceil(H / 72) }, (_, i) => `M0 ${i * 72}H${W}`))
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow-a" cx="0.82" cy="0.12" r="0.62">
      <stop offset="0" stop-color="${C.accent}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${C.accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow-b" cx="0.06" cy="1.05" r="0.5">
      <stop offset="0" stop-color="${C.accent}" stop-opacity="0.1"/>
      <stop offset="1" stop-color="${C.accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="fade" cx="0.5" cy="0.5" r="0.6">
      <stop offset="0" stop-color="#fff"/>
      <stop offset="1" stop-color="#000"/>
    </radialGradient>
    <mask id="grid-mask"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
  </defs>
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  <rect width="${W}" height="${H}" fill="url(#glow-a)"/>
  <rect width="${W}" height="${H}" fill="url(#glow-b)"/>
  <path d="${grid}" stroke="${C.line}" stroke-width="1" mask="url(#grid-mask)"/>

  <line x1="${pad}" y1="104" x2="${pad + 28}" y2="104" stroke="${C.accent}" stroke-width="1.5"/>
  <text x="${pad + 44}" y="110" font-family="IBM Plex Mono" font-weight="500" font-size="17" letter-spacing="2.5" fill="${C.fg}">${esc(card.location.toUpperCase())}</text>
  <text x="${W - pad}" y="110" text-anchor="end" font-family="IBM Plex Mono" font-weight="500" font-size="17" letter-spacing="1" fill="${C.mute}">${esc(card.site)}</text>

  <text font-family="Instrument Serif" font-size="176" letter-spacing="-6" fill="${C.fg}">
    <tspan x="${pad - 6}" y="284">${esc(card.firstName)}</tspan>
    <tspan x="${pad + 150}" y="430" font-style="italic" fill="${C.accent}">${esc(card.lastName)}</tspan>
  </text>

  <text x="${pad}" y="540" font-family="Inter" font-weight="500" font-size="32" letter-spacing="-0.6" fill="${C.fg}">${esc(card.headline)}</text>
  <text font-family="Inter" font-size="21" fill="${C.mute}">
    ${tagline.map((l, i) => `<tspan x="${W - pad - 500}" y="${(tagline.length === 1 ? 540 : 526) + i * 30 - (tagline.length > 2 ? 15 : 0)}">${esc(l)}</tspan>`).join("")}
  </text>
</svg>`;
}

export function shareCardPng(card: ShareCard): Uint8Array {
  const resvg = new Resvg(shareCardSvg(card), {
    font: { fontFiles: fonts(), loadSystemFonts: false, defaultFontFamily: "Inter" },
    fitTo: { mode: "width", value: SHARE_CARD.width },
  });
  return new Uint8Array(resvg.render().asPng());
}
