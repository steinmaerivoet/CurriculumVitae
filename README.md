# steinmaerivoet.dev

Persoonlijke CV-website als verticale slideshow: elke scroll, swipe of pijltjestoets brengt je vloeiend naar precies de volgende slide.

Pure HTML, CSS en JavaScript, zonder build-stap.

## Lokaal bekijken

```sh
python3 -m http.server 8000
```

Open daarna <http://localhost:8000>.

## Inhoud aanpassen

Alle tekst staat in `index.html`, één `<section class="slide">` per slide. Een slide toevoegen is een nieuwe `<section>` met een `id` en `data-title`; de navigatiebolletjes en de teller passen zich vanzelf aan. Elementen met de class `reveal` animeren één voor één binnen.

## Bediening

- Muiswiel en trackpad: één gebaar is één slide, ook met naschuiven van de trackpad.
- Touch: swipe omhoog of omlaag.
- Toetsenbord: ↑ ↓, Page Up/Down, spatie (shift+spatie terug), Home en End.
- Bolletjes rechts om direct naar een slide te springen. De URL krijgt een `#anker`, zodat je naar een slide kunt linken.
- Respecteert "beperk beweging" van het besturingssysteem.

## Hosting

Zie [CLOUDFLARE.md](CLOUDFLARE.md).
