/** Formatting shared by every front end, so a date range looks the same on the site and in the PDF. */

/** "2019 – 2023", "2026 – Present", or "2015" when it starts and ends in the same year. */
export function range(start: string, end: string | null, present: string): string {
  if (end === start) return start;
  return `${start} – ${end ?? present}`;
}

/** "2019–23", "2026–now": the compact form some themes use. */
export function shortRange(start: string, end: string | null, present = "now"): string {
  if (end === start) return start;
  return `${start}–${end === null ? present : end.slice(-2)}`;
}

export const pad = (n: number, width = 2): string => String(n).padStart(width, "0");

/** Collapses the line breaks YAML folding leaves behind. */
export const clean = (text: string): string => text.replace(/\s+/g, " ").trim();

/** "https://www.example.com/" → "example.com" */
export const bareUrl = (url: string): string => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

/** "https://www.vandelanotte.be/en/x" → "vandelanotte.be" */
export const hostname = (url: string): string => new URL(url).hostname.replace(/^www\./, "");

/** "Spring Boot" → "SB", "Kubernetes" → "K" */
export const initials = (name: string, max = 2): string =>
  name
    .split(/[\s/&-]+/)
    .filter(Boolean)
    .slice(0, max)
    .map((w) => w[0]?.toUpperCase())
    .join("");
