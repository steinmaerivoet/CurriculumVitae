import type { CvInput } from "./schema";
import type { Cv, Employer, Graph, GraphNode, Project, Ref, Skill, SkillGroup, Term, Usage } from "./model";
import { matches, norm, slug } from "./matching";

/**
 * Links skills, employers and projects into one web.
 *
 * cv.yaml states each fact once:
 *   - project.employer  → employer (by company name)
 *   - employer.tech     → skills (by name, or a skill's `match` terms)
 *   - project.tags      → skills (same matching)
 * Everything else (a skill's "Used in", linked chips, the network graph, the
 * counted stats) is derived here. A broken reference fails the build.
 */

export class CvLinkError extends Error {
  constructor(readonly problems: string[]) {
    super(`src/content/cv.yaml has broken links:\n  • ${problems.join("\n  • ")}`);
    this.name = "CvLinkError";
  }
}

/** Resolves free-text labels to skill names. The most specific term wins. */
function termResolver(input: CvInput) {
  const terms = input.skills.groups.flatMap((g) =>
    g.items.map((item) => ({
      name: item.name,
      terms: [item.name, ...item.match].map(norm),
    })),
  );
  const skillFor = (label: string): string | undefined => {
    let best: { name: string; len: number } | undefined;
    for (const s of terms) {
      for (const t of s.terms) {
        if (matches([t], label) && (!best || t.length > best.len)) best = { name: s.name, len: t.length };
      }
    }
    return best?.name;
  };
  return (labels: string[]): Term[] => labels.map((label) => ({ label, skill: skillFor(label) }));
}

function linkProjects(input: CvInput, toTerms: (l: string[]) => Term[], problems: string[]): Project[] {
  const companies = new Set(input.experience.items.map((e) => e.company));
  const seen = new Set<string>();
  return input.projects.items.map((p) => {
    const id = p.id ?? slug(p.name);
    if (seen.has(id)) problems.push(`projects: two projects share the id "${id}"`);
    seen.add(id);
    if (p.employer && !companies.has(p.employer)) {
      problems.push(`projects.${p.name}.employer: "${p.employer}" is not a company under experience`);
    }
    const ref: Ref = p.featured || !p.employer ? { kind: "project", id } : { kind: "employer", company: p.employer, project: id };
    return {
      id,
      name: p.name,
      employer: p.employer,
      period: p.period,
      featured: p.featured,
      meta: p.meta ?? ([p.employer, p.period].filter(Boolean).join(" · ") || undefined),
      summary: p.summary,
      description: p.description,
      url: p.url,
      tags: toTerms(p.tags),
      ref,
    };
  });
}

function linkEmployers(input: CvInput, projects: Project[], toTerms: (l: string[]) => Term[]): Employer[] {
  return input.experience.items.map((e) => ({
    company: e.company,
    location: e.location,
    roles: e.roles,
    role: e.role,
    start: e.start,
    end: e.end,
    summary: e.summary,
    highlights: e.highlights,
    tech: toTerms(e.tech),
    projects: projects.filter((p) => p.employer === e.company),
    ref: { kind: "employer", company: e.company },
  }));
}

function linkSkills(input: CvInput, employers: Employer[], projects: Project[], thisYear: number): SkillGroup[] {
  const uses = (terms: Term[], name: string) => terms.some((t) => t.skill === name);
  return input.skills.groups.map((group) => ({
    name: group.name,
    kind: group.kind,
    items: group.items.map((item): Skill => {
      const usedAt = employers.filter((e) => uses(e.tech, item.name));
      const usedOn = projects.filter((p) => uses(p.tags, item.name));
      const since = item.since ?? Math.min(...usedAt.map((e) => Number(e.start)).filter(Number.isFinite));
      const known = Number.isFinite(since);
      const usedIn: Usage[] = [
        ...usedAt.map((e): Usage => ({ kind: "employer", company: e.company, role: e.role, start: e.start, end: e.end, ref: e.ref })),
        ...usedOn.map((p): Usage => ({ kind: "project", id: p.id, name: p.name, employer: p.employer, meta: p.meta, ref: p.ref })),
      ];
      return {
        name: item.name,
        group: group.name,
        kind: group.kind,
        level: item.level,
        since: known ? since : undefined,
        years: known ? Math.max(1, thisYear - since) : undefined,
        icon: item.icon,
        usedIn,
      };
    }),
  }));
}

function buildGraph(groups: SkillGroup[], employers: Employer[], projects: Project[]): Graph {
  const nodes: GraphNode[] = [
    ...groups.flatMap((g) => g.items.map((s): GraphNode => ({ id: `s:${s.name}`, kind: "skill", label: s.name, group: g.name, ref: { kind: "skill", name: s.name } }))),
    ...employers.map((e): GraphNode => ({ id: `e:${e.company}`, kind: "employer", label: e.company, ref: e.ref })),
    ...projects.map((p): GraphNode => ({ id: `p:${p.id}`, kind: "project", label: p.name, ref: p.ref })),
  ];
  const edges = new Set<string>();
  for (const e of employers) for (const t of e.tech) if (t.skill) edges.add(`e:${e.company}|s:${t.skill}`);
  for (const p of projects) {
    for (const t of p.tags) if (t.skill) edges.add(`p:${p.id}|s:${t.skill}`);
    if (p.employer) edges.add(`p:${p.id}|e:${p.employer}`);
  }
  return { nodes, edges: [...edges].map((k) => k.split("|") as [string, string]) };
}

/** Turns validated cv.yaml into the linked domain model. */
export function link(input: CvInput, now: Date = new Date()): Cv {
  const problems: string[] = [];
  const toTerms = termResolver(input);
  const projects = linkProjects(input, toTerms, problems);
  if (problems.length) throw new CvLinkError(problems);

  const employers = linkEmployers(input, projects, toTerms);
  const groups = linkSkills(input, employers, projects, now.getFullYear());
  const counts = {
    technologies: groups.filter((g) => g.kind === "technology").reduce((n, g) => n + g.items.length, 0),
    skills: groups.reduce((n, g) => n + g.items.length, 0),
    projects: projects.length,
  };

  return {
    meta: input.meta,
    sections: input.slides,
    ui: input.ui,
    person: input.person,
    about: { ...input.about, stats: input.about.stats.map((s) => ({ ...s, value: typeof s.value === "number" ? s.value : counts[s.value] })) },
    experience: { ...input.experience, items: employers },
    skills: { ...input.skills, groups },
    projects: { ...input.projects, items: projects, featured: projects.filter((p) => p.featured) },
    education: input.education,
    contact: input.contact,
    graph: buildGraph(groups, employers, projects),
  };
}
