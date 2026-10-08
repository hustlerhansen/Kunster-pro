# Kunstner Pro – Oljemaling & Kunstmateriell

Spesialisert norsk nettbutikk for oljemaling, pensler, lerret og malermedium.
**«Spar penger uten å gå på kompromiss med kvaliteten.»**

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (PostgreSQL, Auth, Storage, RLS) · Stripe Checkout · Vipps (forberedt) · Resend · Vercel.

> Sluttrapport med teststatus (PASS / FAIL / NOT TESTED), mangler og neste steg: [`docs/RAPPORT.md`](docs/RAPPORT.md)

## Kom i gang

```bash
npm install
npm run dev          # http://localhost:3000
```

Uten miljøvariabler kjører butikken i **demomodus**: katalog, søk, produktsider, handlekurv og innhold fungerer med demodata, mens innlogging, kasse og admin krever database.

### Med database (Supabase)

1. Opprett et Supabase-prosjekt (region EU, f.eks. Frankfurt/Stockholm).
2. Kjør migrasjonene i `supabase/migrations/` (i rekkefølge) og deretter `supabase/seed.sql`:
   ```bash
   supabase link --project-ref <ref>
   supabase db push            # migrasjoner
   psql "$DATABASE_URL" -f supabase/seed.sql   # demodata (valgfritt)
   ```
   Lokalt med Docker: `supabase start` (laster migrasjoner og seed automatisk).
3. Kopier `.env.example` til `.env.local` og fyll inn verdiene – se [`docs/MILJOVARIABLER.md`](docs/MILJOVARIABLER.md).
4. Opprett din bruker via «Opprett konto» og gjør den til administrator i Supabase SQL-editoren:
   ```sql
   update public.profiles set role = 'admin' where email = 'deg@dittdomene.no';
   ```
5. Gå til `/admin`.

## Skript

| Kommando | Beskrivelse |
|---|---|
| `npm run dev` | Utviklingsserver |
| `npm run build` / `npm start` | Produksjonsbygg / -server |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Enhetstester (Vitest): pris, MVA, rabatter, frakt, lønnsomhet, validering |
| `npm run db:test` | Databasetester (PostgreSQL): RLS, lagerreservasjon, samtidighet, betaling, kreditt, førpris m.m. |
| `npm run test:e2e` | Playwright. Fullstack-tester: `E2E_FULLSTACK=1 npm run test:e2e` |
| `npm run db:seed:generate` | Genererer `supabase/seed.sql` fra demodata i `src/lib/demo/` |
| `npx tsx scripts/generate-images.ts` | Genererer SVG-illustrasjoner (plassholdere) |
| `scripts/local-stack.sh` | Lett teststack uten Docker (PostgreSQL + GoTrue + PostgREST) |

## Arkitektur

```
src/
  app/
    (shop)/            butikk: forside, kategorier (/[kategori]), produkt, søk, tilbud,
                       handlekurv, kasse, Min side (/konto), B2B, kunstnerguide, juridiske sider
    admin/             adminpanel (rollebeskyttet) + _actions/ (server actions med revisjonslogg)
    actions/           server actions for kunder (auth, konto, kasse, nyhetsbrev, B2B)
    api/webhooks/      Stripe og Vipps (signaturverifisert, idempotent)
    api/cron/          utløpte reservasjoner, forlatte handlekurver, lav beholdning, forfalte fakturaer
  components/          ui/ (shadcn), shop/, admin/, forms/
  lib/
    data/              datatilgang (Supabase med fallback til demodata), server-side prising
    pricing/           prismotor (cart.ts) og lønnsomhet (profit.ts) – rene, testede funksjoner
    payments/          Stripe og Vipps
    email/             Resend + e-postmaler
    supabase/          klienter (server, browser, public, admin/service role, proxy)
supabase/
  migrations/          skjema, funksjoner, RLS, storage
  seed.sql             demodata (generert)
  tests/               databasetester
```

### Viktige prinsipper

- **Priser og totaler beregnes alltid på serveren.** Databasefunksjonen `create_order` kontrollerer i tillegg hver enhetspris og alle summer.
- **Ingen oversalg:** Lager reserveres atomisk med radlås (`SELECT … FOR UPDATE`) når ordren opprettes, og en databasebegrensning (`stock_reserved <= stock_on_hand`) gjør oversalg umulig. Reservasjoner utløper automatisk.
- **Ordre markeres som betalt kun når betalingsleverandøren bekrefter** (signert webhook eller direkte oppslag hos Stripe/Vipps).
- **RLS overalt:** kunder kan kun lese egne data; kostpriser, rabattkoder og logger er kun tilgjengelige for ansatte.
- **Kreditt gis aldri automatisk.** Handlekonto krever manuell godkjenning, og fakturakjøp er i tillegg sperret bak `FEATURE_BUSINESS_INVOICE`.
- **Førpris** beregnes automatisk som laveste pris siste 30 dager før en prisreduksjon.
- **Leveringstider** vises kun når administrator har aktivert og bekreftet dem.

## Distribusjon (Vercel)

1. Importer repoet i Vercel, sett miljøvariablene (Production + Preview).
2. Sett `NEXT_PUBLIC_SITE_URL` til produksjonsdomenet.
3. Registrer Stripe-webhook (se `docs/MILJOVARIABLER.md`).
4. Cron-jobbene i `vercel.json` aktiveres automatisk (krever `CRON_SECRET`).
