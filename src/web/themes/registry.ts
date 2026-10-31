/**
 * The website themes. Plain data, so Astro pages, the theme switcher and the
 * tests share one list. Adding a theme: add it here, give it a folder in
 * src/web/themes, a presenter in src/bff/web/themes and a page in src/pages.
 */
const LIGHT = "(prefers-color-scheme: light)";
const DARK = "(prefers-color-scheme: dark)";

/** `themeColor` is the browser UI colour (address bar), per colour scheme where the theme has both. */
export const themes = [
  { id: "plain", label: "Plain", path: "/", themeColor: [{ color: "#f7f7f4", media: LIGHT }, { color: "#0e0f12", media: DARK }] },
  { id: "terminal", label: "Terminal", path: "/terminal/", themeColor: [{ color: "#171b21" }] },
  { id: "reference", label: "API reference", path: "/api-reference/", themeColor: [{ color: "#ffffff" }] },
  { id: "git", label: "Commit graph", path: "/commit-graph/", themeColor: [{ color: "#131210" }] },
] as const;

export type ThemeId = (typeof themes)[number]["id"];
export type ThemeInfo = (typeof themes)[number];

export const defaultTheme: ThemeId = "plain";
export const themeInfo = (id: ThemeId): ThemeInfo => themes.find((t) => t.id === id)!;
