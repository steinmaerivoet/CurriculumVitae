import type { CV } from "@/lib/cv";
import { cvSlug } from "@/pdf/filename";

/** "Stein Maerivoet" → "stein-maerivoet-qr-code" */
export const qrSlug = (cv: CV) => cvSlug(cv).replace(/-curriculum-vitae$/, "-qr-code");

export const qrPngPath = (cv: CV) => `/${qrSlug(cv)}.png`;
export const qrSvgPath = (cv: CV) => `/${qrSlug(cv)}.svg`;
