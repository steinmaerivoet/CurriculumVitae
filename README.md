# steinmaerivoet.dev

Persoonlijke CV-website als interactieve verticale slideshow. Elke scroll, swipe of pijltjestoets brengt je met een vloeiende animatie naar precies de volgende slide.

**Stack:** Astro · React · TypeScript (strictest) · Tailwind CSS v4 · GSAP

Vier thema's uit dezelfde inhoud: **Plain** (standaard, `/`), **Terminal** (`/terminal/`), **API reference** (`/api-reference/`) en **Commit graph** (`/commit-graph/`). Kies er een met de keuzelijst bovenaan. Daarnaast een PDF en een JSON-API (`/api/v1/cv.json`). Hoe het in elkaar zit: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Starten

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # type-check + productie-build naar dist/
npm run preview   # bekijk de productie-build
npm test          # unit-tests (vitest) en Playwright-tests
npm run test:unit # enkel de unit-tests van core en BFF's
npm run test:e2e  # Playwright-tests, elk thema op desktop, laptop en twee telefoons
```

Node 22 of hoger.

## Inhoud aanpassen

**Alle inhoud staat in [`src/content/cv.yaml`](src/content/cv.yaml).** Je hoeft geen code aan te raken om:

- teksten, functies, projecten, skills, talen of contactgegevens te wijzigen;
- items toe te voegen of te verwijderen (de layout past zich aan);
- slides te herschikken of te verbergen via de lijst `slides`;
- labels in de navigatie en knoppen te wijzigen (`ui`, en `label` per sectie).

Skills, ervaring en projecten zijn aan elkaar gekoppeld: een project verwijst met `employer` naar een werkgever, en `tech`/`tags` verwijzen naar skills via hun naam. Daaruit volgen automatisch "Used in", de klikbare links tussen de slides en de netwerkweergave (knop "Network" op de skills-slide). Zie [CLAUDE.md](CLAUDE.md) voor de regels.

Het bestand wordt bij elke build gevalideerd met een schema ([`src/core/schema.ts`](src/core/schema.ts)). Een vergeten veld of een ongeldige URL geeft een duidelijke fout met het pad, bv. `experience.items.0.roles: Required`.

## PDF-versie van het CV

Bij elke build wordt uit dezelfde `cv.yaml` een A4-PDF gegenereerd: `/stein-maerivoet-curriculum-vitae.pdf` (de naam volgt uit `person.firstName` en `person.lastName`). De knop rechtsonder op de site downloadt die. Het is een statisch bestand, dus Cloudflare Pages serveert het zonder extra configuratie.

- Wat erin komt: [`src/bff/pdf/document.ts`](src/bff/pdf/document.ts). Layout en stijl: [`src/pdf/CvDocument.tsx`](src/pdf/CvDocument.tsx) ([react-pdf](https://react-pdf.org)), in de kleuren van het Plain-thema.
- Secties die je uit `slides` haalt, verdwijnen ook uit de PDF.
- Opeenvolgende functies bij dezelfde werkgever worden onder één bedrijfsnaam gegroepeerd.
- Lokaal bekijken: `npm run build` en open `dist/stein-maerivoet-curriculum-vitae.pdf`.

## Structuur

```
src/
  content/cv.yaml              alle inhoud
  core/                        content service: schema (zod), loader, linker, domeinmodel
  bff/
    web/deck.ts                DeckModel voor elk website-thema
    web/themes/*.ts            extra view model per thema (terminal, reference, git)
    pdf/document.ts            wat er in de PDF komt
    api/resources.ts           de JSON-API onder /api/v1/
    shared/                    opmaak, bestandsnamen en iconen voor alle front ends
  web/
    deck/                      slideshow-engine: track, snap, input, reveals, links
    headless/                  gedeeld gedrag: selectie van werkgever, skill, project
    shared/                    RefLink/TermLink, ThemeSwitcher, downloads
    themes/<id>/               één map per thema: index.tsx, Chrome, slides, theme.css
  pdf/                         layout van de PDF (react-pdf)
  pages/                       één pagina per thema, plus PDF, QR en API
```

### Een nieuwe slide toevoegen

1. Voeg de id toe aan `sectionIds` in `src/core/model.ts` en de inhoud aan het schema in `src/core/schema.ts`.
2. Maak in elk thema een component in `src/web/themes/<id>/slides/` en registreer het in `slides` van dat thema (TypeScript meldt een thema dat het vergeet).
3. Zet de id in de lijst `slides` in `cv.yaml`.

Animaties werken via data-attributen, zonder extra code:
`data-reveal` (fade-in, gestaffeld), `<SplitText>` (letters, Plain), `data-reveal-words` (woord per woord), `data-count="42"` (teller).

## UX-details

- Eén gebaar is altijd één slide, ook met het naschuiven van een trackpad of Magic Mouse.
- Op kleine schermen kan te lange inhoud binnen de slide scrollen; pas aan de rand gaat het naar de volgende slide.
- Horizontale carrousels op mobiel botsen niet met verticale navigatie.
- Diep linken naar een slide met `#experience`, `#contact`, ...
- Respecteert "beperk beweging" van het besturingssysteem.
- Inactieve slides zijn `inert`, zodat toetsenbord en schermlezers enkel de zichtbare slide zien.

## Hosting

Cloudflare Pages, zie [CLOUDFLARE.md](CLOUDFLARE.md).
