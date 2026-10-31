import type { Cv } from "@/core";

/** A language with a share from 0 to 1 for a bar. The order in cv.yaml is the ranking. */
export type LanguageShare = { name: string; level: string; share: number };

export const languageShares = (cv: Pick<Cv, "education">): LanguageShare[] =>
  cv.education.languages.map((l, i, all) => ({ name: l.name, level: l.level, share: (all.length - i) / all.length }));

/** The first year on the job. */
export const careerStart = (cv: Pick<Cv, "experience">): number =>
  Math.min(...cv.experience.items.map((e) => Number(e.start)).filter(Number.isFinite));
