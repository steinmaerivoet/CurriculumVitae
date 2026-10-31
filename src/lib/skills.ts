import * as icons from "simple-icons";
import type { CVData, SkillLevel } from "./cv";
import { range } from "./format";

type SimpleIcon = { path: string; hex: string; title: string };

function iconFor(slug: string | undefined): SimpleIcon | null {
  if (!slug) return null;
  const key = "si" + slug.charAt(0).toUpperCase() + slug.slice(1);
  const icon = (icons as unknown as Record<string, SimpleIcon | undefined>)[key];
  if (!icon) {
    console.warn(`[cv.yaml] Unknown icon "${slug}". See https://simpleicons.org for valid slugs.`);
    return null;
  }
  return { path: icon.path, hex: icon.hex, title: icon.title };
}

const norm = (s: string) => s.trim().toLowerCase();

/** "Java" matches "Java" and "Java 25", but not "JavaScript". */
function matches(terms: string[], value: string): boolean {
  const v = norm(value);
  return terms.some((t) => v === t || v.startsWith(t + " "));
}

/**
 * Adds everything the skills slide shows but nobody should have to maintain
 * by hand: the logo, where a skill was used (from experience `tech` and
 * project `tags`) and for how many years.
 */
export function enrichSkills(cv: CVData) {
  const thisYear = new Date().getFullYear();
  const present = cv.experience.presentLabel;

  const groups = cv.skills.groups.map((group) => ({
    name: group.name,
    items: group.items.map((item) => {
      const level: SkillLevel | undefined = "level" in item ? item.level : undefined;
      const since: number | undefined = "since" in item ? item.since : undefined;
      const extra: string[] = "match" in item ? item.match : [];
      const terms = [item.name, ...extra].map(norm);

      const roles = cv.experience.items.filter((e) => e.tech.some((t) => matches(terms, t)));
      const projects = cv.projects.items.filter((p) => p.tags.some((t) => matches(terms, t)));

      const firstYear = since ?? Math.min(...roles.map((r) => Number(r.start)).filter(Number.isFinite));
      const years = Number.isFinite(firstYear) ? Math.max(1, thisYear - firstYear) : undefined;

      return {
        name: item.name,
        level,
        since: Number.isFinite(firstYear) ? firstYear : undefined,
        years,
        icon: iconFor("icon" in item ? item.icon : undefined),
        usedIn: [
          ...roles.map((r) => ({ title: r.role, sub: r.company, period: range(r.start, r.end, present) })),
          ...projects.map((p) => ({ title: p.name, sub: p.meta ?? "", period: "" })),
        ],
      };
    }),
  }));

  return { ...cv, skills: { ...cv.skills, groups } };
}
