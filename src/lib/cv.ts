import { parse } from "yaml";
import { z } from "astro/zod";
import raw from "../content/cv.yaml?raw";
import { enrichSkills } from "./skills";

const year = z.union([z.string(), z.number()]).transform(String);
const link = z.object({ label: z.string(), url: z.url() });

export const skillLevels = ["expert", "advanced", "familiar"] as const;
export type SkillLevel = (typeof skillLevels)[number];

export const slideIds = ["hero", "about", "experience", "skills", "projects", "education", "contact"] as const;
export type SlideId = (typeof slideIds)[number];

const schema = z.object({
  meta: z.object({
    title: z.string(),
    description: z.string(),
    url: z.url(),
    lang: z.string().default("en"),
  }),
  slides: z.array(z.enum(slideIds)).min(1),
  ui: z
    .object({
      introLabel: z.string().default("Intro"),
      scrollHint: z.string().default("Scroll"),
      talkButton: z.string().default("Let's talk"),
      contentsLabel: z.string().default("Contents"),
      footer: z.string().default(""),
      downloadCv: z.string().default("Download CV"),
    })
    .prefault({}),
  person: z.object({
    firstName: z.string(),
    lastName: z.string(),
    headline: z.string(),
    tagline: z.string(),
    location: z.string(),
    email: z.email(),
    available: z.boolean().default(false),
    availabilityText: z.string().optional(),
    socials: z.array(link).default([]),
  }),
  about: z.object({
    label: z.string().default("About"),
    statement: z.string(),
    paragraphs: z.array(z.string()).default([]),
    stats: z
      .array(z.object({ value: z.number(), suffix: z.string().optional(), label: z.string() }))
      .default([]),
  }),
  experience: z.object({
    label: z.string().default("Experience"),
    presentLabel: z.string().default("Present"),
    items: z.array(
      z.object({
        company: z.string(),
        role: z.string(),
        start: year,
        end: year.nullable().default(null),
        location: z.string().optional(),
        summary: z.string(),
        highlights: z.array(z.string()).default([]),
        tech: z.array(z.string()).default([]),
      }),
    ),
  }),
  skills: z.object({
    label: z.string().default("Skills"),
    title: z.string().optional(),
    allLabel: z.string().default("All"),
    hint: z.string().default("Select a skill to see where I used it."),
    usedInLabel: z.string().default("Used in"),
    sinceLabel: z.string().default("Since"),
    yearsLabel: z.string().default("years"),
    levelLabels: z
      .object({
        expert: z.string().default("Expert"),
        advanced: z.string().default("Advanced"),
        familiar: z.string().default("Familiar"),
      })
      .prefault({}),
    groups: z.array(
      z.object({
        name: z.string(),
        items: z.array(
          z.union([
            z.string().transform((name) => ({ name })),
            z.object({
              name: z.string(),
              level: z.enum(skillLevels).optional(),
              since: z.number().int().optional(),
              icon: z.string().optional(),
              match: z.array(z.string()).default([]),
            }),
          ]),
        ),
      }),
    ),
  }),
  projects: z.object({
    label: z.string().default("Projects"),
    items: z.array(
      z.object({
        name: z.string(),
        meta: z.string().optional(),
        description: z.string(),
        url: z.url().optional(),
        tags: z.array(z.string()).default([]),
      }),
    ),
  }),
  education: z.object({
    label: z.string().default("Education"),
    languagesLabel: z.string().default("Languages"),
    certificationsLabel: z.string().default("Certifications"),
    items: z
      .array(
        z.object({
          school: z.string(),
          degree: z.string(),
          start: year,
          end: year,
          note: z.string().optional(),
        }),
      )
      .default([]),
    certifications: z
      .array(
        z.object({
          name: z.string(),
          issuer: z.string(),
          year: year.optional(),
          url: z.url().optional(),
        }),
      )
      .default([]),
    languages: z.array(z.object({ name: z.string(), level: z.string() })).default([]),
  }),
  contact: z.object({
    label: z.string().default("Contact"),
    heading: z.string(),
    text: z.string(),
    cta: z.string().default("Say hello"),
  }),
});

export type CVData = z.infer<typeof schema>;
export type CV = ReturnType<typeof enrichSkills>;
export type Skill = CV["skills"]["groups"][number]["items"][number];

function load(): CV {
  const result = schema.safeParse(parse(raw));
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`src/content/cv.yaml is invalid:\n${issues}`);
  }
  return enrichSkills(result.data);
}

export const cv = load();
