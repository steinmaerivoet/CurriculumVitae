import { parse } from "yaml";
import { z } from "astro/zod";
import raw from "../content/cv.yaml?raw";

const year = z.union([z.string(), z.number()]).transform(String);
const link = z.object({ label: z.string(), url: z.url() });

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
      footer: z.string().default(""),
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
    groups: z.array(z.object({ name: z.string(), items: z.array(z.string()) })),
  }),
  projects: z.object({
    label: z.string().default("Projects"),
    items: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
        url: z.url().optional(),
        tags: z.array(z.string()).default([]),
      }),
    ),
  }),
  education: z.object({
    label: z.string().default("Education"),
    languagesLabel: z.string().default("Languages"),
    items: z.array(z.object({ school: z.string(), degree: z.string(), start: year, end: year })).default([]),
    languages: z.array(z.object({ name: z.string(), level: z.string() })).default([]),
  }),
  contact: z.object({
    label: z.string().default("Contact"),
    heading: z.string(),
    text: z.string(),
    cta: z.string().default("Say hello"),
  }),
});

export type CV = z.infer<typeof schema>;

function load(): CV {
  const result = schema.safeParse(parse(raw));
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`src/content/cv.yaml is invalid:\n${issues}`);
  }
  return result.data;
}

export const cv = load();
