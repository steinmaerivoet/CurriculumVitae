import type { Cv, SectionId, Skill } from "@/core";
import { iconFor, iconId, iconSprite, type IconSymbol } from "../shared/icons";
import { range } from "../shared/format";
import { files } from "../shared/files";
import type { DeckModel, SkillView } from "./model";

export type * from "./model";
export { allSkills } from "./model";

/**
 * Web BFF presenter: builds the DeckModel (see ./model.ts) at build time.
 * Server-only: it resolves icons from the icon sets, which never ship to
 * the browser. The deck refers to an icon by id; the markup goes into the
 * page once, as a sprite (buildIconSprite).
 */

const labelOf = (cv: Cv, id: SectionId): string => (id === "hero" ? cv.ui.introLabel : cv[id].label);

function skillView(skill: Skill, present: string): SkillView {
  return {
    ...skill,
    key: `${skill.group}/${skill.name}`,
    icon: skill.icon && iconFor(skill.icon) ? iconId(skill.icon) : null,
    usedIn: skill.usedIn.map((u) =>
      u.kind === "employer"
        ? { title: u.role, sub: u.company, period: range(u.start, u.end, present), ref: u.ref }
        : { title: u.name, sub: u.employer ?? u.meta ?? "", period: "", ref: u.ref },
    ),
  };
}

export function buildDeckModel(cv: Cv): DeckModel {
  const present = cv.experience.presentLabel;
  return {
    ...cv,
    sections: cv.sections.map((id, index) => ({ id, label: labelOf(cv, id), index })),
    experience: { ...cv.experience, items: cv.experience.items.map((e) => ({ ...e, period: range(e.start, e.end, present) })) },
    skills: { ...cv.skills, groups: cv.skills.groups.map((g) => ({ ...g, items: g.items.map((s) => skillView(s, present)) })) },
    files: files(cv),
  };
}

/** The <symbol>s for every skill icon the deck refers to. */
export const buildIconSprite = (cv: Cv): IconSymbol[] => iconSprite(cv.skills.groups.flatMap((g) => g.items.map((s) => s.icon)));
