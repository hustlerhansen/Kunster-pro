/**
 * Juridiske maltekster basert på norsk lovgivning (forbrukerkjøpsloven, angrerettloven,
 * markedsføringsloven, ehandelsloven, personopplysningsloven/GDPR, ekomloven, bokføringsloven).
 * Plassholdere {{…}} fylles med firmaopplysninger fra adminpanelet.
 * MÅ kvalitetssikres av jurist før lansering.
 */

export const KJOPSVILKAR = `## 1. Avtalen
Avtalen består av disse kjøpsvilkårene, opplysninger gitt i bestillingsløsningen og eventuelt særskilt avtalte vilkår. Ved motstrid går det som er særskilt avtalt foran, så lenge det ikke strider mot ufravikelig lovgivning.

Avtalen er regulert av blant annet **forbrukerkjøpsloven**, **angrerettloven** og **ehandelsloven** for forbrukerkjøp. For kjøp mellom næringsdrivende gjelder **kjøpsloven** og eventuelle særskilte avtaler (se punkt 13).

## 2. Partene
**Selger:** {{firmanavn}}, org.nr. {{orgnr}}, {{adresse}}. E-post: {{epost}}. Telefon: {{telefon}}.

**Kjøper** er den forbrukeren eller virksomheten som foretar bestillingen.

## 3. Priser
Alle priser er oppgitt i norske kroner **inkludert 25 % merverdiavgift**. Fraktkostnader og eventuelle gebyrer vises i handlekurven og kassen før kjøpet bekreftes. Kjøper skal ikke betale noe som ikke er opplyst før kjøpet.

Ved prisreduksjoner oppgis førpris som den laveste prisen produktet har hatt de siste 30 dagene før reduksjonen.

## 4. Avtaleinngåelse
Avtalen er bindende når bestillingen er sendt og betalingen er gjennomført. Du mottar en ordrebekreftelse på e-post. Kontroller at ordrebekreftelsen stemmer med bestillingen, og ta kontakt hvis noe er feil.

Ved åpenbare feil i pris eller produktinformasjon (for eksempel en tastefeil), som kjøper burde forstå, er selger ikke bundet av prisen.

## 5. Betaling
Betaling skjer med de betalingsmetodene som vises i kassen. Kortbetaling behandles av Stripe – vi lagrer ikke kortopplysninger. Beløpet reserveres eller trekkes ved bestilling, og ordren registreres som betalt først når betalingsleverandøren har bekreftet betalingen.

Godkjente bedriftskunder med handlekonto kan betale på faktura etter avtalte betalingsvilkår.

## 6. Levering
Levering skjer når kjøperen, eller kjøperens representant, har overtatt varen. Leveringsalternativer og pris vises i kassen. Dersom leveringstid ikke er avtalt, skal levering skje uten unødig opphold og senest 30 dager etter bestillingen. Se også [Frakt og levering](/frakt-og-levering).

## 7. Risikoen for varen
Risikoen for varen går over på kjøper når varen er overtatt i samsvar med punkt 6.

## 8. Angrerett
Forbrukere har 14 dagers angrerett etter angrerettloven. Se [Angrerett](/angrerett) for frister, angreskjema og hvordan du returnerer.

## 9. Forsinkelse og manglende levering
Leverer vi ikke varen eller leverer den for sent, og dette ikke skyldes kjøperen, kan kjøperen etter forbrukerkjøpsloven kreve oppfyllelse, heve avtalen og/eller kreve erstatning. Krav må fremmes skriftlig innen rimelig tid.

## 10. Mangel ved varen – reklamasjon
Hvis det foreligger en mangel ved varen, må kjøper innen rimelig tid etter at mangelen ble eller burde ha blitt oppdaget, gi oss melding om at kjøper vil påberope seg mangelen. Fristen er minst to måneder fra mangelen ble oppdaget. Reklamasjon kan fremmes senest **to år** etter at varen ble overtatt, eller **fem år** hvis varen er ment å vare vesentlig lenger. Se [Retur og reklamasjon](/retur-og-reklamasjon).

## 11. Kjøperens rettigheter ved mangel
Kjøper kan etter forbrukerkjøpsloven velge mellom å kreve mangelen rettet eller omlevering av tilsvarende ting, kreve prisavslag, heve avtalen når mangelen ikke er uvesentlig, og/eller kreve erstatning for tap som følge av mangelen.

## 12. Personopplysninger
Behandlingen av personopplysninger er beskrevet i [personvernerklæringen](/personvern).

## 13. Bedriftskunder
For kjøp mellom næringsdrivende gjelder kjøpsloven, og angrerettloven og forbrukerkjøpsloven gjelder ikke. Fakturakjøp krever godkjent handlekonto. Ved forsinket betaling beregnes forsinkelsesrente etter forsinkelsesrenteloven. Kredittramme og betalingsfrist fremgår av handlekontoen.

## 14. Konfliktløsning
Klager rettes til selger innen rimelig tid. Partene skal forsøke å løse tvister i minnelighet. Forbrukere kan kontakte **Forbrukertilsynet/Forbrukerrådet** for mekling, og ved behov bringe saken inn for **Forbrukerklageutvalget**. Forbrukere kan også bruke EU-kommisjonens klageportal for netthandel.`;

export const ANGRERETT = `Som forbruker har du **14 dagers angrerett** når du handler på nett hos oss, i henhold til angrerettloven.

## Angrefristen
Angrefristen er 14 dager fra dagen etter at du har mottatt varen. Ved bestilling av flere varer som leveres hver for seg, løper fristen fra dagen etter at den siste varen er mottatt.

## Slik bruker du angreretten
Du må gi oss en **utvetydig melding** innen fristen om at du vil gå fra avtalen. Du kan:

- registrere retur under **Min side → Mine bestillinger** (velg «Angrerett»), eller
- sende e-post til {{epost}}, eller
- bruke angreskjemaet nedenfor.

## Retur av varen
Varen må sendes tilbake uten unødig opphold og **senest 14 dager** etter at du ga melding om bruk av angreretten. Du dekker de direkte kostnadene ved å returnere varen, med mindre annet er avtalt.

Du kan undersøke varen på samme måte som i en butikk. Dersom varen er brukt eller håndtert mer enn nødvendig for å fastslå art, egenskaper og funksjon – for eksempel en åpnet og brukt malingstube – kan vi trekke fra et beløp som tilsvarer verdireduksjonen.

## Tilbakebetaling
Vi tilbakebetaler det du har betalt, inkludert de opprinnelige leveringskostnadene (standard levering), **senest 14 dager** etter at vi mottok melding om bruk av angreretten. Vi kan holde tilbake beløpet til vi har mottatt varen eller dokumentasjon på at den er sendt. Tilbakebetalingen skjer med samme betalingsmiddel som ved kjøpet.

## Angreskjema
> Til {{firmanavn}}, {{adresse}}, {{epost}}:
>
> Jeg/vi underretter herved om at jeg/vi ønsker å gå fra min/vår avtale om kjøp av følgende varer: ______
>
> Bestilt den: ______ · Mottatt den: ______ · Ordrenummer: ______
>
> Forbrukerens navn og adresse: ______
>
> Dato og underskrift (kun hvis skjemaet sendes på papir): ______

Angreretten gjelder ikke for kjøp mellom næringsdrivende.`;

export const RETUR = `## Retur ved angrerett
Se [Angrerett](/angrerett). Registrer returen under **Min side → Mine bestillinger**, så får du returinstruksjoner. Pakk varen forsvarlig og legg ved ordrenummeret.

## Reklamasjon (feil eller mangel)
Er varen skadet, feil eller har en mangel, har du reklamasjonsrett etter forbrukerkjøpsloven:

- Gi oss melding **innen rimelig tid** etter at du oppdaget mangelen (minst to måneder er alltid rettidig).
- Reklamasjonsfristen er **to år** fra du mottok varen, eller **fem år** for varer som er ment å vare vesentlig lenger.
- Legg gjerne ved bilder og en kort beskrivelse – det gjør behandlingen raskere.

Ved berettiget reklamasjon dekker vi returkostnaden, og du kan velge mellom retting, omlevering, prisavslag eller heving (når mangelen ikke er uvesentlig).

**Transportskade:** Kontroller pakken ved mottak. Er emballasjen synlig skadet, bør det meldes til transportøren og oss så snart som mulig.

## Kontakt
Registrer retur eller reklamasjon på Min side, eller kontakt oss på {{epost}}.`;

export const PERSONVERN = `Denne personvernerklæringen forklarer hvordan vi samler inn og bruker personopplysninger i nettbutikken.

## Behandlingsansvarlig
{{firmanavn}}, org.nr. {{orgnr}}, {{adresse}}, er behandlingsansvarlig. Kontakt oss på {{epost}} for spørsmål om personvern.

## Hvilke opplysninger vi behandler, og hvorfor
| Formål | Opplysninger | Rettslig grunnlag |
|---|---|---|
| Behandle bestillinger, levering, betaling og kundeservice | Navn, adresse, e-post, telefon, ordrehistorikk | Avtale (GDPR art. 6 nr. 1 b) |
| Kundekonto (Min side) | Innlogging, adresser, favoritter | Avtale (art. 6 nr. 1 b) |
| Regnskap og bokføring | Ordre, fakturaer og betalingsinformasjon | Rettslig forpliktelse (art. 6 nr. 1 c), bokføringsloven |
| Handlekonto for bedrifter | Kontaktperson, org.nr., kredittvurdering | Avtale / berettiget interesse (art. 6 nr. 1 b og f) |
| Nyhetsbrev og påminnelse om handlekurv | E-post, samtykketidspunkt | Samtykke (art. 6 nr. 1 a), markedsføringsloven § 15 |
| Statistikk (Google Analytics) | Bruksdata, informasjonskapsler | Samtykke (art. 6 nr. 1 a), ekomloven |
| Sikkerhet og misbruksforebygging | IP-adresse, logg over hendelser | Berettiget interesse (art. 6 nr. 1 f) |

Vi lagrer **ikke** kortnummer. Kortbetaling håndteres av Stripe.

## Databehandlere og mottakere
Vi bruker leverandører som behandler opplysninger på våre vegne, med databehandleravtale:

- **Supabase** (database og innlogging)
- **Vercel** (drift av nettsiden)
- **Stripe** (kortbetaling) og eventuelt **Vipps MobilePay**
- **Resend** (utsendelse av e-post)
- **Posten/Bring** eller **PostNord** (levering – navn, adresse og telefon)
- **Google** (Analytics – kun ved samtykke)

Enkelte leverandører kan behandle opplysninger utenfor EØS. Slik overføring skjer kun med gyldig overføringsgrunnlag, for eksempel EUs standardkontraktsbestemmelser eller EU–US Data Privacy Framework.

## Lagringstid
- Kundekonto: til du sletter kontoen.
- Ordre, kvitteringer og fakturaer: **5 år** etter regnskapsårets slutt (bokføringsloven § 13).
- Nyhetsbrev: til du melder deg av.
- Sikkerhetslogger: inntil 12 måneder.

Når du sletter kontoen, anonymiseres ordre som må oppbevares etter bokføringsloven.

## Dine rettigheter
Du har rett til **innsyn**, **retting**, **sletting**, **begrensning**, **dataportabilitet** og til å **protestere** mot behandling. Samtykke kan når som helst trekkes tilbake.

- Last ned dine data og slett kontoen under **Min side → Kontoinnstillinger**.
- Endre samtykke til informasjonskapsler via lenken «Endre samtykke» nederst på siden.
- Meld deg av nyhetsbrevet via lenken i hver e-post.

Du kan klage til **Datatilsynet** (datatilsynet.no) hvis du mener behandlingen er i strid med regelverket.`;

export const COOKIES = `Vi bruker informasjonskapsler (cookies) og tilsvarende lokal lagring. Nødvendige informasjonskapsler brukes for at nettbutikken skal fungere. Andre brukes **kun med ditt samtykke**, i tråd med ekomloven og GDPR.

## Nødvendige
| Navn | Formål | Varighet |
|---|---|---|
| kp_consent | Lagrer valgene dine for informasjonskapsler | 12 måneder |
| sb-…-auth-token | Holder deg innlogget (Supabase) | Økt / inntil utlogging |
| kp_order | Viser bekreftelsessiden for ordren du nettopp la inn | 24 timer |
| kp-cart-v1 (lokal lagring) | Husker handlekurven din | Til du tømmer den |

## Statistikk (krever samtykke)
| Navn | Formål | Varighet |
|---|---|---|
| _ga, _ga_* | Google Analytics 4 – anonymisert bruksstatistikk | Inntil 24 måneder |

## Markedsføring (krever samtykke)
Vi bruker per i dag ingen annonsekapsler. Samtykket brukes til å styre Google Consent Mode for annonsemåling dersom dette tas i bruk.

## Endre samtykke
Du kan når som helst endre eller trekke tilbake samtykket via lenken **«Endre samtykke»** nederst på siden. Du kan også slette informasjonskapsler i nettleseren.`;
