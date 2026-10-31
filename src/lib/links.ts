import type { CVData, SkillLevel } from "./cv";
import { range } from "./format";
import { iconFor, matches, norm } from "./skills";

/**
 * Links skills, experience and projects to each other.
 *
 * The CV is one web: a skill was used at employers and in projects, a project
 * belongs to an employer and uses skills. cv.yaml states each fact once:
 *   - project.employer       -> experience item (by company name)
 *   - experience.tech        -> skills (by name, or a skill's `match` terms)
 *   - project.tags           -> skills (same matching)
 * Everything else (a skill's "Used in", clickable chips, the graph) is derived
 * here at build time. A broken employer link fails the build.
 */

/** Where a link takes the visitor. */
export type Target =
  | { kind: "skill"; name: string }
  | { kind: "employer"; company: string; project?: string }
  | { kind: "project"; id: string };

export type Chip = { label: string; skill?: string | undefined };

export type GraphNode = { id: string; kind: "skill" | "employer" | "project"; label: string; group?: string; target: Target };
export type Graph = { nodes: GraphNode[]; edges: [string, string][] };

const slug = (s: string) =>
  norm(s)
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function link(cv: CVData) {
  const thisYear = new Date().getFullYear();
  const present = cv.experience.presentLabel;
  const problems: string[] = [];

  // ---- Skills and the terms they answer to ----
  const skillTerms = cv.skills.groups.flatMap((g) =>
    g.items.map((item) => ({
      name: item.name,
      terms: [item.name, ...("match" in item ? item.match : [])].map(norm),
    })),
  );
  // The most specific skill wins: "Azure DevOps" links to Azure DevOps, not Azure.
  const skillFor = (label: string) => {
    let best: { name: string; len: number } | undefined;
    for (const s of skillTerms) {
      for (const t of s.terms) {
        if (matches([t], label) && (!best || t.length > best.len)) best = { name: s.name, len: t.length };
      }
    }
    return best?.name;
  };
  const chips = (labels: string[]): Chip[] => labels.map((label) => ({ label, skill: skillFor(label) }));

  // ---- Projects ----
  const companies = new Set(cv.experience.items.map((e) => e.company));
  const seen = new Set<string>();
  const projects = cv.projects.items.map((p) => {
    const id = p.id ?? slug(p.name);
    if (seen.has(id)) problems.push(`projects: two projects share the id "${id}"`);
    seen.add(id);
    if (p.employer && !companies.has(p.employer)) {
      problems.push(`projects.${p.name}.employer: "${p.employer}" is not a company under experience`);
    }
    const meta = p.meta ?? ([p.employer, p.period].filter(Boolean).join(" · ") || undefined);
    const target: Target = p.featured || !p.employer ? { kind: "project", id } : { kind: "employer", company: p.employer, project: id };
    return { ...p, id, meta, target, tagChips: chips(p.tags) };
  });

  if (problems.length) throw new Error(`src/content/cv.yaml has broken links:\n  • ${problems.join("\n  • ")}`);

  // ---- Experience ----
  const experience = cv.experience.items.map((e) => ({
    ...e,
    techChips: chips(e.tech),
    projects: projects.filter((p) => p.employer === e.company),
  }));

  // ---- Skills: icon, years, and where they were used ----
  const groups = cv.skills.groups.map((group) => ({
    name: group.name,
    kind: group.kind,
    items: group.items.map((item) => {
      const level: SkillLevel | undefined = "level" in item ? item.level : undefined;
      const since: number | undefined = "since" in item ? item.since : undefined;
      const usedAt = experience.filter((e) => e.techChips.some((c) => c.skill === item.name));
      const usedIn = projects.filter((p) => p.tagChips.some((c) => c.skill === item.name));
      const firstYear = since ?? Math.min(...usedAt.map((r) => Number(r.start)).filter(Number.isFinite));
      return {
        name: item.name,
        level,
        since: Number.isFinite(firstYear) ? firstYear : undefined,
        years: Number.isFinite(firstYear) ? Math.max(1, thisYear - firstYear) : undefined,
        icon: iconFor("icon" in item ? item.icon : undefined),
        usedIn: [
          ...usedAt.map((e) => ({
            title: e.role,
            sub: e.company,
            period: range(e.start, e.end, present),
            target: { kind: "employer", company: e.company } as Target,
          })),
          ...usedIn.map((p) => ({ title: p.name, sub: p.employer ?? p.meta ?? "", period: "", target: p.target })),
        ],
      };
    }),
  }));

  // ---- Graph of everything, for the skills slide's network view ----
  const nodes: GraphNode[] = [
    ...groups.flatMap((g) =>
      g.items.map((s) => ({ id: `s:${s.name}`, kind: "skill" as const, label: s.name, group: g.name, target: { kind: "skill", name: s.name } as Target })),
    ),
    ...experience.map((e) => ({ id: `e:${e.company}`, kind: "employer" as const, label: e.company, target: { kind: "employer", company: e.company } as Target })),
    ...projects.map((p) => ({ id: `p:${p.id}`, kind: "project" as const, label: p.name, target: p.target })),
  ];
  const edges = new Set<string>();
  for (const e of experience) for (const c of e.techChips) if (c.skill) edges.add(`e:${e.company}|s:${c.skill}`);
  for (const p of projects) {
    for (const c of p.tagChips) if (c.skill) edges.add(`p:${p.id}|s:${c.skill}`);
    if (p.employer) edges.add(`p:${p.id}|e:${p.employer}`);
  }
  const graph: Graph = { nodes, edges: [...edges].map((k) => k.split("|") as [string, string]) };

  // Numbers on the About slide that count themselves.
  const counts = {
    technologies: groups.filter((g) => g.kind === "technology").reduce((n, g) => n + g.items.length, 0),
    skills: groups.reduce((n, g) => n + g.items.length, 0),
    projects: projects.length,
  };
  const stats = cv.about.stats.map((s) => ({ ...s, value: typeof s.value === "number" ? s.value : counts[s.value] }));

  return {
    ...cv,
    about: { ...cv.about, stats },
    experience: { ...cv.experience, items: experience },
    projects: { ...cv.projects, items: projects, featured: projects.filter((p) => p.featured) },
    skills: { ...cv.skills, groups },
    graph,
  };
}
