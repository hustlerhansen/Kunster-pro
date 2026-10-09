# Lanseringssjekkliste

Alt som kan gjøres uten eksterne kontoer er gjort og testet (se `RAPPORT.md`). Punktene under krever en konto, en nøkkel, en avtale eller juridiske opplysninger fra eieren, og kan ikke gjøres av utvikleren alene. Ferdige kommandoer er oppgitt der det er mulig.

## 1. Supabase (database og innlogging)

1. Opprett prosjekt på supabase.com i en EU-region (Frankfurt/Stockholm).
2. Kjør migrasjonene og eventuelt demodata:
   ```bash
   npm i -g supabase            # eller: npx supabase
   supabase login
   supabase link --project-ref <prosjekt-ref>
   supabase db push                                   # alle filer i supabase/migrations/
   psql "<tilkoblingsstreng fra Supabase>" -f supabase/seed.sql   # kun for demodata
   ```
3. Authentication → URL Configuration: Site URL = produksjonsdomenet. Redirect URLs: `https://<domene>/auth/callback` og `https://<domene>/auth/confirm`.
4. Authentication → Sign In: minimum passordlengde 10, e-postbekreftelse på.
5. Kopier `Project URL`, `anon key` og `service_role key` til Vercel (se pkt. 5).
6. Opprett deg selv som bruker på `/registrer`, og gjør deg til administrator i SQL-editoren:
   ```sql
   update public.profiles set role = 'admin' where email = 'deg@dittdomene.no';
   ```
7. Fjern demodata før åpning: arkiver de 20 produktene merket DEMO i Admin → Produkter (filter «Kun DEMO»).

## 2. Stripe

1. Opprett/aktiver konto på stripe.com (krever firmaopplysninger og bankkonto).
2. Developers → API keys: kopier `sk_test_…` (test) og senere `sk_live_…`.
3. Developers → Webhooks → legg til `https://<domene>/api/webhooks/stripe` med hendelsene:
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`. Kopier signeringshemmeligheten (`whsec_…`).
4. Test i testmodus med kort `4242 4242 4242 4242`: kjøp, sjekk at ordren blir «Betalt» i admin og at lageret trekkes, og test refusjon fra ordresiden.
5. Lokalt: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

## 3. Resend (e-post)

1. Opprett konto på resend.com, verifiser avsenderdomenet (legg inn DNS-postene SPF/DKIM).
2. Lag en API-nøkkel og sett `RESEND_API_KEY` og `EMAIL_FROM`.
3. Supabase → Authentication → SMTP: bruk Resend SMTP (`smtp.resend.com`, bruker `resend`, passord = API-nøkkelen) slik at bekreftelses-e-post fra Supabase kommer fra ditt domene.
4. Test: registrer en konto, legg en testordre og be om passordtilbakestilling. Sjekk innboks og søppelpost.

## 4. Firmaopplysninger og juridisk

1. Admin → Innstillinger → Firmaopplysninger: juridisk navn, organisasjonsnummer, adresse, e-post og telefon fra Brønnøysundregistrene. Bunntekst, kvitteringer og juridiske sider oppdateres automatisk.
2. La en jurist gjennomgå kjøpsvilkår, angrerett, personvernerklæring og informasjonskapsler (`src/lib/legal/texts.ts`).
3. Inngå databehandleravtaler med Supabase, Vercel, Stripe, Resend og transportør.
4. Sett opp regnskapsføring for salg, MVA og eventuelle fakturakjøp.

## 5. Vercel

1. Importer repoet. Legg inn miljøvariablene fra `.env.example` (Production og Preview). Dokumentasjon: `MILJOVARIABLER.md`.
2. Sett `NEXT_PUBLIC_SITE_URL` til produksjonsdomenet og `CRON_SECRET` til en lang tilfeldig streng, f.eks. `openssl rand -hex 32`.
3. Koble til domenet.
4. Cron-jobbene i `vercel.json` aktiveres automatisk. På Hobby-planen er kun daglige jobber tillatt, så sett `expire-orders` til daglig. Webhooken `checkout.session.expired` frigjør uansett lageret.

## 6. Logistikk

1. Inngå avtale med Bring/Posten og/eller PostNord.
2. Admin → Frakt: oppdater priser, terskel for fri frakt og beskrivelser etter avtalen.
3. Aktiver leveringstid først når den er dokumentert: Admin → Innstillinger → Leveringstid (krever bekreftelse).
4. Registrer sporingsnummer på hver ordre (Admin → Ordrer → Forsendelse). Automatisk etikettutskrift og sporing krever API-integrasjon (ikke bygget).

## 7. Innhold

1. Legg inn ekte produkter, dokumenterte spesifikasjoner (pigment, lysekthet og dekkevne kun når produsenten dokumenterer dem), foto og priser.
2. Last opp et lisensiert hero-bilde: Admin → Innstillinger → Forsidebilde.
3. Registrer ekte innkjøpspriser og leverandører (Admin → Leverandører, evt. CSV-import) slik at lønnsomhetstallene blir riktige.

## 8. Valgfritt

- **Vipps:** søk om Vipps MobilePay ePayment, sett `VIPPS_*` og `VIPPS_ENABLED=true`, og test i Vipps' testmiljø før aktivering i admin.
- **Google Analytics 4:** sett `NEXT_PUBLIC_GA_MEASUREMENT_ID` (lastes kun etter samtykke).
- **Fakturakjøp for bedrifter:** hold `FEATURE_BUSINESS_INVOICE=false` til kredittvurdering, vilkår, KID og purring er på plass.

## 9. Siste kontroll før åpning

- [ ] Testkjøp med ekte kort i produksjon (lavt beløp), og refusjon
- [ ] Ordrebekreftelse og forsendelses-e-post mottatt
- [ ] Ingen produkter merket DEMO er aktive
- [ ] Firmaopplysninger vises i bunntekst og på juridiske sider
- [ ] `https://<domene>/robots.txt` tillater indeksering og `sitemap.xml` er sendt til Google Search Console
- [ ] Backup er aktivert i Supabase (Point-in-Time Recovery anbefales)
