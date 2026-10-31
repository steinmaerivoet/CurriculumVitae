import { parse } from "yaml";
import { cvSchema, type CvInput } from "./schema";
import { link } from "./linker";
import type { Cv } from "./model";

export class CvValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(`src/content/cv.yaml is invalid:\n${issues.map((i) => `  • ${i}`).join("\n")}`);
    this.name = "CvValidationError";
  }
}

/** Parses and validates cv.yaml text. Every problem is reported with its path. */
export function parseCv(yamlText: string): CvInput {
  const result = cvSchema.safeParse(parse(yamlText));
  if (!result.success) {
    throw new CvValidationError(result.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`));
  }
  return result.data;
}

/** cv.yaml text → linked domain model. */
export const loadCv = (yamlText: string, now?: Date): Cv => link(parseCv(yamlText), now);
