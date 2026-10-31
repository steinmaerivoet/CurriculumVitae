import type { Cv } from "@/core";

/**
 * Public API BFF: the CV as plain JSON resources, published as static files
 * under /api/v1/. Machine-readable, stable and free of UI copy: field names
 * are the contract, so change them only with a new version.
 *
 * The API reference theme shows these same resources, so what the site
 * shows as a "response" is exactly what the endpoint returns.
 */

export const API_VERSION = "v1";

const terms = (ts: { label: string; skill?: string | undefined }[]) => ({
  skills: [...new Set(ts.flatMap((t) => (t.skill ? [t.skill] : [])))],
  labels: ts.map((t) => t.label),
});

export function buildApiResources(cv: Cv) {
  const { person, about, experience, skills, projects, education, meta } = cv;

  const profile = {
    name: `${person.firstName} ${person.lastName}`,
    headline: person.headline,
    tagline: person.tagline.trim(),
    location: person.location,
    email: person.email,
    website: meta.url,
    available: person.available,
    links: person.socials.map((s) => ({ label: s.label, url: s.url })),
    about: { statement: about.statement.trim(), paragraphs: about.paragraphs.map((p) => p.trim()) },
    stats: about.stats.map((s) => ({ label: s.label, value: s.value, ...(s.suffix ? { suffix: s.suffix } : {}) })),
  };

  const employers = experience.items.map((e) => {
    const t = terms(e.tech);
    return {
      company: e.company,
      location: e.location ?? null,
      start: e.start,
      end: e.end,
      current: e.end === null,
      roles: e.roles,
      summary: e.summary.trim(),
      highlights: e.highlights,
      skills: t.skills,
      tech: t.labels,
      projects: e.projects.map((p) => p.id),
    };
  });

  const projectList = projects.items.map((p) => {
    const t = terms(p.tags);
    return {
      id: p.id,
      name: p.name,
      employer: p.employer ?? null,
      period: p.period ?? null,
      featured: p.featured,
      summary: p.summary ?? null,
      description: p.description.map((d) => d.trim()),
      url: p.url ?? null,
      skills: t.skills,
      tags: t.labels,
    };
  });

  const skillList = skills.groups.flatMap((g) =>
    g.items.map((s) => ({
      name: s.name,
      group: g.name,
      kind: g.kind,
      level: s.level ?? null,
      since: s.since ?? null,
      years: s.years ?? null,
      usedAt: s.usedIn.flatMap((u) => (u.kind === "employer" ? [u.company] : [])),
      usedIn: s.usedIn.flatMap((u) => (u.kind === "project" ? [u.id] : [])),
    })),
  );

  const educationRes = {
    degrees: education.items,
    certifications: education.certifications.map((c) => ({ ...c, year: c.year || null })),
    languages: education.languages,
  };

  return {
    profile,
    experience: employers,
    projects: projectList,
    skills: skillList,
    education: educationRes,
    /** Everything in one document. */
    cv: { apiVersion: API_VERSION, profile, experience: employers, projects: projectList, skills: skillList, education: educationRes },
  };
}

export type ApiResources = ReturnType<typeof buildApiResources>;
export type ApiResourceName = keyof ApiResources;
export const apiPath = (name: ApiResourceName) => `/api/${API_VERSION}/${name}.json`;
