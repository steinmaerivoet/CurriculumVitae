import type { CV } from "@/lib/cv";

/** "Stein Maerivoet" → "stein-maerivoet-curriculum-vitae" */
export function cvSlug(cv: CV): string {
  return `${cv.person.firstName} ${cv.person.lastName} curriculum vitae`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const cvPdfPath = (cv: CV) => `/${cvSlug(cv)}.pdf`;
