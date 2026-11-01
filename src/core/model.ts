import type { CvInput } from "./schema";

/**
 * The linked domain model: what the CV *is*, independent of how any front end
 * shows it. Built once from data.yaml by ./linker.ts.
 *
 * No formatting and no UI concerns live here: dates stay as years, icons stay
 * as the spec from data.yaml. Each front end turns this into its own view model
 * in src/bff.
 */

export const skillLevels = ["expert", "advanced", "familiar"] as const;
export type SkillLevel = (typeof skillLevels)[number];

export const skillKinds = ["technology", "practice", "tool"] as const;
export type SkillKind = (typeof skillKinds)[number];

export const sectionIds = ["hero", "about", "experience", "skills", "projects", "education", "contact"] as const;
export type SectionId = (typeof sectionIds)[number];

/** A reference to one item in the CV: what a link points at. */
export type Ref =
  | { kind: "skill"; name: string }
  | { kind: "employer"; company: string; project?: string }
  | { kind: "project"; id: string };

/** A label as written in data.yaml (`tech`, `tags`), linked to a skill when one matches. */
export type Term = { label: string; skill?: string | undefined };

export type Role = { title: string; start: string; end: string | null };

export type Project = {
  id: string;
  name: string;
  employer?: string | undefined;
  period?: string | undefined;
  featured: boolean;
  /** "Employer · period" unless data.yaml gives its own line. */
  meta?: string | undefined;
  summary?: string | undefined;
  description: string[];
  url?: string | undefined;
  tags: Term[];
  /** Where a link to this project goes: its own card when featured, else its employer. */
  ref: Ref;
};

export type Employer = {
  company: string;
  location?: string | undefined;
  /** Newest first, as in data.yaml. */
  roles: Role[];
  /** Latest title, first start and last end over all roles. */
  role: string;
  start: string;
  end: string | null;
  summary: string;
  highlights: string[];
  tech: Term[];
  projects: Project[];
  ref: Ref;
};

/** One place a skill was used. */
export type Usage =
  | { kind: "employer"; company: string; role: string; start: string; end: string | null; ref: Ref }
  | { kind: "project"; id: string; name: string; employer?: string | undefined; meta?: string | undefined; ref: Ref };

export type Skill = {
  name: string;
  group: string;
  kind: SkillKind;
  level?: SkillLevel | undefined;
  since?: number | undefined;
  years?: number | undefined;
  /** Icon spec from data.yaml; resolved to markup by the front ends that draw icons. */
  icon?: string | undefined;
  usedIn: Usage[];
};

export type SkillGroup = { name: string; kind: SkillKind; items: Skill[] };

/** `degree` is the node's number of connections: how much it weighs in the network. */
export type GraphNode = { id: string; kind: "skill" | "employer" | "project"; label: string; group?: string; ref: Ref; degree: number };
export type Graph = { nodes: GraphNode[]; edges: [string, string][] };

export type Stat = { value: number; suffix?: string | undefined; label: string };

/** The whole CV, linked. Labels for the UI travel with their section, as in data.yaml. */
export type Cv = {
  meta: CvInput["meta"];
  sections: SectionId[];
  ui: CvInput["ui"];
  person: CvInput["person"];
  about: Omit<CvInput["about"], "stats"> & { stats: Stat[] };
  experience: Omit<CvInput["experience"], "items"> & { items: Employer[] };
  skills: Omit<CvInput["skills"], "groups"> & { groups: SkillGroup[] };
  projects: Omit<CvInput["projects"], "items"> & { items: Project[]; featured: Project[] };
  education: CvInput["education"];
  contact: CvInput["contact"];
  graph: Graph;
};
