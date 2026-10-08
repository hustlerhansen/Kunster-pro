# Miljøvariabler

Alle hemmeligheter leses fra miljøet. Ingenting er hardkodet. Variabler med prefikset `NEXT_PUBLIC_` blir synlige i nettleseren og skal **aldri** inneholde hemmeligheter.

| Variabel | Påkrevd | Synlig i nettleser | Beskrivelse | Hvor du finner den |
|---|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Ja (prod) | Ja | Full URL til nettstedet, f.eks. `https://kunstnerpro.no`. Brukes i e-poster, sitemap, canonical-URL-er og betalingsretur. | Ditt domene |
| `NEXT_PUBLIC_SUPABASE_URL` | Ja* | Ja | Supabase-prosjektets API-URL. Uten denne kjører butikken i demomodus. | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ja* | Ja | Offentlig «anon/publishable»-nøkkel. All tilgang begrenses av RLS. (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` støttes også.) | Supabase → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Ja* | **Nei** | Service role-nøkkel for serveroperasjoner (ordreopprettelse, webhooks, cron, admin-oppslag). Omgår RLS – kun server. | Supabase → API |
| `STRIPE_SECRET_KEY` | For kortbetaling | **Nei** | Stripe hemmelig nøkkel (`sk_test_…` i test, `sk_live_…` i produksjon). | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | For kortbetaling | **Nei** | Signeringshemmelighet for webhook-endepunktet `/api/webhooks/stripe`. Kortbetaling er deaktivert uten denne. | Stripe → Developers → Webhooks |
| `VIPPS_ENABLED` | Nei | Nei | `true` aktiverer Vipps (i tillegg til nøklene under og innstilling i admin). | – |
| `VIPPS_ENV` | Nei | Nei | `test` (apitest.vipps.no) eller `production`. | – |
| `VIPPS_CLIENT_ID`, `VIPPS_CLIENT_SECRET`, `VIPPS_SUBSCRIPTION_KEY`, `VIPPS_MSN` | For Vipps | **Nei** | Vipps MobilePay ePayment API-nøkler og salgsenhet (MSN). | portal.vippsmobilepay.com |
| `VIPPS_WEBHOOK_SECRET` | For Vipps | **Nei** | Hemmelighet fra registrering av webhook (`/api/webhooks/vipps`). | Vipps Webhooks API |
| `FEATURE_BUSINESS_INVOICE` | Nei | Nei | `true` tillater fakturakjøp for godkjente bedriftskunder. **Skal være `false`** til juridiske og økonomiske rutiner er på plass. Faktura må i tillegg aktiveres i admin. | – |
| `RESEND_API_KEY` | For e-post | **Nei** | Resend API-nøkkel. Uten den logges e-poster som «skipped» og sendes ikke. | resend.com → API Keys |
| `EMAIL_FROM` | For e-post | Nei | Avsender, f.eks. `Kunstner Pro <ordre@kunstnerpro.no>`. Domenet må verifiseres i Resend. | – |
| `EMAIL_REPLY_TO` | Nei | Nei | Svar-adresse (kundeservice). | – |
| `ADMIN_NOTIFICATION_EMAIL` | Nei | Nei | Mottar varsel om lav lagerbeholdning og nye kredittsøknader. | – |
| `BRING_API_UID`, `BRING_API_KEY`, `BRING_CUSTOMER_NUMBER` | Nei | **Nei** | Forberedt for Bring/Posten-integrasjon (etiketter/sporing). Brukes ikke ennå. | mybring.com |
| `POSTNORD_API_KEY` | Nei | **Nei** | Forberedt for PostNord-integrasjon. Brukes ikke ennå. | developer.postnord.com |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Nei | Ja | Google Analytics 4 måle-ID (`G-XXXXXXX`). Lastes kun etter samtykke. | Google Analytics → Admin → Data streams |
| `CRON_SECRET` | Ja (prod) | **Nei** | Beskytter `/api/cron/*`. Vercel sender den automatisk som `Authorization: Bearer …`. | Generer selv (lang tilfeldig streng) |

\* Påkrevd for en fungerende nettbutikk. Uten disse vises kun demokatalog og handlekurv.

## Supabase Auth-innstillinger (dashboard)

- **Site URL:** `NEXT_PUBLIC_SITE_URL`
- **Redirect URLs:** `https://dittdomene.no/auth/callback`, `https://dittdomene.no/auth/confirm`
- **E-postbekreftelse:** på (anbefalt)
- **SMTP:** Sett opp Resend som SMTP (smtp.resend.com) slik at Supabase sine e-poster (bekreftelse) sendes fra ditt domene. Passordtilbakestilling sendes via appens egen Resend-mal når `RESEND_API_KEY` er satt.
- **Minimum passordlengde:** 10

## Stripe webhook

Opprett et endepunkt `https://dittdomene.no/api/webhooks/stripe` med hendelsene:
`checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`.

Lokalt: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

## Vercel Cron

`vercel.json` definerer jobber for utløpte reservasjoner (hvert 15. min), forlatte handlekurver (hver time), lav lagerbeholdning (daglig) og forfalte fakturaer (daglig). Merk at Vercel Hobby-planen kun tillater daglige jobber – på Hobby bør `expire-orders` settes til daglig (Stripe-webhooken `checkout.session.expired` frigjør uansett lager når en betalingsøkt utløper).
