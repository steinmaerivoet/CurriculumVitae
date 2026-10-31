import * as simpleIcons from "simple-icons";
import { getIconData, iconToSVG } from "@iconify/utils";
import lucide from "@iconify-json/lucide/icons.json";
import devicon from "@iconify-json/devicon/icons.json";
import type { IconifyJSON } from "@iconify/types";
import type { CVData, SkillLevel } from "./cv";
import { range } from "./format";

/** Inner SVG markup plus its viewBox, drawn in the current text colour. */
export type SkillIcon = { body: string; viewBox: string };

const sets: Record<string, IconifyJSON> = { lucide: lucide as IconifyJSON, devicon: devicon as IconifyJSON };

/**
 * `icon` in cv.yaml is either a Simple Icons slug ("kubernetes"), or a
 * prefixed Iconify name: "lucide:boxes" for concepts, "devicon:azure" for
 * logos Simple Icons doesn't carry.
 */
function iconFor(spec: string | undefined): SkillIcon | null {
  if (!spec) return null;
  const [prefix, name] = spec.includes(":") ? spec.split(":", 2) : ["", spec];
  if (prefix) {
    const set = sets[prefix];
    const data = set && name ? getIconData(set, name) : null;
    if (!data) {
      console.warn(`[cv.yaml] Unknown icon "${spec}". Browse https://icon-sets.iconify.design/${prefix}/`);
      return null;
    }
    const svg = iconToSVG(data);
    let body = svg.body;
    if (prefix === "devicon") {
      // Brand colours and gradients out: every logo is drawn in one colour.
      body = body
        .replace(/<defs>[\s\S]*?<\/defs>/g, "")
        .replace(/\s(fill|stroke)="(?!none)[^"]*"/g, "")
        .replace(/\sstyle="[^"]*"/g, "");
    }
    // A slightly finer line sits better next to the filled brand logos.
    if (prefix === "lucide") body = body.replace(/stroke-width="2"/g, 'stroke-width="1.75"');
    return { body, viewBox: svg.attributes.viewBox };
  }
  const key = "si" + spec.charAt(0).toUpperCase() + spec.slice(1);
  const icon = (simpleIcons as unknown as Record<string, { path: string } | undefined>)[key];
  if (!icon) {
    console.warn(`[cv.yaml] Unknown icon "${spec}". See https://simpleicons.org for valid slugs.`);
    return null;
  }
  return { body: `<path d="${icon.path}"/>`, viewBox: "0 0 24 24" };
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
