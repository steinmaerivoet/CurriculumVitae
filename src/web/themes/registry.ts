/**
 * The website themes. Plain data, so Astro pages, the theme switcher and the
 * tests share one list. Adding a theme: add it here, give it a folder in
 * src/web/themes, a presenter in src/bff/web/themes and a page in src/pages.
 */
export const themes = [
  { id: "plain", label: "Plain", path: "/" },
  { id: "terminal", label: "Terminal", path: "/terminal/" },
  { id: "reference", label: "API reference", path: "/api-reference/" },
  { id: "git", label: "Commit graph", path: "/commit-graph/" },
] as const;

export type ThemeId = (typeof themes)[number]["id"];
export type ThemeInfo = (typeof themes)[number];

export const defaultTheme: ThemeId = "plain";
export const themeInfo = (id: ThemeId): ThemeInfo => themes.find((t) => t.id === id)!;
