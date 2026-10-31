import { z } from "zod";
import { sectionIds, skillKinds, skillLevels } from "./model";

/**
 * The contract for src/content/cv.yaml.
 *
 * This is the only place that knows the file's shape. Everything after
 * validation works with the linked domain model in ./model.ts.
 */

const year = z.union([z.string(), z.number()]).transform(String);
const linkItem = z.object({ label: z.string(), url: z.url() });

const skillItem = z.object({
  name: z.string(),
  level: z.enum(skillLevels).optional(),
  since: z.number().int().optional(),
  icon: z.string().optional(),
  match: z.array(z.string()).default([]),
});

export const cvSchema = z.object({
  meta: z.object({
    title: z.string(),
    description: z.string(),
    url: z.url(),
    lang: z.string().default("en"),
  }),
  slides: z.array(z.enum(sectionIds)).min(1),
  ui: z
    .object({
      introLabel: z.string().default("Intro"),
      scrollHint: z.string().default("Scroll"),
      talkButton: z.string().default("Let's talk"),
      contentsLabel: z.string().default("Contents"),
      footer: z.string().default(""),
      downloadCv: z.string().default("Download CV"),
      downloadQr: z.string().default("Download QR code"),
      themeLabel: z.string().default("Theme"),
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
    socials: z.array(linkItem).default([]),
  }),
  about: z.object({
    label: z.string().default("About"),
    statement: z.string(),
    paragraphs: z.array(z.string()).default([]),
    stats: z
      .array(
        z.object({
          // A number, or something to count from the rest of the CV.
          value: z.union([z.number(), z.enum(["technologies", "skills", "projects"])]),
          suffix: z.string().optional(),
          label: z.string(),
        }),
      )
      .default([]),
  }),
  experience: z.object({
    label: z.string().default("Experience"),
    presentLabel: z.string().default("Present"),
    projectsLabel: z.string().default("Projects"),
    // One item per employer, like LinkedIn. `role`, `start` and `end` are
    // derived from the roles, so consumers that need one line per employer
    // (the skills slide, the PDF) don't have to.
    items: z.array(
      z
        .object({
          company: z.string(),
          location: z.string().optional(),
          roles: z
            .array(z.object({ title: z.string(), start: year, end: year.nullable().default(null) }))
            .min(1),
          summary: z.string(),
          highlights: z.array(z.string()).default([]),
          tech: z.array(z.string()).default([]),
        })
        .transform((e) => {
          const starts = e.roles.map((r) => r.start).sort();
          const ends = e.roles.map((r) => r.end);
          return {
            ...e,
            role: e.roles[0]!.title,
            start: starts[0]!,
            end: ends.includes(null) ? null : (ends as string[]).sort().at(-1)!,
          };
        }),
    ),
  }),
  skills: z.object({
    label: z.string().default("Skills"),
    title: z.string().optional(),
    allLabel: z.string().default("All"),
    kindLabels: z
      .object({
        technology: z.string().default("Technologies"),
        practice: z.string().default("Ways of working"),
        tool: z.string().default("Tools"),
      })
      .prefault({}),
    hint: z.string().default("Select a skill to see where I used it."),
    graphButton: z.string().default("Network"),
    graphTitle: z.string().default("How it all connects"),
    graphHint: z.string().default("Hover to see the connections, click to go there."),
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
        kind: z.enum(skillKinds).default("technology"),
        // A bare string is shorthand for `{ name: ... }`.
        items: z.array(z.preprocess((v) => (typeof v === "string" ? { name: v } : v), skillItem)),
      }),
    ),
  }),
  projects: z.object({
    label: z.string().default("Projects"),
    // Every project lives here once. `employer` links it to an experience
    // item; `tags` link it to skills (see src/lib/links.ts).
    items: z.array(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        employer: z.string().optional(),
        period: year.optional(),
        featured: z.boolean().default(false),
        meta: z.string().optional(),
        summary: z.string().optional(),
        // One paragraph, or a list of paragraphs.
        description: z.union([z.string(), z.array(z.string())]).transform((d) => (Array.isArray(d) ? d : [d])),
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

export type CvInput = z.infer<typeof cvSchema>;
