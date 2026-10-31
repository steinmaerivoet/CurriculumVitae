import { skillKinds, skillLevels, type Cv, type Project, type SkillLevel } from "@/core";
import { bareUrl, clean, range } from "../shared/format";

/**
 * PDF BFF: decides what goes into the printable CV and in which order.
 * src/pdf/CvDocument.tsx only lays this out; it makes no content decisions.
 */

export type PdfProject = { id: string; name: string; url?: string | undefined; meta?: string | undefined; text: string[] };
export type PdfSkillSection = {
  title: string;
  /** Only the first block explains the chip styles, and only for levels in use. */
  legend: { level: SkillLevel; label: string }[];
  /** A kind with several groups keeps them apart, and may break across pages. */
  groups: { name?: string | undefined; items: { name: string; level?: SkillLevel | undefined }[] }[];
  wrap: boolean;
};

export type PdfEmployer = {
  company: string;
  location?: string | undefined;
  roles: { title: string; period: string }[];
  summary: string;
  highlights: string[];
  projects: PdfProject[];
  tech?: string | undefined;
};

export type PdfModel = {
  doc: { title: string; author: string; subject: string; keywords: string; creator: string; language: string };
  footer: { title: string; url: string };
  header: { firstName: string; lastName: string; monogram: string; headline: string; tagline: string };
  contact: { title: string; items: { label: string; value: string; href?: string }[] };
  skills: PdfSkillSection[];
  education?: { title: string; items: { title: string; school: string; period: string; note?: string | undefined }[] } | undefined;
  certifications?: { title: string; items: { title: string; meta: string }[] } | undefined;
  languages?: { title: string; items: { name: string; level: string }[] } | undefined;
  profile?: { title: string; statement: string; paragraphs: string[] } | undefined;
  experience?: { title: string; items: PdfEmployer[] } | undefined;
  /** Projects without an employer (personal, academic). The rest sit under their employer. */
  projects?: { title: string; items: PdfProject[] } | undefined;
};

// Print-only headings. TODO: move to cv.yaml if the PDF ever needs another language.
const LABELS = { contact: "Contact", email: "Email", location: "Location", website: "Website", profile: "Profile" };

/** A titled block, left out when its section is hidden or has nothing to show. */
const section = <T>(visible: boolean, title: string, items: T[]): { title: string; items: T[] } | undefined =>
  visible && items.length ? { title, items } : undefined;

export function buildPdfModel(cv: Cv): PdfModel {
  const { person, about, experience, skills, projects, education, meta } = cv;
  const fullName = `${person.firstName} ${person.lastName}`;
  const shows = (id: Cv["sections"][number]) => cv.sections.includes(id);
  const present = experience.presentLabel;
  const levelsInUse = skillLevels.filter((l) => skills.groups.some((g) => g.items.some((i) => i.level === l)));
  const underEmployer = (p: Project): PdfProject => ({ id: p.id, name: p.name, url: p.url, meta: p.period, text: [clean(p.summary ?? p.description[0] ?? "")] });
  const standalone = (p: Project): PdfProject => ({ id: p.id, name: p.name, url: p.url, meta: p.meta, text: p.description.map(clean) });

  return {
    doc: {
      title: `${fullName} · Curriculum Vitae`,
      author: fullName,
      subject: person.headline,
      keywords: skills.groups.flatMap((g) => g.items.map((i) => i.name)).join(", "),
      creator: meta.url,
      language: meta.lang,
    },
    footer: { title: `${fullName} · Curriculum Vitae`, url: bareUrl(meta.url) },
    header: {
      firstName: person.firstName,
      lastName: person.lastName,
      monogram: `${person.firstName[0] ?? ""}${person.lastName[0] ?? ""}`,
      headline: person.headline,
      tagline: clean(person.tagline),
    },
    contact: {
      title: LABELS.contact,
      items: [
        { label: LABELS.email, value: person.email, href: `mailto:${person.email}` },
        { label: LABELS.location, value: person.location },
        { label: LABELS.website, value: bareUrl(meta.url), href: meta.url },
        ...person.socials.map((s) => ({ label: s.label, value: bareUrl(s.url), href: s.url })),
      ],
    },
    skills: shows("skills")
      ? skillKinds.flatMap((kind, i) => {
          const groups = skills.groups.filter((g) => g.kind === kind && g.items.length > 0);
          if (!groups.length) return [];
          return [
            {
              title: skills.kindLabels[kind],
              legend: i === 0 ? levelsInUse.map((level) => ({ level, label: skills.levelLabels[level] })) : [],
              groups: groups.map((g) => ({ name: groups.length > 1 ? g.name : undefined, items: g.items.map(({ name, level }) => ({ name, level })) })),
              wrap: groups.length > 1,
            },
          ];
        })
      : [],
    education: section(shows("education"), education.label, education.items.map((e) => ({ title: e.degree, school: e.school, period: range(e.start, e.end, present), note: e.note }))),
    certifications: section(
      shows("education"),
      education.certificationsLabel,
      education.certifications.map((c) => ({ title: c.name, meta: [c.issuer, c.year].filter(Boolean).join(" · ") })),
    ),
    languages: section(shows("education"), education.languagesLabel, education.languages),
    profile: shows("about") ? { title: LABELS.profile, statement: clean(about.statement), paragraphs: about.paragraphs.map(clean) } : undefined,
    experience: shows("experience")
      ? {
          title: experience.label,
          items: experience.items.map((e) => ({
            company: e.company,
            location: e.location,
            roles: e.roles.map((r) => ({ title: r.title, period: range(r.start, r.end, present) })),
            summary: clean(e.summary),
            highlights: e.highlights.map(clean),
            projects: shows("projects") ? e.projects.map(underEmployer) : [],
            tech: e.tech.length ? e.tech.map((t) => t.label).join(", ") : undefined,
          })),
        }
      : undefined,
    projects: section(
      shows("projects"),
      projects.label,
      projects.items.filter((p) => !p.employer || !shows("experience")).map(standalone),
    ),
  };
}
