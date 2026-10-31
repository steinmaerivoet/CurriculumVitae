import type { Cv } from "@/core";
import type { SectionId, SkillLevel, Term } from "@/core/model";
import { slug } from "@/core/matching";
import { languageShares, type LanguageShare } from "./shared";

/**
 * Commit graph theme presenter: the career as a git history. Derives the
 * hashes, branch lanes, commit messages and the skills heatmap from the CV,
 * so the theme only draws them.
 */

export type GitCommit = {
  company: string;
  hash: string;
  /** Conventional-commit style subject: "feat: lead engineer @ belfius". */
  type: "init" | "feat";
  subject: string;
  scope: string;
  /** 0 = main line; 1 = a short side branch merged back (a stint of a year or less). */
  lane: 0 | 1;
  head: boolean;
  /** The stack compared with the employer before: what came in, what went out. */
  diff: { added: Term[]; removed: Term[] };
};

export type GitView = {
  /** The git command each slide is the output of. */
  commands: Record<SectionId, string>;
  /** "stein/main" */
  repo: string;
  branch: string;
  tag: string;
  commits: GitCommit[];
  /** Columns of the heatmap, oldest first. */
  years: number[];
  /** Per skill name, one intensity (0–4) per year. */
  heat: Record<string, number[]>;
  /** Merged pull request numbers for the featured projects, newest highest. */
  prNumbers: Record<string, number>;
  i18n: LanguageShare[];
};

const HEAT_YEARS = 16;
const COMMANDS: Record<SectionId, string> = {
  hero: "git checkout main",
  about: "git show HEAD:README.md",
  experience: "git log --graph",
  skills: "git log --stat",
  projects: "gh pr list --state merged",
  education: "git tag --list",
  contact: "gh pr create",
};

/** Terms in `a` whose label is not in `b`. */
const minus = (a: Term[], b: Term[]) => a.filter((t) => !b.some((u) => u.label === t.label));
const PEAK: Record<SkillLevel, number> = { expert: 4, advanced: 3, familiar: 2 };

/** A stable 7-character hex hash (FNV-1a), so a commit keeps its hash between builds. */
export function shortHash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0").slice(0, 7);
}

/** How strongly a skill shows in a year: nothing before `since`, then growing to its level. */
export function heatFor(since: number | undefined, level: SkillLevel | undefined, years: number[]): number[] {
  const peak = level ? PEAK[level] : 1;
  return years.map((y) => (since === undefined || y < since ? 0 : Math.min(peak, 1 + Math.floor((y - since) / 2))));
}

export function buildGitView(cv: Cv, now = new Date()): GitView {
  const { person, experience, skills, projects } = cv;
  const items = experience.items;
  const thisYear = now.getFullYear();
  const years = Array.from({ length: HEAT_YEARS }, (_, i) => thisYear - HEAT_YEARS + 1 + i);
  const featured = projects.featured;
  const lower = (s: string) => s.toLowerCase();

  return {
    commands: COMMANDS,
    repo: `${slug(person.firstName)}/main`,
    branch: "main",
    tag: slug(items[0]?.role ?? person.headline),
    commits: items.map((e, i) => ({
      company: e.company,
      hash: shortHash(`${e.company}${e.start}`),
      type: i === items.length - 1 ? "init" : "feat",
      subject: lower(e.role),
      scope: lower(e.company),
      lane: e.start === e.end && i > 0 && i < items.length - 1 ? 1 : 0,
      head: i === 0 && e.end === null,
      diff: { added: minus(e.tech, items[i + 1]?.tech ?? []), removed: minus(items[i + 1]?.tech ?? [], e.tech) },
    })),
    years,
    heat: Object.fromEntries(skills.groups.flatMap((g) => g.items.map((s) => [s.name, heatFor(s.since, s.level, years)]))),
    prNumbers: Object.fromEntries(featured.map((p, i) => [p.id, (featured.length - i) * 7 + 3])),
    i18n: languageShares(cv),
  };
}
