import { readFileSync } from "node:fs";
import { loadCv } from "@/core/loader";

/** The real cv.yaml, linked as of a fixed date so year-based numbers are stable. */
export const NOW = new Date("2026-10-31T12:00:00Z");
export const yamlText = readFileSync(new URL("../../src/content/cv.yaml", import.meta.url), "utf8");
export const cv = loadCv(yamlText, NOW);
