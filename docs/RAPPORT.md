# Sluttrapport – Kunstner Pro

**Dato:** 8. oktober 2026
**Gren:** `claude/kunstner-pro-ecommerce-3t1x4t`

Kunstner Pro er bygget som en fungerende nettbutikk, ikke bare som en visuell demo. Alle 14 fasene er gjennomført. Rapporten skiller tydelig mellom det som er **testet og fungerer**, det som er **demo**, og det som **ikke er testet** fordi det krever eksterne nøkler eller avtaler.

---

## 1. Hva som er bygget

| Område | Innhold |
|---|---|
| **Butikk** | Forside etter referansedesignet (hero, fordeler, kategorifliser, populære produkter, B2B-blokk, kunstnerguide), fem kategorisider med SEO-tekster, alle produkter, tilbud, tilbehør, søk (fulltekst + delord), produktsider med varianter, spesifikasjoner per produkttype, lagerstatus, MVA-visning, favoritter, relaterte produkter og settinnhold med dokumentert besparelse |
| **Handlekurv og kasse** | Lokal handlekurv med server-side prising, mengderabatt, rabattkoder, fraktvalg og fri frakt-terskel, MVA-oppstilling. Kasse med Stripe Checkout, forberedt Vipps og fakturakjøp for godkjente bedrifter |
| **Ordre og lager** | Atomisk lagerreservasjon (ingen oversalg), automatisk frigjøring ved utløp eller avbrudd, betaling bekreftes kun via signert webhook eller oppslag hos leverandør, ordrehendelser, forsendelser med sporing, returer (angrerett og reklamasjon) |
| **Kundekonto (Min side)** | Registrering (navn, e-post, telefon, adresse, passord), innlogging, glemt passord, oversikt, ordrehistorikk, «Kjøp samme produkter igjen», fakturaer og kvitteringer (utskrift/PDF), adresser, favoritter, handlekonto, returer, kontoinnstillinger, samtykker, dataeksport og kontosletting |
| **B2B / handlekonto** | Bedriftsregistrering (org.nr. med mod11-kontroll), søknad om handlekonto, manuell godkjenning, kredittramme, kredittstatus, tilgjengelig kreditt, utestående, fakturaer, betalingshistorikk, sperring, prisgrupper med rabatt og egne varepriser |
| **Adminpanel (`/admin`)** | Dashbord med reelle nøkkeltall, produkter (opprett, rediger, arkiver, varianter, priser, bilder, kostprofil), kategorier, ordrer, returer, kunder (roller og sperring), handlekonto og kreditt, fakturaer, henvendelser, prisgrupper, lager (justering, varetelling, innkjøpsforslag), leverandørregister (`/admin/suppliers`, CSV-import, prishistorikk), innkjøpsordrer med varemottak, lønnsomhet, kampanjer, nyhetsbrev, kunstnerguide, frakt, innstillinger og hendelseslogg |
| **Innkjøp og lønnsomhet** | Landed cost (innkjøpspris × valutakurs + frakt + toll + andre kostnader, uten fradragsberettiget MVA), bruttofortjeneste, dekningsbidrag og dekningsgrad, tydelig skille mellom påslag og margin, prisforslag etter ønsket DG (eksempelet 70 kr / 50 % gir 140 kr ekskl. og 175 kr inkl. MVA), rapport over høyeste DB, kost låst på salgstidspunktet, kost for malersett summert fra komponentene |
| **Markedsføring** | Rabattkoder (prosent, fast beløp, fri frakt, periode, maks bruk, én per kunde, kategori), mengderabatter, produktpakker, førpris etter 30-dagersregelen, nyhetsbrev med dobbel bekreftelse, e-postkampanjer, påminnelse om forlatt handlekurv (kun ved samtykke), produktanbefalinger |
| **E-post** | Profilerte maler: velkomst, ordrebekreftelse, betalingsbekreftelse, forsendelse, leveringsoppdatering, passordtilbakestilling, kredittsøknad mottatt og behandlet, nyhetsbrev, kampanje, lav beholdning |
| **Juridisk / GDPR** | Kjøpsvilkår, angrerett med angreskjema, retur og reklamasjon, frakt og levering, personvernerklæring, informasjonskapsler, kontakt, samtykkebanner (GA4 lastes kun etter samtykke) |
| **SEO** | Dynamiske metadata, canonical-URL-er, strukturert data (Product, BreadcrumbList, OnlineStore, WebSite, CollectionPage, Article), `sitemap.xml`, `robots.txt`, Open Graph-bilde og norske nøkkelord |
| **Sikkerhet** | Row Level Security på alle tabeller, rollebasert tilgang (kunde, ansatt, administrator), beskyttede profilfelt, server-side validering (zod), webhook-signaturer, idempotens, rate limiting, revisjonslogg, sikkerhetshoder |

**Teknologi:** Next.js 16.4 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Radix), Supabase (PostgreSQL, Auth, Storage), Stripe, Resend og Vercel (cron).

---

## 2. Funksjoner som fungerer (verifisert med tester)

Testet mot ekte PostgreSQL 16 med Supabase Auth (GoTrue v2.180) og PostgREST v12, se avsnitt 6:

- Registrering, innlogging, feil passord, rollebeskyttelse og sperring av /admin for kunder
- Katalog, søk, varianter, handlekurv, mengderabatt og rabattkoder
- Ordreopprettelse med lagerreservasjon. Manipulert pris og oversalg avvises i databasen
- Samtidige kjøp av siste vare: 8 parallelle forsøk gir 1 ordre og 7 avvisninger, uten oversalg
- Mislykket betalingsstart: ordren kanselleres, lageret frigjøres, og ordren markeres aldri som betalt
- Stripe-webhook: gyldig signatur bekrefter betaling, ugyldig signatur avvises (400), og duplikater ignoreres
- Kundens ordreside, gjenbestilling, returforespørsel og dataeksport
- Bedriftssøknad, godkjenning av kreditt, aktivering av faktura, fakturakjøp innenfor kredittrammen og avvisning over rammen
- Admin: dashbord, opprette produkt og variant, registrere forsendelse med sporingsnummer, lagre innstillinger
- Varemottak med fordelt frakt og toll (landed cost), innkjøpsforslag og lønnsomhetsrapport
- Førpris (laveste pris siste 30 dager), rate limiting og cron-endepunkter med autorisasjon
- Alle 30 butikksider, 8 kontosider og 26 adminsider laster uten serverfeil eller JavaScript-feil
- Ingen side er bredere enn en mobilskjerm (390 px)

---

## 3. Funksjoner som er demo

| Hva | Detaljer |
|---|---|
| **20 demoprodukter** | Fordeling 6/4/4/3/3 som spesifisert. Fiktivt demovaremerke «Kunstner Pro Studio». Merket `is_demo` og **DEMO** i admin og på produktsiden. Pigment, dekkevne og lysekthet er bevisst tomme og vises som «Ikke dokumentert av produsent» |
| **Priser, lagertall og innkjøpskost** | Fiktive og merket DEMO. Én demoleverandør (EUR, kurs 11,5) |
| **Produktbilder og hero** | SVG-illustrasjoner, merket «Illustrasjon – ikke produktfoto». Skal erstattes med ekte foto via admin |
| **Mengderabatt** | «Kjøp 5 lerret – spar 10 %» er et eksempel og kan slås av i admin |
| **Rabattkoden `DEMO10`** | Finnes kun i demomodus (uten database) |
| **Kunstnerguide** | 6 artikler med generell fagkunnskap, uten påstander om spesifikke merkevarer |
| **Juridiske tekster** | Maler basert på norsk lov. Merket som utkast til firmaopplysninger er fylt ut, og skal kvalitetssikres av jurist |

**Ikke opprettet:** anmeldelser, kundevurderinger, salgsdata, kunder eller merkevarelogoer. Logoraden i referansedesignet er utelatt fordi butikken ikke selger disse merkene ennå.

---

## 4. Integrasjoner som mangler eller ikke er aktivert

| Integrasjon | Status |
|---|---|
| **Stripe** | Ferdig bygget (Checkout, webhook, refusjon). Krever nøkler. Selve betalingssiden hos Stripe er ikke testet uten ekte testnøkler |
| **Vipps MobilePay** | Forberedt (ePayment API, webhook med HMAC, capture ved forsendelse). Av som standard. Må verifiseres i Vipps sitt testmiljø |
| **Resend** | Ferdig bygget. Uten nøkkel logges e-poster som «skipped» |
| **Bring/Posten og PostNord** | Konfigurerbare fraktmetoder, manuelt sporingsnummer og sporingslenker. **API-integrasjon (etiketter, hentesteder, automatisk sporing) er ikke bygget** og krever kundeavtale |
| **Faktura/kreditt** | Teknisk ferdig, men sperret med `FEATURE_BUSINESS_INVOICE=false`. KID, purring, inkasso og regnskapseksport mangler |
| **Enhetsregisteret (Brønnøysund)** | Bygget (åpent API, ingen nøkkel): org.nr. verifiseres ved bedriftsregistrering og kredittsøknad. Ukjente og konkurs-/avviklede virksomheter avvises. Er registeret utilgjengelig, går søknaden videre og markeres «ikke verifisert» i admin. Testet kun mot lokal etterligning, siden registeret ikke var nåbart fra testmiljøet |
| **Kredittvurdering** | Manuell prosess med lenke til Brønnøysund. Ingen automatisk kredittopplysning |
| **Google Analytics 4** | Bygget med samtykke og Consent Mode v2. Krever måle-ID |
| **Klarna / forbrukerkreditt** | Ikke bygget. Forbrukerkreditt skal gå via godkjent ekstern leverandør |

---

## 5. API-nøkler som trengs

Se [`MILJOVARIABLER.md`](MILJOVARIABLER.md). Minimum for lansering:

1. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
2. `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
3. `RESEND_API_KEY`, `EMAIL_FROM` (og verifisert domene)
4. `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`, `ADMIN_NOTIFICATION_EMAIL`
5. Valgfritt: `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `VIPPS_*`, `BRING_*`/`POSTNORD_API_KEY`

---

## 6. Gjennomførte tester

**Testmiljø:** PostgreSQL 16 + Supabase Auth (GoTrue v2.180.0) + PostgREST v12.2.3 (samme komponenter som Supabase bruker), satt opp med `scripts/local-stack.sh`. Testene er kjørt mot både utviklings- og produksjonsbygg, og i demomodus.

| Testsett | Antall | Resultat |
|---|---|---|
| Enhetstester (Vitest): pris, MVA, rabatter, frakt, lønnsomhet, validering | 22 | **22 PASS** |
| Databasetester (`npm run db:test`): RLS, lager, betaling, kreditt, varemottak, førpris, rate limit, søk, kostpris | 18 | **18 PASS** |
| Samtidighetstest (8 parallelle kjøp av siste vare) | 1 | **PASS** |
| E2E fullstack (Playwright): kundereise og administrasjon | 13 | **13 PASS** |
| E2E integrasjoner mot lokale etterligninger av Stripe, Resend og Enhetsregisteret | 8 | **8 PASS** |
| E2E røyktest: alle butikk-, konto- og adminsider | 31 | **31 PASS** |
| E2E mobil (390 px) | 15 | **15 PASS** |
| Demomodus (uten database): røyktest og mobil | 45 | **45 PASS** |
| **Totalt E2E mot database (alle Playwright-tester)** | 67 | **67 PASS** |
| TypeScript, ESLint, produksjonsbygg (begge moduser) | – | **PASS** |
| `npm audit` (produksjonsavhengigheter) | – | **0 sårbarheter** |

### Testoversikt etter kravspesifikasjonen

| Område | Status | Merknad |
|---|---|---|
| Registrering | **PASS** | Profil og adresse opprettes. Svake passord avvises |
| Innlogging | **PASS** | Inkludert feil passord og rate limiting (observert i praksis) |
| Produktsøk | **PASS** | Fulltekst (norsk) og delord |
| Produktvarianter | **PASS** | Valg, pris og spesifikasjoner per variant |
| Handlekurv | **PASS** | Antall, fjerning, mengderabatt, rabattkode, frakt og MVA |
| Betaling – feilhåndtering | **PASS** | Ordren markeres ikke som betalt, og lageret frigjøres |
| Betaling – Stripe-webhook | **PASS** | Signert syntetisk hendelse, idempotens og avvisning av ugyldig signatur |
| Betaling – start av Stripe Checkout (vår kode) | **PASS (mot etterligning)** | Økt opprettes med beløp som summerer til ordretotalen, ordren venter, lageret reserveres, og kunden som lander på bekreftelsessiden før webhook ser ikke «betalt» |
| Betaling – Stripe Checkout-side hos Stripe | **NOT TESTED** | Krever ekte Stripe-testnøkler |
| Betaling – Vipps | **NOT TESTED** | Krever Vipps-avtale og testnøkler |
| Betaling – faktura (B2B) | **PASS** | Kredittramme, utestående og sperring |
| Ordrebehandling | **PASS** | Status, forsendelse, sporing og notater |
| Refusjon via Stripe | **PASS (mot etterligning)** / **NOT TESTED (Stripe)** | Riktig kall (payment intent) sendes. Selve refusjonen hos Stripe er ikke testet |
| Lageroppdatering | **PASS** | Reservasjon, trekk, frigjøring, utløp, samtidighet og varemottak |
| Adminfunksjoner | **PASS** | Alle sider og hovedhandlinger |
| Bildeopplasting (Supabase Storage) | **NOT TESTED** | Storage-API var ikke tilgjengelig i testmiljøet. Policyer er definert |
| CSV-import (leverandører og innkjøpspriser) | **PASS** | Inkludert feilrapportering for ukjent SKU og prishistorikk |
| E-postkampanje og nyhetsbrev | **PASS (mot etterligning)** | Kun bekreftede abonnenter mottar, avmeldingslenke i hver e-post, dobbel bekreftelse og avmelding virker |
| Utløpt Stripe-økt | **PASS** | Webhook `checkout.session.expired` frigjør lageret |
| Mobilvisning | **PASS** | 15 sider uten horisontal overflyt |
| E-postutsendelse | **PASS (mot etterligning)** / **NOT TESTED (Resend)** | Ordrebekreftelse, tilbakestilling, bekreftelse og kampanje sendes med riktig innhold. Levering via Resend og leveringsevne (SPF/DKIM) er ikke testet |
| Passordtilbakestilling | **PASS (mot etterligning)** | E-post med lenke, nytt passord, innlogging, og lenken kan ikke gjenbrukes |
| Kontosletting | **PASS** | Åpne ordre blokkerer, deretter slettes kontoen og ordre anonymiseres (bokføringsloven) |
| Enhetsregister-verifisering | **PASS (mot etterligning)** | Ukjent org.nr. og konkurs avvises, aktiv virksomhet verifiseres og lagres |
| Sikkerhet | **PASS** | RLS, rollebeskyttelse, funksjonsrettigheter, webhook-signatur, rate limiting, skjulte kostpriser og Content-Security-Policy (alle sider kjører uten CSP-brudd) |
| Feilhåndtering | **PASS** | Feilsider, prisavvik, utsolgt og mislykket betaling |
| Cron-jobber | **PASS** | Autorisasjon (401 uten nøkkel) og korrekte svar |

### Feil som ble funnet og rettet under testing

- Tvetydige relasjoner mellom produkter og varianter i PostgREST (via settinnhold) ga 500-feil. Rettet i alle spørringer.
- Profilbeskyttelsen blokkerte administratorer i SQL-editoren. Trigger endret til å sjekke API-rollen.
- Malersett fikk varekost 0 kr og DG på 100 %. Kost summeres nå fra komponentene.
- Kostpris kunne leses via RPC. Funksjonen har nå tilgangsvakt (test T19).
- Mobil: siden var bredere enn skjermen på produktsider og i headeren. Rettet, med regresjonstest.
- Opprydding i tester feilet stille fordi fakturaer blokkerer sletting av bedrift (ON DELETE RESTRICT, som er riktig for regnskapsdata). Testene sletter nå fakturaer først.
- Innloggingsgrensen per IP var for streng for delte nett (skoler). Hevet til 30 per 10 minutter per IP, med beholdt grense på 8 per e-post.

---

## 7. Hva som gjenstår før lansering

1. **Firmaopplysninger** (juridisk navn, org.nr., adresse, kontakt) legges inn i Admin → Innstillinger.
2. **Juridisk kvalitetssikring** av kjøpsvilkår, personvernerklæring, angrerett og databehandleravtaler.
3. **Ekte produkter:** erstatt eller arkiver de 20 DEMO-produktene, legg inn dokumenterte spesifikasjoner, ekte foto, priser og innkjøpskost.
4. **Hero-foto:** lisensiert bilde av en kunstner som arbeider med oljemaling (Admin → Innstillinger → Forsidebilde).
5. **Stripe:** aktiver konto, legg inn nøkler, registrer webhook og test et kjøp i testmodus.
6. **Resend:** verifiser domene. Sett Supabase SMTP til Resend.
7. **Logistikk:** inngå avtale med Bring og/eller PostNord, sett riktige fraktpriser, og aktiver leveringstid først når den er dokumentert.
8. **Supabase:** opprett prosjekt i EU-region, kjør migrasjoner, opprett administrator og konfigurer redirect-URL-er.
9. **Vercel:** miljøvariabler, domene og cron (merk begrensningen i Hobby-planen).
10. **Faktura/kreditt:** hold `FEATURE_BUSINESS_INVOICE=false` til kredittvurdering, vilkår, KID, purring og regnskapsrutiner er på plass.
11. Test resten av NOT TESTED-punktene i avsnitt 6 med ekte nøkler. Se `docs/LANSERING.md` for en ferdig sjekkliste med kommandoer.

---

## 8. Anbefalte forbedringer

- Rolle- og signaturrett-sjekk mot Brønnøysund (i dag verifiseres kun at virksomheten finnes og er aktiv).
- Bring/PostNord-API: hentestedsvelger, fraktetiketter og automatisk sporingsstatus.
- Fakturamodul med KID, PDF-generering, EHF og regnskapsintegrasjon (Fiken, Tripletex eller PowerOffice).
- Handlekurv lagret på serveren for innloggede kunder (synk mellom enheter).
- Produktfiltre per egenskap (farge, størrelse, hårtype) når sortimentet vokser.
- Ekte kundeanmeldelser fra verifiserte kjøp (aldri oppdiktede).
- Lagerlokasjoner, plukklister og pakksedler.
- Valutakurs fra Norges Bank API i innkjøpsordrer.
- Varsling (e-post/Slack) ved nye ordre.
- Bildeoptimalisering og CDN for produktfoto (Supabase Image Transformation).

---

## 9. Sikkerhetsmerknader

| Punkt | Vurdering |
|---|---|
| **Content-Security-Policy** | Satt i produksjon (statisk, uten nonce, for å bevare rask lasting med statiske sider). `script-src` tillater `'unsafe-inline'` fordi Next.js trenger inline-skript for hydrering. Resten er strengt (kun egne ressurser, Supabase og GA, ingen rammer, ingen `object`, `form-action 'self'`). En strengere nonce-basert CSP krever at alle sider rendres dynamisk og er en bevisst avveining mot ytelse. |
| **Bedriftsregistrering** | Org.nr. kontrolleres mot Enhetsregisteret. Er registeret utilgjengelig, godtas registreringen som «ikke verifisert» (vises i admin), og kreditt krever uansett manuell godkjenning. Verifiseringen sjekker ikke at brukeren faktisk representerer virksomheten. |
| **Ansattrollen («staff»)** | Har bred tilgang til ordre og kundedata, men ikke til innstillinger, kreditt, roller eller logg. Gi rollen kun til betrodde personer. |
| **Rate limiting** | Bruker Postgres når service role er satt. Ellers brukes en minnebasert fallback per serverinstans. |
| **Service role-nøkkel** | Brukes kun på serveren. Må aldri legges i en `NEXT_PUBLIC_`-variabel. |
| **Gjestebekreftelse** | Ordresiden for gjester er beskyttet med en httpOnly-cookie (24 timer) og ID-er som ikke kan gjettes. |
| **Avhengigheter** | 0 sårbarheter i produksjonsavhengigheter. 5 «high» i utviklingsverktøy (`braces`), som ikke påvirker butikken. |
| **Hemmeligheter** | Ingen hemmeligheter er committet. `.env*` er ignorert, unntatt `.env.example`. |

---

## 10. Neste anbefalte utviklingsfase

**Fase 15 – Lanseringsklargjøring og logistikk:**

1. Produksjonsoppsett: Supabase (EU), Vercel, domene, Stripe live, Resend og CSP.
2. Bring/PostNord-integrasjon med hentestedsvelger og fraktetiketter.
3. Import av ekte sortiment (CSV) med dokumenterte spesifikasjoner og foto.
4. Juridisk gjennomgang og publisering av firmaopplysninger.
5. Pilot med en lukket gruppe kunder før åpning, med overvåking av ordreflyt, webhooks og e-post.

Deretter: fakturamodul med regnskapsintegrasjon (aktivering av handlekonto), BRREG-verifisering og produktfiltre.
