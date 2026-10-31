# CLAUDE.md

Personal CV site for Stein Maerivoet: a vertical slideshow built with Astro, React, TypeScript (strictest), Tailwind CSS v4 and GSAP. It deploys to Cloudflare Pages (see CLOUDFLARE.md).

## Content lives in cv.yaml, never in code

All text, roles, projects and skills are in `src/content/cv.yaml`. It is validated by the zod schema in `src/lib/cv.ts`. Components only render what the schema gives them. If you need new copy, add a field to the schema (with a sensible default) and to cv.yaml. Don't write the copy into a component.

## Skills, experience and projects are one linked web (important)

The CV is about skills. Every skill should be traceable to where it was used, and every employer and project to the skills it involved. Keep this linking intact on every edit:

- **Each fact is stated once in cv.yaml.** A project lives only under `projects.items` and points to its employer with `employer:`, which must equal a `company` under `experience`. A bad name fails the build.
- **Links to skills are made by name.** An entry in `experience.items[].tech` or `projects.items[].tags` links to a skill when it equals the skill's `name`, starts with it plus a space ("Java 25" → Java), or matches one of the skill's `match` terms.
- **Everything else is derived** in `src/lib/links.ts` at build time: a skill's "Used in" list, the clickable technology chips, the projects listed per employer, and the network graph on the skills slide. Don't duplicate these by hand.
- Navigation between slides goes through `follow(target)` and `useFollow(kind, ...)` in `src/components/deck/follow.ts`. When you add a new place that shows a skill, an employer or a project, make it a link with these helpers.

When adding content:

- **New skill:** check that experience `tech` and project `tags` actually match it. Add `match:` terms for synonyms.
- **New project:** set `employer` when there is one, and add `tags` that name its skills.
- **New employer:** list its skills in `tech`.
- A node with no edges in the network view ("Network" button on the skills slide) points to a missing link.

## Commands

```sh
npm run dev        # http://localhost:4321
npm run build      # astro check + production build
npm run test:e2e   # Playwright: desktop, laptop, phone, small phone
```

Run `npm run test:e2e` before pushing. The tests cover snapping (wheel, trackpad, touch, keyboard), reveals, layout fit per device, the skill filters, experience and cross-links.

## UX rules that the tests guard

- The deck only rests exactly on a slide, and one gesture moves at most one slide (magnet snap on wheel and trackpad).
- Content that has been revealed never disappears again.
- On desktop and laptop every slide fits without scrolling, including every employer and project state. Phones may scroll inside a slide.
- Interactions inside a slide (filters, tabs, accordions) must not move the rest of the slide.
