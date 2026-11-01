import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { SHARE_CARD, type ShareCard } from "@/bff/seo";
import { qrThemes, styledQrShapes } from "@/qr/styledQr";
import { woffToSfnt } from "./woff";

/**
 * The share card: the image LinkedIn, Slack and messengers show for a link
 * to the site, and the third download in the corner. An editorial still of
 * the Plain intro slide on the left (serif name, italic surname in the accent
 * colour, headline, tagline and the About figures) and an ink panel on the
 * right with the site's QR code. Drawn as SVG and rendered to PNG with resvg
 * at build time. Content comes from the SEO BFF; this file only knows about
 * the canvas.
 */

/* Plain theme tokens (src/web/themes/plain/theme.css): light mode for the page, dark mode for the panel. */
const C = {
  bg: "#f7f7f4",
  fg: "#141518",
  mute: "#6a6c73",
  line: "rgba(20,21,24,0.10)",
  grid: "rgba(20,21,24,0.06)",
  accent: "#2e4ee6",
  ink: "#141518",
  inkFg: "#ecebe7",
  inkMute: "#8d8f96",
  inkLine: "rgba(236,235,231,0.12)",
  inkAccent: "#8fa3ff",
  paper: "#fbfbfa",
};

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

/** Splits a short label over at most two lines of similar length. */
function balance(text: string, max: number): string[] {
  for (let width = Math.ceil(text.length / 2); width < max; width++) {
    const lines = wrap(text, width, 3);
    if (lines.length <= 2) return lines;
  }
  return wrap(text, max, 2);
}

export function shareCardSvg(card: ShareCard): string {
  const { width: W, height: H } = SHARE_CARD;
  const x0 = 72;
  const colRight = 704;

  // Ink panel on the right: the QR code on a paper tile, and what it opens.
  const panel = { x: 760, y: 36, w: W - 760 - 36, h: H - 72 };
  const panelCx = panel.x + panel.w / 2;
  const inset = 36;
  const tile = 312;
  const tileX = panelCx - tile / 2;
  const tileY = panel.y + 66;
  const qr = styledQrShapes(card.url, { theme: { ...qrThemes.light, background: C.paper }, margin: 3 });
  const qrPad = 14;
  const qrScale = (tile - qrPad * 2) / qr.size;
  const footY = tileY + tile + 32;

  const tagline = wrap(card.tagline, 60, 2);
  const grid = Array.from({ length: Math.ceil(panel.x / 48) }, (_, i) => `M${i * 48} 0V${H}`)
    .concat(Array.from({ length: Math.ceil(H / 48) }, (_, i) => `M0 ${i * 48}H${panel.x}`))
    .join("");

  // The About figures: a serif number over a two-line label, in equal columns.
  const statW = (colRight - x0) / Math.max(1, card.stats.length);
  const stats = card.stats
    .map((s, i) => {
      const x = x0 + i * statW;
      const label = balance(s.label, 24);
      return (
        `<text x="${x}" y="548" font-family="Instrument Serif" font-size="46" letter-spacing="-0.5" fill="${C.fg}">${esc(s.value)}</text>` +
        `<text font-family="Inter" font-size="13.5" fill="${C.mute}">${label.map((l, j) => `<tspan x="${x}" y="${574 + j * 18}">${esc(l)}</tspan>`).join("")}</text>`
      );
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow-page" cx="0.12" cy="1.1" r="0.7">
      <stop offset="0" stop-color="${C.accent}" stop-opacity="0.12"/>
      <stop offset="1" stop-color="${C.accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow-panel" cx="0.85" cy="0" r="0.9">
      <stop offset="0" stop-color="${C.accent}" stop-opacity="0.55"/>
      <stop offset="0.55" stop-color="${C.accent}" stop-opacity="0.08"/>
      <stop offset="1" stop-color="${C.accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="fade" cx="0.35" cy="0.4" r="0.65">
      <stop offset="0" stop-color="#fff"/>
      <stop offset="1" stop-color="#000"/>
    </radialGradient>
    <mask id="grid-mask"><rect width="${panel.x}" height="${H}" fill="url(#fade)"/></mask>
    <clipPath id="panel-clip"><rect x="${panel.x}" y="${panel.y}" width="${panel.w}" height="${panel.h}" rx="28"/></clipPath>
    <filter id="tile-shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#000" flood-opacity="0.45"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  <rect width="${W}" height="${H}" fill="url(#glow-page)"/>
  <path d="${grid}" stroke="${C.grid}" stroke-width="1" mask="url(#grid-mask)"/>

  <line x1="${x0}" y1="74" x2="${x0 + 28}" y2="74" stroke="${C.accent}" stroke-width="1.5"/>
  <text x="${x0 + 42}" y="80" font-family="IBM Plex Mono" font-weight="500" font-size="15" letter-spacing="2.6" fill="${C.fg}">${esc(card.location.toUpperCase())}</text>

  <text font-family="Instrument Serif" font-size="142" letter-spacing="-4" fill="${C.fg}">
    <tspan x="${x0 - 5}" y="212">${esc(card.firstName)}</tspan>
    <tspan x="${x0 + 88}" y="324" font-style="italic" fill="${C.accent}">${esc(card.lastName)}</tspan>
  </text>

  <text x="${x0}" y="398" font-family="Inter" font-weight="500" font-size="27" letter-spacing="-0.5" fill="${C.fg}">${esc(card.headline)}</text>
  <text font-family="Inter" font-size="17.5" fill="${C.mute}">
    ${tagline.map((l, i) => `<tspan x="${x0}" y="${432 + i * 25}">${esc(l)}</tspan>`).join("")}
  </text>

  <line x1="${x0}" y1="490" x2="${colRight}" y2="490" stroke="${C.line}" stroke-width="1"/>
  ${stats}

  <g clip-path="url(#panel-clip)">
    <rect x="${panel.x}" y="${panel.y}" width="${panel.w}" height="${panel.h}" fill="${C.ink}"/>
    <rect x="${panel.x}" y="${panel.y}" width="${panel.w}" height="${panel.h}" fill="url(#glow-panel)"/>
  </g>
  <rect x="${panel.x + 0.5}" y="${panel.y + 0.5}" width="${panel.w - 1}" height="${panel.h - 1}" rx="27.5" fill="none" stroke="${C.inkLine}"/>

  <rect x="${tileX}" y="${tileY}" width="${tile}" height="${tile}" rx="26" fill="${C.paper}" filter="url(#tile-shadow)"/>
  <g transform="translate(${tileX + qrPad} ${tileY + qrPad}) scale(${qrScale})">${qr.body}</g>

  <line x1="${panel.x + inset}" y1="${footY}" x2="${panel.x + panel.w - inset}" y2="${footY}" stroke="${C.inkLine}"/>
  <text x="${panel.x + inset}" y="${footY + 42}" font-family="Inter" font-weight="500" font-size="19" letter-spacing="-0.2" fill="${C.inkFg}">${esc(card.qrCaption)}</text>
  <text x="${panel.x + inset}" y="${footY + 68}" font-family="IBM Plex Mono" font-weight="500" font-size="14.5" letter-spacing="0.3" fill="${C.inkAccent}">${esc(card.site)}</text>
  <circle cx="${panel.x + panel.w - inset - 22}" cy="${footY + 49}" r="22" fill="${C.accent}"/>
  <path d="M${panel.x + panel.w - inset - 29} ${footY + 56}l14 -14m-9 0h9v9" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

export function shareCardPng(card: ShareCard): Uint8Array {
  const resvg = new Resvg(shareCardSvg(card), {
    font: { fontFiles: fonts(), loadSystemFonts: false, defaultFontFamily: "Inter" },
    fitTo: { mode: "width", value: SHARE_CARD.width },
  });
  return new Uint8Array(resvg.render().asPng());
}
