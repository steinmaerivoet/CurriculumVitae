/**
 * How labels in cv.yaml are compared and turned into ids.
 * One place, so every layer links and slugs the same way.
 */

export const norm = (s: string): string => s.trim().toLowerCase();

/** "Java" matches "Java" and "Java 25", but not "JavaScript". */
export function matches(terms: readonly string[], value: string): boolean {
  const v = norm(value);
  return terms.some((t) => v === t || v.startsWith(t + " "));
}

/** "Cloud & platform" → "cloud-platform", "Crème brûlée" → "creme-brulee" */
export function slug(s: string): string {
  return norm(s)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
