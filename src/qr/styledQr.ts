import QRCode from "qrcode";
import { Resvg } from "@resvg/resvg-js";

/**
 * Builds a QR code as an SVG in the site's style: round dots for the data,
 * rounded "eyes" for the finder patterns and the #S mark from the favicon
 * in the middle.
 *
 * Error correction is set to H (about 30% of the code can be lost), and the
 * centre mark covers well under 10% of the modules, so the code keeps a wide
 * margin for print, glare and cheap phone cameras.
 */

export type QrTheme = {
  background: string;
  dots: string;
  eyes: string;
  eyeCenter: string;
  /** Colours of the centre mark: "#" and "S". */
  hash: string;
  letter: string;
};

/** Colours of the Plain theme (src/styles/global.css). */
export const qrThemes = {
  /** Default: dark on light, like the site and best for every scanner. */
  light: {
    background: "#f7f7f4",
    dots: "#141518",
    eyes: "#2e4ee6",
    eyeCenter: "#141518",
    hash: "#2e4ee6",
    letter: "#141518",
  },
  /** The site in dark mode. */
  dark: {
    background: "#0e0f12",
    dots: "#ecebe7",
    eyes: "#8fa3ff",
    eyeCenter: "#8fa3ff",
    hash: "#8fa3ff",
    letter: "#ecebe7",
  },
} satisfies Record<string, QrTheme>;

export type QrThemeName = keyof typeof qrThemes;

// Outlined "#" and "S" from public/favicon.svg (64x64 box), so the mark needs no font.
const HASH_PATH = "M11.55 47 12.74 40.01H9.49V35.9H13.44L14.79 28.1H10.73V23.99H15.49L16.68 17H21L19.81 23.99H24.95L26.14 17H30.45L29.26 23.99H32.51V28.1H28.56L27.21 35.9H31.27V40.01H26.51L25.32 47H21L22.19 40.01H17.05L15.86 47ZM17.75 35.9H22.89L24.25 28.1H19.11Z";
const S_PATH = "M43 48Q39.71 48 37.28 46.89Q34.85 45.78 33.53 43.78Q32.21 41.77 32.21 39.04H38.61Q38.61 40.62 39.82 41.54Q41.04 42.45 43.13 42.45Q45.13 42.45 46.26 41.56Q47.39 40.66 47.39 39.08Q47.39 37.72 46.54 36.74Q45.69 35.75 44.15 35.41L40.99 34.69Q37.03 33.75 34.83 31.21Q32.63 28.67 32.63 25Q32.63 22.27 33.89 20.25Q35.15 18.22 37.45 17.11Q39.76 16 42.91 16Q47.69 16 50.49 18.37Q53.28 20.74 53.28 24.75H46.88Q46.88 23.25 45.84 22.4Q44.79 21.55 42.83 21.55Q40.99 21.55 40.01 22.38Q39.03 23.21 39.03 24.75Q39.03 26.11 39.82 27.07Q40.61 28.03 42.06 28.37L45.39 29.14Q49.53 30.08 51.66 32.53Q53.79 34.99 53.79 38.78Q53.79 41.51 52.45 43.61Q51.11 45.7 48.7 46.85Q46.29 48 43 48Z";

type Options = {
  theme?: QrTheme;
  /** Size of one module in SVG units. */
  module?: number;
  /** Quiet zone around the code, in modules (the spec asks for 4). */
  margin?: number;
};

/** The code's shapes without the outer <svg>, so other images (the share card) can place it. `size` is the width and height in SVG units. */
export function styledQrShapes(text: string, { theme = qrThemes.light, module: m = 10, margin = 4 }: Options = {}): { size: number; body: string } {
  const qr = QRCode.create(text, { errorCorrectionLevel: "H" });
  const n = qr.modules.size;
  const isDark = (x: number, y: number) => qr.modules.get(y, x) === 1;

  const offset = margin * m;
  const size = (n + margin * 2) * m;
  const px = (i: number) => offset + i * m;

  // Finder patterns (7×7) in three corners are drawn as rounded eyes instead of dots.
  const eyes: [number, number][] = [
    [0, 0],
    [n - 7, 0],
    [0, n - 7],
  ];
  const inEye = (x: number, y: number) => eyes.some(([ex, ey]) => x >= ex && x < ex + 7 && y >= ey && y < ey + 7);

  // Clear area for the centre mark: an odd number of modules so it sits exactly
  // on the grid centre. 9×7 modules is about 6% of a 33×33 code, far below what
  // level H can recover.
  const badgeW = 9;
  const badgeH = 7;
  const bx0 = (n - badgeW) / 2;
  const by0 = (n - badgeH) / 2;
  const inBadge = (x: number, y: number) => x >= bx0 && x < bx0 + badgeW && y >= by0 && y < by0 + badgeH;

  const dots: string[] = [];
  const r = m * 0.42;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!isDark(x, y) || inEye(x, y) || inBadge(x, y)) continue;
      dots.push(`<circle cx="${px(x) + m / 2}" cy="${px(y) + m / 2}" r="${r}"/>`);
    }
  }

  const eyeShapes = eyes
    .map(([ex, ey]) => {
      const x = px(ex);
      const y = px(ey);
      // Outer ring: 7 modules wide, 1 module thick, drawn as a stroke on its centre line.
      const ring = `<rect x="${x + m / 2}" y="${y + m / 2}" width="${6 * m}" height="${6 * m}" rx="${2.2 * m}" fill="none" stroke="${theme.eyes}" stroke-width="${m}"/>`;
      const center = `<rect x="${x + 2 * m}" y="${y + 2 * m}" width="${3 * m}" height="${3 * m}" rx="${1.1 * m}" fill="${theme.eyeCenter}"/>`;
      return ring + center;
    })
    .join("");

  // Centre mark: the outlined #S from the favicon.
  const cx = px(n / 2);
  const cy = px(n / 2);
  const glyphScale = m * 0.12; // 64-unit favicon box; the glyphs span about 5.3 x 3.8 modules
  const mark =
    `<g transform="translate(${cx - 31.5 * glyphScale} ${cy - 32 * glyphScale}) scale(${glyphScale})">` +
    `<path fill="${theme.hash}" d="${HASH_PATH}"/><path fill="${theme.letter}" d="${S_PATH}"/></g>`;

  const body = [
    `<rect width="${size}" height="${size}" rx="${m * 3}" fill="${theme.background}"/>`,
    `<g fill="${theme.dots}">${dots.join("")}</g>`,
    eyeShapes,
    mark,
  ].join("");
  return { size, body };
}

export function styledQrSvg(text: string, options: Options = {}): string {
  const { size, body } = styledQrShapes(text, options);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="geometricPrecision">`,
    `<title>${escapeXml(text)}</title>`,
    body,
    `</svg>`,
  ].join("");
}

/** The same code as a PNG, `width` pixels wide: for the download and the PDF (which cannot embed SVG). */
export const styledQrPng = (text: string, width: number, options: Options = {}): Buffer =>
  new Resvg(styledQrSvg(text, options), { fitTo: { mode: "width", value: width } }).render().asPng();

const escapeXml = (s: string) => s.replace(/[<>&"]/g, (c) => `&#${c.charCodeAt(0)};`);
