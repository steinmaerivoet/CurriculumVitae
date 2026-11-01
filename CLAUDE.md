# CLAUDE.md

Personal CV site for Stein Maerivoet: a vertical slideshow built with Astro, React, TypeScript (strictest), Tailwind CSS v4 and GSAP. It deploys to a Cloudflare Worker from `main` (see CLOUDFLARE.md).

The site has four themes (Plain, the default, Terminal, API reference and Commit graph), a PDF and a JSON API, all built from one content service. Read docs/ARCHITECTURE.md before changing structure: content → core (`src/core`) → one BFF per front end (`src/bff`) → front ends (`src/web/themes/<id>`, `src/pdf`). Dependencies only point down.

## Content lives in cv.yaml, never in code

All text, roles, projects and skills are in `src/content/cv.yaml`. It is validated by the zod schema in `src/core/schema.ts`. Components only render what their BFF gives them. Theme vocabulary (shell commands, HTTP methods, git verbs) belongs in the theme's presenter in `src/bff/web/themes`, not in cv.yaml and not in a component. If you need new copy, add a field to the schema (with a sensible default) and to cv.yaml. Don't write the copy into a component.

## Skills, experience and projects are one linked web (important)

The CV is about skills. Every skill should be traceable to where it was used, and every employer and project to the skills it involved. Keep this linking intact on every edit:

- **Each fact is stated once in cv.yaml.** A project lives only under `projects.items` and points to its employer with `employer:`, which must equal a `company` under `experience`. A bad name fails the build.
- **Links to skills are made by name.** An entry in `experience.items[].tech` or `projects.items[].tags` links to a skill when it equals the skill's `name`, starts with it plus a space ("Java 25" → Java), or matches one of the skill's `match` terms.
- **Everything else is derived** in `src/core/linker.ts` at build time: a skill's "Used in" list, the clickable technology chips, the projects listed per employer, and the network graph on the skills slide. Don't duplicate these by hand.
- Navigation between slides goes through `RefLink` / `TermLink` (`src/web/shared/TermLink.tsx`), which call `follow(ref)` in `src/web/deck/follow.ts`. Selections follow links through the headless hooks in `src/web/headless`. When you add a new place that shows a skill, an employer or a project, in any theme, make it a link with these. The API reference's JSON pane links too (`useJsonLinker`).

When adding content:

- **New skill:** check that experience `tech` and project `tags` actually match it. Add `match:` terms for synonyms.
- **New project:** set `employer` when there is one, and add `tags` that name its skills.
- **New employer:** list its skills in `tech`.
- A node with no edges in the network view ("Network" button on the skills slide) points to a missing link. The unit tests check this too.

## Commands

```sh
npm run dev        # http://localhost:4321
npm run build      # astro check + production build
npm run test:unit  # vitest: core and BFFs
npm run test:e2e   # Playwright: every theme on desktop, laptop, phone, small phone
```

Run `npm test` before pushing. The tests cover snapping (wheel, trackpad, touch, keyboard), reveals, layout fit per device, the skill filters, experience and cross-links, for every theme (`tests/e2e/themes.spec.ts`), plus the content service and BFFs (`tests/unit`).

`astro preview` runs as a single background server per project: if the e2e web server "exited early", stop a stale one with `npx astro preview stop`.

## UX rules that the tests guard

- The deck only rests exactly on a slide, and one gesture moves at most one slide (magnet snap on wheel and trackpad).
- Content that has been revealed never disappears again.
- On desktop and laptop every slide fits without scrolling, including every employer and project state, in every theme. Phones may scroll inside a slide.
- Interactions inside a slide (filters, tabs, accordions) must not move the rest of the slide.
