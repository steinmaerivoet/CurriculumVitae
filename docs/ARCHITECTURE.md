# Architecture

One source of content, one content service, a backend-for-frontend (BFF) per
consumer, and thin front ends. Everything runs at build time: the site is
static, so the "backend" is code that runs during `astro build` and the BFFs
hand each front end exactly the data it renders.

```
                     src/content/cv.yaml
                             │
              ┌──────────────▼──────────────┐
  core        │ schema → loader → linker    │  validate, link skills ↔ employers ↔ projects
  (backend)   │ getCv(): Cv                 │  one domain model, no presentation
              └──────────────┬──────────────┘
          ┌──────────────────┼──────────────────┬───────────────────┐
  bff     ▼                  ▼                  ▼                   ▼
     web/deck.ts       web/themes/*.ts     pdf/document.ts     api/resources.ts
     DeckModel         TerminalView,       PdfModel            JSON resources
     (every theme)     ReferenceView,
                       GitView
          │                  │                  │                   │
  front   ▼                  ▼                  ▼                   ▼
  ends   web/themes/<id>  (slides + chrome)   pdf/CvDocument   pages/api/v1/*.json
         on web/deck (engine) and web/headless (behaviour)
```

## Layers

| Layer | Folder | Knows about | Responsibility |
| --- | --- | --- | --- |
| Content | `src/content/cv.yaml` | nothing | Every fact, stated once. |
| Core | `src/core` | content | `schema.ts` validates (zod), `loader.ts` parses, `linker.ts` links and derives (usage, refs, graph, counted stats). `model.ts` holds the domain types. Fails the build on bad content. |
| BFF | `src/bff` | core | Shapes the domain model for one consumer. Formatting shared by all front ends is in `bff/shared` (`range`, file names, icons). |
| Engine | `src/web/deck` | BFF types | The slideshow: track, snap, input, reveals, cross-link routing. Knows nothing about how a slide looks. |
| Behaviour | `src/web/headless` | engine | Theme-agnostic state hooks: employer and skill selection, project spotlight, number keys, chrome intro. |
| Front ends | `src/web/themes/<id>`, `src/pdf` | BFF, engine, headless | Layout and styling only. No content decisions, no copy. |
| Pages | `src/pages` | all | Wire a BFF to a front end: one static page per theme, the PDF, the QR code and the JSON API. |

Dependencies only point down this table. A theme never imports `src/core`
runtime code (types are fine), and nothing in `src/core` knows that there is
a website, a PDF or an API.

### Server-only and browser-safe

`bff/web/model.ts` (types and pure helpers) is browser-safe. `bff/web/deck.ts`
and the theme presenters run at build time only: they resolve icons from the
icon sets, which therefore never ship to the browser. The deck model crosses
into the browser as island props, so it must stay plain JSON (a unit test
guards this).

## Website themes

A theme is a `Theme<V>` (`src/web/themes/types.ts`): one component per slide,
a `Chrome` (the fixed UI around the slides) and optional classes. `V` is the
theme's own view model, built by its presenter in `src/bff/web/themes/<id>.ts`
when it needs more than the shared `DeckModel` (the Terminal's neofetch lines,
the API reference's real JSON, the commit graph's hashes and heatmap).

| Theme | Page | Presenter | Idea |
| --- | --- | --- | --- |
| Plain (default) | `/` | none | Editorial, light and dark. |
| Terminal | `/terminal/` | `terminal.ts` | A tmux session: neofetch, fzf, htop, ls, tree, a prompt. |
| API reference | `/api-reference/` | `reference.ts` | Developer docs; the response pane shows the real `/api/v1` JSON. |
| Commit graph | `/commit-graph/` | `git.ts` | The career as git history: branch graph, stack diffs, heatmap, PRs, tags. |

The registry (`src/web/themes/registry.ts`) is the one list of themes: the
switcher, the pages and the tests read it. Each theme is its own static page,
so a visitor only downloads one theme; the switcher navigates and keeps the
slide in the hash.

Design tokens: each theme sets `--c-*` (colours) and `--f-*` (fonts) under
`[data-theme="<id>"]` in its `theme.css`. Components use the semantic
utilities (`bg-bg`, `text-fg`, `text-mute`, `border-line`, `text-accent`,
`font-display`, ...), so shared components such as the downloads and the theme
switcher look right in every theme.

### Conventions every theme follows

These keep behaviour and accessibility the same across themes, and let one
test suite (`tests/e2e/themes.spec.ts`) check all of them.

- Cross-links go through `RefLink` / `TermLink` (`src/web/shared/TermLink.tsx`).
  Never call `follow()` by hand in a theme.
- Selection state comes from the headless hooks (`useEmployerSelection`,
  `useSkillSelection`, `useProjectSelection` / `useProjectSpotlight`), so a link
  from anywhere lands on the right item in every theme.
- Employers and skill filters are `role="tab"` inside a `role="tablist"`.
  The employer detail has `id="experience-panel"` with the company in an `h3`;
  a project inside it is a button with `aria-expanded`. A selected skill has
  its name in an `h3`.
- Elements with `data-reveal` animate in once; `data-chrome` elements fade in
  through `useChromeIntro`.
- On desktop and laptop every slide fits without scrolling, in every state. A
  slide whose content changes with a selection anchors to the top, so nothing
  above the selection moves.
- Theme vocabulary (shell commands, HTTP methods, git verbs) lives in the
  theme's presenter. CV content and UI copy live in `cv.yaml`.

## Recipes

**New field in the CV.** Add it to `src/core/schema.ts` (with a default) and
to `cv.yaml`. If it needs deriving, do it in `linker.ts`. Then expose it in
the BFF of each front end that should show it.

**New theme.** Add it to the registry, add `src/web/themes/<id>/` (an
`index.tsx` island, `Chrome.tsx`, `theme.css`, one component per slide), a
presenter in `src/bff/web/themes/<id>.ts` if it needs one, and a page in
`src/pages`. Add it to `THEMES` in `tests/e2e/themes.spec.ts`.

**New front end** (another document format, a feed, ...). Add a BFF folder in
`src/bff/<name>` that turns `Cv` into what the front end needs, then a page
or endpoint in `src/pages` that renders it. The PDF (`bff/pdf` +
`src/pdf/CvDocument.tsx`) and the JSON API (`bff/api` +
`pages/api/v1/[resource].json.ts`) are the two examples.

## Tests

```sh
npm run test:unit   # vitest: core and BFFs (fast, no browser)
npm run test:e2e    # Playwright: every theme on desktop, laptop and two phones
npm test            # both
```
