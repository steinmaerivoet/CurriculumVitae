import QRCode from "qrcode";

/**
 * Builds a QR code as an SVG in the site's style: round dots for the data,
 * rounded "eyes" for the finder patterns and a </> mark in the middle.
 *
 * Error correction is set to H (≈30% of the code can be lost), and the centre
 * mark covers well under 10% of the modules, so the code keeps a wide margin
 * for print, glare and cheap phone cameras.
 */

export type QrTheme = {
  background: string;
  dots: string;
  eyes: string;
  eyeCenter: string;
  /** Colours of the centre mark: brackets and slash. */
  bracket: string;
  slash: string;
  /** Tile behind the centre mark. */
  badge: string;
};

export const qrThemes = {
  /** Matches the site: lime and paper on ink. */
  dark: {
    background: "#0a0b0f",
    dots: "#f2efe8",
    eyes: "#d4ff5a",
    eyeCenter: "#d4ff5a",
    bracket: "#d4ff5a",
    slash: "#f2efe8",
    badge: "#0a0b0f",
  },
  /** Classic polarity (dark on light) for print and older scanner apps. */
  light: {
    background: "#f2efe8",
    dots: "#0a0b0f",
    eyes: "#0a0b0f",
    eyeCenter: "#0a0b0f",
    bracket: "#0a0b0f",
    slash: "#0a0b0f",
    badge: "#d4ff5a",
  },
} satisfies Record<string, QrTheme>;

export type QrThemeName = keyof typeof qrThemes;

type Options = {
  theme?: QrTheme;
  /** Size of one module in SVG units. */
  module?: number;
  /** Quiet zone around the code, in modules (the spec asks for 4). */
  margin?: number;
};

export function styledQrSvg(text: string, { theme = qrThemes.dark, module: m = 10, margin = 4 }: Options = {}): string {
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

  // Centre badge: an odd number of modules so it sits exactly on the grid centre.
  // 9×7 modules ≈ 5.8% of a 33×33 code, far below what level H can recover.
  const badgeW = n >= 33 ? 11 : 9;
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

  // Centre mark: "</>" drawn as strokes, so it needs no font.
  const cx = px(n / 2);
  const cy = px(n / 2);
  const bw = badgeW * m;
  const bh = badgeH * m;
  const inset = m * 0.6;
  const badge = `<rect x="${cx - bw / 2 + inset}" y="${cy - bh / 2 + inset}" width="${bw - inset * 2}" height="${bh - inset * 2}" rx="${1.6 * m}" fill="${theme.badge}"/>`;
  const sw = m * 0.95; // stroke width
  const h = m * 1.75; // half height of the glyphs
  const gap = m * 2.55; // horizontal distance from centre to the bracket tips
  const arm = m * 1.5; // horizontal reach of a bracket
  const slashDx = m * 0.85;
  const stroke = `fill="none" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"`;
  const mark =
    `<path d="M${cx - gap} ${cy - h} L${cx - gap - arm} ${cy} L${cx - gap} ${cy + h}" stroke="${theme.bracket}" ${stroke}/>` +
    `<path d="M${cx + gap} ${cy - h} L${cx + gap + arm} ${cy} L${cx + gap} ${cy + h}" stroke="${theme.bracket}" ${stroke}/>` +
    `<path d="M${cx + slashDx} ${cy - h} L${cx - slashDx} ${cy + h}" stroke="${theme.slash}" ${stroke}/>`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="geometricPrecision">`,
    `<title>${escapeXml(text)}</title>`,
    `<rect width="${size}" height="${size}" rx="${m * 3}" fill="${theme.background}"/>`,
    `<g fill="${theme.dots}">${dots.join("")}</g>`,
    eyeShapes,
    badge,
    mark,
    `</svg>`,
  ].join("");
}

const escapeXml = (s: string) => s.replace(/[<>&"]/g, (c) => `&#${c.charCodeAt(0)};`);
