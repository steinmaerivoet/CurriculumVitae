# steinmaerivoet.dev online zetten met Cloudflare

Dit doe je één keer met de hand. Reken op een half uur, plus wachttijd voor de nameservers.

## 1. Domein toevoegen aan Cloudflare

1. Maak een gratis account op <https://dash.cloudflare.com/sign-up> (of log in).
2. Klik op **Add a domain** (of *Onboard a domain*), vul `steinmaerivoet.dev` in en kies **Quick scan for DNS records**.
3. Kies het **Free** plan.
4. Cloudflare toont de DNS-records die het vond. Porkbun zet standaard een paar "parking"-records (een `ALIAS`/`A` op `@` en een `CNAME` op `*` of `www` naar `pixie.porkbun.com`). **Verwijder die**, anders botsen ze straks met Pages. E-mailrecords (MX/TXT) laat je staan als je die gebruikt.
5. Cloudflare geeft je nu **twee nameservers**, iets als `xxx.ns.cloudflare.com` en `yyy.ns.cloudflare.com`. Laat dit tabblad open.

## 2. Nameservers wijzigen bij Porkbun

1. Log in op <https://porkbun.com> en ga naar **Account → Domain Management**.
2. Bij `steinmaerivoet.dev` klik je op **Details** en dan bij **Authoritative Nameservers** op het potloodje.
3. Wis de Porkbun-nameservers en plak de twee van Cloudflare, elk op een eigen regel. Opslaan.
4. Staat **DNSSEC** aan bij Porkbun? Zet het daar eerst uit; je kan het later via Cloudflare opnieuw aanzetten.
5. Ga terug naar Cloudflare en klik op **Check nameservers**. Meestal is het binnen een uur actief (soms tot 24 uur). Je krijgt een mail als de site "Active" is.

## 3. Website deployen met Cloudflare Pages

1. In Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**.
   (Zie je alleen een Workers-wizard, kies dan onderaan de optie om een *Pages*-project te maken.)
2. Koppel je GitHub-account en geef toegang tot de repo `CurriculumVitae`.
3. Instellingen:
   - **Production branch**: de branch waar de site op staat (bv. `main`)
   - **Framework preset**: `Astro`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - De Node-versie wordt uit `.nvmrc` gehaald (22). Lukt dat niet, voeg dan onder *Environment variables* `NODE_VERSION` = `22` toe.
4. **Save and Deploy**. Na een paar minuten staat de site op `<projectnaam>.pages.dev`.

Vanaf nu wordt elke push naar de production branch automatisch gebouwd en online gezet. Andere branches en pull requests krijgen een eigen preview-link.

De build controleert ook `src/content/cv.yaml`. Zit daar een fout in, dan faalt de build met een melding die zegt welk veld fout is, en blijft de vorige versie gewoon online.

## 4. Je domein koppelen

1. Open het Pages-project → **Custom domains → Set up a custom domain**.
2. Vul `steinmaerivoet.dev` in en bevestig. Omdat het domein al in Cloudflare zit, maakt Cloudflare de DNS-record zelf aan.
3. Herhaal voor `www.steinmaerivoet.dev` als je dat ook wil.
4. Het HTTPS-certificaat wordt automatisch aangemaakt. Dat duurt meestal een paar minuten.

`.dev` werkt alleen via HTTPS (de browser dwingt dat af), maar dat regelt Cloudflare dus voor je.

## 5. Optioneel: www doorsturen naar het hoofddomein

**Rules → Redirect Rules → Create rule → template "Redirect from WWW to root"**. Dan komt iedereen op `https://steinmaerivoet.dev` uit.

## Problemen?

- **"Too many redirects"**: zet onder **SSL/TLS → Overview** de modus op **Full**.
- **Domein blijft "Pending"**: controleer bij Porkbun of de nameservers exact overeenkomen en of DNSSEC uit staat.
- **Custom domain blijft hangen op "Verifying"**: kijk in **DNS → Records** of er geen oude Porkbun-record op `@` of `www` meer staat.
- **Build faalt**: open de build-log in Pages. Meestal is het een tikfout in `cv.yaml`; de melding noemt het veld.
