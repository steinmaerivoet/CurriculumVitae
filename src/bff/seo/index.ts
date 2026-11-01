import type { Cv } from "@/core";
import { clean, bareUrl } from "../shared/format";
import { files } from "../shared/files";

/**
 * SEO BFF: what search engines and link previews read, for every theme page.
 *
 * The slideshow only renders the selected employer, so a crawler that reads
 * the page sees one job. The structured data below carries the whole career
 * (every role, its story, its projects and skills) as schema.org JSON-LD, and
 * the share card is what LinkedIn, Slack and messengers show for a link.
 */

const nameOf = (cv: Pick<Cv, "person">) => `${cv.person.firstName} ${cv.person.lastName}`;
const abs = (cv: Pick<Cv, "meta">, path: string) => new URL(path, cv.meta.url).toString();

/** schema.org ProfilePage with the Person as its main entity. Plain JSON, ready for a <script type="application/ld+json">. */
export function buildStructuredData(cv: Cv) {
  const { person, experience, education, skills, meta } = cv;
  const org = (name: string) => ({ "@type": "Organization", name });
  const email = person.email ? { email: `mailto:${person.email}` } : {};

  // Role pattern: the role wraps the organisation, so dates and titles stay with the job.
  const roles = experience.items.flatMap((e) =>
    e.roles.map((r) => ({
      "@type": "EmployeeRole",
      roleName: r.title,
      startDate: r.start,
      ...(r.end ? { endDate: r.end } : {}),
      worksFor: org(e.company),
    })),
  );

  const occupations = experience.items.map((e) => ({
    "@type": "Occupation",
    name: `${e.role}, ${e.company}`,
    description: clean([e.summary, ...e.highlights, ...e.projects.map((p) => `${p.name}: ${p.summary ?? p.description[0] ?? ""}`)].join(" ")),
    skills: e.tech.map((t) => t.label).join(", "),
    ...(e.location ? { occupationLocation: { "@type": "City", name: e.location } } : {}),
  }));

  const schools = [...new Set(education.items.map((d) => d.school))];

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: meta.url,
    inLanguage: meta.lang,
    mainEntity: {
      "@type": "Person",
      "@id": `${abs(cv, "/")}#person`,
      name: nameOf(cv),
      givenName: person.firstName,
      familyName: person.lastName,
      jobTitle: experience.items[0]?.role ?? person.headline,
      description: clean(person.tagline),
      url: meta.url,
      image: abs(cv, files(cv).shareImage),
      ...email,
      address: { "@type": "PostalAddress", addressLocality: person.location },
      sameAs: person.socials.map((s) => s.url),
      worksFor: roles,
      hasOccupation: occupations,
      alumniOf: schools.map((name) => ({ "@type": "EducationalOrganization", name })),
      hasCredential: education.certifications.map((c) => ({
        "@type": "EducationalOccupationalCredential",
        name: c.name,
        recognizedBy: org(c.issuer),
        ...(c.year ? { dateCreated: c.year } : {}),
      })),
      knowsAbout: skills.groups.flatMap((g) => g.items.map((s) => s.name)),
      knowsLanguage: education.languages.map((l) => l.name),
    },
  };
}

/** What the share card (Open Graph image) shows. All of it comes from data.yaml. */
export type ShareCard = {
  firstName: string;
  lastName: string;
  headline: string;
  tagline: string;
  location: string;
  site: string;
};

export const buildShareCard = (cv: Cv): ShareCard => ({
  firstName: cv.person.firstName,
  lastName: cv.person.lastName,
  headline: cv.person.headline,
  tagline: clean(cv.person.tagline),
  location: cv.person.location,
  site: bareUrl(cv.meta.url),
});

/** The <head> tags every theme page shares: title, description, canonical URL and the share card. */
export function buildPageMeta(cv: Cv) {
  const title = `${nameOf(cv)} · ${cv.person.headline}`;
  return {
    title,
    description: clean(cv.meta.description),
    // Every theme shows the same CV: search engines get one canonical page.
    canonical: abs(cv, "/"),
    image: { url: abs(cv, files(cv).shareImage), width: SHARE_CARD.width, height: SHARE_CARD.height, alt: title },
  };
}

/** Open Graph's recommended size: sharp on retina previews, cropped well by every network. */
export const SHARE_CARD = { width: 1200, height: 630 } as const;
