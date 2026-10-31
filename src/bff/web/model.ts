import type { Employer, Ref, SectionId, Skill, SkillGroup, Cv } from "@/core/model";
import type { files } from "../shared/files";

/**
 * Web BFF: the view model every website theme renders.
 *
 * It is built at build time (./deck.ts) and handed to the browser as the
 * props of the deck island, so it holds exactly what the site shows. This
 * file is browser-safe: types and pure helpers only. Themes may derive more
 * from it, or get their own extra view model from src/bff/web/themes, but
 * never reach into src/core.
 */

export type Section = { id: SectionId; label: string; index: number };

/** One line in a skill's "Used in" list. */
export type UsageView = { title: string; sub: string; period: string; ref: Ref };

export type SkillView = Omit<Skill, "icon" | "usedIn"> & {
  /** Unique within the CV: "Backend/Java". */
  key: string;
  /** Id of the skill's <symbol> in the page's icon sprite (see IconSprite.astro), or null for a monogram. */
  icon: string | null;
  usedIn: UsageView[];
};
export type SkillGroupView = Omit<SkillGroup, "items"> & { items: SkillView[] };

export type EmployerView = Employer & { period: string };

export type DeckModel = Omit<Cv, "sections" | "experience" | "skills"> & {
  sections: Section[];
  experience: Omit<Cv["experience"], "items"> & { items: EmployerView[] };
  skills: Omit<Cv["skills"], "groups"> & { groups: SkillGroupView[] };
  files: ReturnType<typeof files>;
};

/** All skills in board order, flattened. */
export const allSkills = (deck: Pick<DeckModel, "skills">): SkillView[] => deck.skills.groups.flatMap((g) => g.items);
