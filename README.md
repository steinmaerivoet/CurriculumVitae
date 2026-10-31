# steinmaerivoet.dev

Persoonlijke CV-website als interactieve verticale slideshow. Elke scroll, swipe of pijltjestoets brengt je met een vloeiende animatie naar precies de volgende slide.

**Stack:** Astro · React · TypeScript (strictest) · Tailwind CSS v4 · GSAP

## Starten

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # type-check + productie-build naar dist/
npm run preview   # bekijk de productie-build
```

Node 22 of hoger.

## Inhoud aanpassen

**Alle inhoud staat in [`src/content/cv.yaml`](src/content/cv.yaml).** Je hoeft geen code aan te raken om:

- teksten, functies, projecten, skills, talen of contactgegevens te wijzigen;
- items toe te voegen of te verwijderen (de layout past zich aan);
- slides te herschikken of te verbergen via de lijst `slides`;
- labels in de navigatie en knoppen te wijzigen (`ui`, en `label` per sectie).

Het bestand wordt bij elke build gevalideerd met een schema ([`src/lib/cv.ts`](src/lib/cv.ts)). Een vergeten veld of een ongeldige URL geeft een duidelijke fout met het pad, bv. `experience.items.0.role: Required`.

## PDF-versie van het CV

Bij elke build wordt uit dezelfde `cv.yaml` een A4-PDF gegenereerd: `/stein-maerivoet-curriculum-vitae.pdf` (de naam volgt uit `person.firstName` en `person.lastName`). De knop rechtsonder op de site downloadt die. Het is een statisch bestand, dus Cloudflare Pages serveert het zonder extra configuratie.

- Layout en stijl: [`src/pdf/CvDocument.tsx`](src/pdf/CvDocument.tsx) ([react-pdf](https://react-pdf.org)), met dezelfde lettertypes als de site.
- Secties die je uit `slides` haalt, verdwijnen ook uit de PDF.
- Opeenvolgende functies bij dezelfde werkgever worden onder één bedrijfsnaam gegroepeerd.
- Lokaal bekijken: `npm run build` en open `dist/stein-maerivoet-curriculum-vitae.pdf`.

## Structuur

```
src/
  content/cv.yaml           alle inhoud
  lib/cv.ts                 laadt en valideert cv.yaml (zod)
  pages/index.astro         rendert de deck server-side, hydrateert als React-island
  pages/[file].pdf.ts       genereert de PDF-versie bij de build
  pdf/CvDocument.tsx        layout van de PDF (react-pdf)
  components/
    Deck.tsx                slideshow: state, transities, hash-routing
    deck/useDeckInput.ts    wiel, trackpad (met inertie-filter), touch en toetsenbord
    deck/transitions.ts     GSAP-transities en content-reveals
    deck/Chrome.tsx         vaste UI: navigatie, teller, voortgang
    DownloadCv.astro        vaste knop rechtsonder: download het CV als PDF
    slides/*.tsx            één component per slide
    ui/*.tsx                kleine bouwstenen (SplitText, Magnetic, ...)
```

### Een nieuwe slide toevoegen

1. Maak `src/components/slides/MijnSlide.tsx` (kopieer een bestaande als basis).
2. Voeg de id toe aan `slideIds` en het schema in `src/lib/cv.ts`.
3. Registreer het component in `SLIDES` in `src/components/Deck.tsx`.
4. Zet de id in de lijst `slides` in `cv.yaml`.

Animaties werken via data-attributen, zonder extra code:
`data-anim` (fade-in, gestaffeld), `<SplitText>` (letters), `data-anim-words` (woord per woord), `data-count="42"` (teller).

## UX-details

- Eén gebaar is altijd één slide, ook met het naschuiven van een trackpad of Magic Mouse.
- Op kleine schermen kan te lange inhoud binnen de slide scrollen; pas aan de rand gaat het naar de volgende slide.
- Horizontale carrousels op mobiel botsen niet met verticale navigatie.
- Diep linken naar een slide met `#experience`, `#contact`, ...
- Respecteert "beperk beweging" van het besturingssysteem.
- Inactieve slides zijn `inert`, zodat toetsenbord en schermlezers enkel de zichtbare slide zien.

## Hosting

Cloudflare Pages, zie [CLOUDFLARE.md](CLOUDFLARE.md).
