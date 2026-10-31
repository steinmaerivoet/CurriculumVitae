# steinmaerivoet.dev

Persoonlijke CV-website als interactieve verticale slideshow. Elke scroll, swipe of pijltjestoets brengt je met een vloeiende animatie naar precies de volgende slide.

**Stack:** Astro · React · TypeScript (strictest) · Tailwind CSS v4 · GSAP

## Starten

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # type-check + productie-build naar dist/
npm run preview   # bekijk de productie-build
npm run test:e2e  # Playwright-tests op desktop, laptop en twee telefoons
```

Node 22 of hoger.

## Inhoud aanpassen

**Alle inhoud staat in [`src/content/cv.yaml`](src/content/cv.yaml).** Je hoeft geen code aan te raken om:

- teksten, functies, projecten, skills, talen of contactgegevens te wijzigen;
- items toe te voegen of te verwijderen (de layout past zich aan);
- slides te herschikken of te verbergen via de lijst `slides`;
- labels in de navigatie en knoppen te wijzigen (`ui`, en `label` per sectie).

Skills, ervaring en projecten zijn aan elkaar gekoppeld: een project verwijst met `employer` naar een werkgever, en `tech`/`tags` verwijzen naar skills via hun naam. Daaruit volgen automatisch "Used in", de klikbare links tussen de slides en de netwerkweergave (knop "Network" op de skills-slide). Zie [CLAUDE.md](CLAUDE.md) voor de regels.

Het bestand wordt bij elke build gevalideerd met een schema ([`src/lib/cv.ts`](src/lib/cv.ts)). Een vergeten veld of een ongeldige URL geeft een duidelijke fout met het pad, bv. `experience.items.0.roles: Required`.

## Structuur

```
src/
  content/cv.yaml           alle inhoud
  lib/cv.ts                 laadt en valideert cv.yaml (zod)
  lib/links.ts              koppelt skills, ervaring en projecten (Used in, links, netwerk)
  pages/index.astro         rendert de deck server-side, hydrateert als React-island
  components/
    Deck.tsx                slideshow: state, transities, hash-routing
    deck/useDeckInput.ts    wiel, trackpad (met inertie-filter), touch en toetsenbord
    deck/reveal.ts          content-reveals (eenmalig per slide)
    deck/follow.ts          links tussen slides (follow / useFollow)
    deck/Chrome.tsx         vaste UI: navigatie, teller, voortgang
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
