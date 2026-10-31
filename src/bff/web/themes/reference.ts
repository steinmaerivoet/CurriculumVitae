import type { Cv, SectionId } from "@/core";
import { API_VERSION, apiPath, buildApiResources, type ApiResourceName, type ApiResources } from "../../api/resources";

/**
 * API reference theme presenter. The theme documents the CV as an API, and
 * its response panes show the real JSON the site publishes under /api/v1/
 * (see src/bff/api/resources.ts), so what you read is what the endpoint returns.
 */

export type Endpoint = { method: "GET" | "MAIL"; path: string; href?: string | undefined };

export type ReferenceView = {
  /** "stein.api" */
  product: string;
  version: string;
  /** Sidebar groups: an introduction, then one endpoint per CV section. */
  nav: { title: string; ids: SectionId[]; endpoints: boolean }[];
  endpoints: Record<SectionId, Endpoint>;
  resources: Pick<ApiResources, "profile" | "experience" | "projects" | "skills" | "education">;
};

const GUIDE: SectionId[] = ["hero", "about"];
const RESOURCE: Partial<Record<SectionId, ApiResourceName>> = {
  hero: "profile",
  about: "profile",
  experience: "experience",
  skills: "skills",
  projects: "projects",
  education: "education",
};

export function buildReferenceView(cv: Cv): ReferenceView {
  const { profile, experience, projects, skills, education } = buildApiResources(cv);
  const endpoint = (id: SectionId): Endpoint => {
    const name = RESOURCE[id];
    return name ? { method: "GET", path: apiPath(name), href: apiPath(name) } : { method: "MAIL", path: cv.person.email, href: `mailto:${cv.person.email}` };
  };
  return {
    product: `${cv.person.firstName.toLowerCase()}.api`,
    version: API_VERSION,
    nav: [
      { title: "Guide", ids: cv.sections.filter((id) => GUIDE.includes(id)), endpoints: false },
      { title: "Endpoints", ids: cv.sections.filter((id) => !GUIDE.includes(id)), endpoints: true },
    ],
    endpoints: Object.fromEntries(cv.sections.map((id) => [id, endpoint(id)])) as Record<SectionId, Endpoint>,
    resources: { profile, experience, projects, skills, education },
  };
}
