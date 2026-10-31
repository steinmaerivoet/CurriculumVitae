/**
 * The content service ("backend"): the single source of the CV for every
 * front end. It reads src/content/cv.yaml, validates it and links it, once,
 * at build time. Front ends never read cv.yaml themselves; they ask their
 * presenter in src/bff, which asks this module.
 */
import raw from "../content/cv.yaml?raw";
import { loadCv } from "./loader";
import type { Cv } from "./model";

let cached: Cv | undefined;

export function getCv(): Cv {
  cached ??= loadCv(raw);
  return cached;
}

export * from "./model";
export { loadCv, parseCv, CvValidationError } from "./loader";
export { CvLinkError } from "./linker";
