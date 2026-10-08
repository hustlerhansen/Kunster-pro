import { demoId } from "./ids";
import { demoProductId as pid } from "./catalog";
import type { Article } from "../types";

const published = "2026-10-01T08:00:00.000Z";

function article(a: Omit<Article, "id" | "status" | "published_at" | "author_name"> & { published_at?: string }): Article {
  return {
    id: demoId(`article:${a.slug}`),
    status: "published",
    author_name: "Kunstner Pro",
    ...a,
    published_at: a.published_at ?? published,
  };
}

export const DEMO_ARTICLES: Article[] = [
  article({
    slug: "hvordan-velge-riktig-oljemaling",
    title: "Hvordan velge riktig oljemaling",
    excerpt:
      "Studiokvalitet eller kunstnerkvalitet, tubestørrelse og fargevalg – slik velger du oljemaling som passer måten du maler på.",
    cover_image_url: "/images/demo/kategori-oljemaling.svg",
    reading_minutes: 6,
    related_product_ids: [pid("titanhvit"), pid("ultramarinbla"), pid("oljemalingssett-12")],
    related_category_slugs: ["oljemaling"],
    seo_title: "Hvordan velge riktig oljemaling – guide for kunstnere",
    seo_description:
      "Lær hvordan du velger oljemaling: kvalitetsnivåer, pigmentinformasjon, lysekthet, tubestørrelser og hvilke farger du bør starte med.",
    body: `Oljemaling finnes i mange kvaliteter og prisklasser. Riktig valg avhenger av hva du maler, hvor mye du maler – og hva du forventer av resultatet. Her er de viktigste punktene å se etter.

## 1. Kvalitetsnivå: studio eller kunstner?

De fleste produsenter deler sortimentet i to nivåer:

- **Studiokvalitet** (ofte kalt student- eller studiekvalitet) er rimeligere. Den kan inneholde mindre pigment eller erstatningspigmenter for de dyreste fargene. Godt egnet til øving, studier og større flater.
- **Kunstnerkvalitet** har normalt høyere pigmentinnhold og et bredere utvalg av enkeltpigmenter. Den gir ofte sterkere farger i blanding.

Mange profesjonelle kombinerer: rimelig hvitt i store tuber og kunstnerkvalitet i fargene der intensiteten betyr mest.

## 2. Les etiketten – og se etter dokumentasjon

Seriøse produsenter oppgir informasjon på tuben eller i et fargekart:

- **Pigmentkode** (Colour Index, for eksempel «PB29»). Den forteller hvilket pigment som faktisk brukes – uavhengig av fargenavnet.
- **Lysekthet** – hvor godt fargen tåler lys over tid. Oppgis ofte etter ASTM-skala eller produsentens egen skala.
- **Dekkevne** – om fargen er dekkende, halvdekkende eller transparent.

> Hos Kunstner Pro oppgir vi pigment, lysekthet og dekkevne **kun når produsenten har dokumentert det**. Mangler informasjonen, spør oss gjerne.

## 3. Velg riktig tubestørrelse

| Størrelse | Passer til |
|---|---|
| 12–37 ml | Farger du bruker lite av, eller vil prøve |
| 60 ml | Farger du bruker jevnlig |
| 200 ml | Hvitt og andre «arbeidsfarger» – lavest pris per ml |

**Tips:** Du bruker nesten alltid mest hvitt. Kjøp hvitt i en større tube enn de andre fargene.

## 4. En begrenset palett er et godt utgangspunkt

Du trenger ikke mange farger for å male godt. En klassisk begrenset palett kan være:

1. Titanhvit
2. Ultramarinblå
3. Gul oker
4. Brent sienna
5. En sort eller en mørk jordfarge

Med disse kan du blande et overraskende stort spekter av toner – og du lærer fargeblanding raskere.

## 5. Kjøp sett når du skal i gang

Et oljemalingssett gir deg mange farger til en lavere pris enn enkeltfarger. Når du finner ut hvilke farger du bruker mest, kan du supplere med større tuber.

## Oppsummering

- Velg kvalitetsnivå etter bruk – kombiner gjerne.
- Se etter dokumentert pigment, lysekthet og dekkevne.
- Kjøp hvitt i store tuber.
- Start med en begrenset palett.`,
  }),
  article({
    slug: "forskjellen-pa-oljemaling-og-akrylmaling",
    title: "Forskjellen på oljemaling og akrylmaling",
    excerpt:
      "Tørketid, blanding, rengjøring og holdbarhet – en oversikt over de viktigste forskjellene mellom olje og akryl.",
    cover_image_url: "/images/demo/olje-ultramarinbla.svg",
    reading_minutes: 5,
    related_product_ids: [pid("oljemalingssett-12"), pid("linolje"), pid("penselsape")],
    related_category_slugs: ["oljemaling", "malermedium"],
    seo_title: "Oljemaling vs akrylmaling – hva er forskjellen?",
    seo_description:
      "Hva er forskjellen på oljemaling og akrylmaling? Vi sammenligner tørketid, blanding, rengjøring, utstyr og hvilke underlag som passer.",
    body: `Oljemaling og akrylmaling kan se like ut på lerretet, men de oppfører seg svært forskjellig mens du maler. Her er de viktigste forskjellene.

## Bindemiddel

- **Oljemaling** består av pigment bundet i en tørkende olje, oftest linolje. Malingen tørker ved at oljen reagerer med oksygen i lufta (oksidasjon).
- **Akrylmaling** består av pigment i en vannbasert akrylemulsjon. Den tørker ved at vannet fordamper.

## Tørketid

Dette er den største praktiske forskjellen.

- **Akryl** tørker raskt – ofte i løpet av minutter. Bra for raske lag, men vanskeligere å blande vått-i-vått.
- **Olje** holder seg arbeidbar mye lenger, og et tynt lag trenger gjerne fra én dag til flere dager før det er berøringstørt. Tykke lag kan bruke vesentlig lenger tid.

Den lange åpentiden gjør det enklere å lage myke overganger og justere underveis.

## Fargeblanding og uttrykk

Oljemaling har en smøraktig konsistens og endrer seg lite i farge når den tørker. Akryl kan bli litt mørkere ved tørking. Mange opplever at olje gir dypere farger og mer glød – men det henger også sammen med kvalitet og teknikk.

## Lagoppbygging: «fett over magert»

I oljemaling bygger du opp lag etter prinsippet **fett over magert**: hvert nytt lag bør inneholde like mye eller mer olje enn laget under. Ellers kan det oppstå sprekker over tid. Akryl har ikke denne regelen.

> Du kan male olje oppå tørr akryl, men **ikke akryl oppå olje**.

## Rengjøring

- **Akryl**: vann og såpe – mens malingen fortsatt er våt.
- **Olje**: tørk av overflødig maling, rens eventuelt med et egnet rensemiddel, og vask deretter med penselsåpe og lunkent vann.

## Hva bør du velge?

| | Oljemaling | Akrylmaling |
|---|---|---|
| Tørketid | Lang | Kort |
| Blanding på lerret | Svært enkel | Krever tempo |
| Rengjøring | Krever litt mer | Vann og såpe |
| Lagregel | Fett over magert | Ingen |

Velger du olje, får du tid – og et klassisk uttrykk. Det er derfor oljemaling fortsatt er førstevalget for mange profesjonelle.`,
  }),
  article({
    slug: "hvordan-velge-pensler",
    title: "Hvordan velge pensler til oljemaling",
    excerpt: "Naturhår eller syntetisk, flat eller rund? Slik setter du sammen et penselutvalg som faktisk blir brukt.",
    cover_image_url: "/images/demo/kategori-pensler.svg",
    reading_minutes: 5,
    related_product_ids: [pid("penselsett-10"), pid("flat-bustpensel"), pid("filbert-syntetisk")],
    related_category_slugs: ["pensler"],
    seo_title: "Pensler til oljemaling – slik velger du riktig",
    seo_description:
      "Guide til pensler for oljemaling: forskjellen på bustpensler og syntetiske pensler, penselformer og hvilke størrelser du bør starte med.",
    body: `Penslene påvirker strøket like mye som malingen. Her er det du trenger å vite for å velge riktig.

## Hårtype

### Naturhår (bust)
Bustpensler av svinebust er stive og har naturlig splittede hårtupper som holder godt på malingen. De er klassikeren for oljemaling og egner seg godt til tykk maling og synlige penselstrøk.

### Syntetisk
Syntetiske pensler finnes fra myke til ganske stive. De gir jevne strøk og presise kanter, og er ofte enklere å rengjøre. Mange syntetiske pensler er laget for å tåle løsemidler og oljemaling.

## De viktigste penselformene

- **Flat** – rett kant og lange hår. Brede strøk, skarpe kanter og blokker av farge.
- **Rund** – spiss tupp. Linjer, detaljer og konturer.
- **Filbert (kattetunge)** – flat med avrundet tupp. Myke overganger og organiske former; mange portrettmalere bruker mest filbert.
- **Bright** – flat og kort. God kontroll med tykk maling.

## Størrelser

Størrelsesnummer varierer mellom produsenter, men som tommelfingerregel:

- **Små (0–4):** detaljer
- **Mellomstore (6–10):** det meste av arbeidet
- **Store (12+):** undermaling og store flater

**Tips:** Bruk den største penselen du kan så lenge som mulig. Det gir friere strøk og et mer helhetlig maleri.

## Langt eller kort skaft?

Pensler for oljemaling har ofte **langt skaft**, slik at du kan stå et stykke unna lerretet på staffeliet. Kort skaft gir mer kontroll på nært hold.

## Et godt startutvalg

1. Flat bust str. 8 og 12
2. Filbert str. 6 og 10
3. Rund syntetisk str. 2 og 4

Eller velg et **penselsett** som dekker de vanligste formene – og supplér etter hvert.`,
  }),
  article({
    slug: "hvordan-velge-lerret",
    title: "Hvordan velge lerret",
    excerpt: "Bomull eller lin, oppspent eller plate, grunnet eller ugrunnet – en praktisk guide til lerret for oljemaling.",
    cover_image_url: "/images/demo/kategori-lerret.svg",
    reading_minutes: 4,
    related_product_ids: [pid("oppspent-lerret-bomull"), pid("dypt-lerret-lin"), pid("lerretsplater")],
    related_category_slugs: ["lerret"],
    seo_title: "Lerret til maling – slik velger du riktig lerret",
    seo_description:
      "Guide til lerret for oljemaling: bomull vs lin, oppspent lerret vs lerretsplater, grunning, dybde og vanlige formater.",
    body: `Lerretet er grunnlaget for maleriet. Her er de viktigste valgene.

## Materiale: bomull eller lin?

- **Bomull** er rimelig, jevnt og lett å spenne. Gramvekten (g/m²) sier noe om hvor kraftig stoffet er – høyere gramvekt gir et mer robust lerret.
- **Lin** har lengre fibre, en mer levende struktur og regnes som et mer eksklusivt underlag. Det er dyrere enn bomull.

## Grunning

Oljemaling skal ikke males direkte på rå stoff, fordi oljen kan skade fibrene over tid. De fleste lerret selges derfor **ferdig grunnet**, ofte med en universalgrunning (akrylgesso) som passer for både olje og akryl. Sjekk alltid produktbeskrivelsen.

## Oppspent lerret, lerretsplate eller rull?

| Type | Fordeler | Passer til |
|---|---|---|
| Oppspent lerret | Klart til bruk, kan henges | Ferdige malerier |
| Lerretsplate | Rimelig, tar liten plass | Studier, skisser, friluft |
| Lerret på rull | Valgfritt format | Erfarne som spenner selv |

## Dybde på rammen

Standard blindrammer er rundt 1,5–2 cm dype. **Dype rammer** (ca. 4 cm) kan henges uten innramming og gir et mer eksklusivt uttrykk.

## Format

Velg format etter motiv – men tenk også på ramme. Standardformater som 30 × 40, 40 × 50 og 50 × 70 cm er enklere å finne ferdige rammer til.

**Tips:** Kjøper du lerret til kurs eller serier, lønner det seg å kjøpe flere i samme format.`,
  }),
  article({
    slug: "utstyr-for-nybegynnere",
    title: "Utstyr for nybegynnere i oljemaling",
    excerpt: "Hva trenger du egentlig for å begynne med oljemaling? En nøktern liste – uten unødvendige kjøp.",
    cover_image_url: "/images/demo/sett-start.svg",
    reading_minutes: 5,
    related_product_ids: [pid("startpakke-oljemaling"), pid("oljemalingssett-12"), pid("penselsett-10")],
    related_category_slugs: ["malersett", "oljemaling"],
    seo_title: "Oljemaling for nybegynnere – utstyrsliste",
    seo_description:
      "Kom i gang med oljemaling: hva du trenger av maling, pensler, lerret, medium og tilbehør – og hva du kan vente med.",
    body: `Det er lett å kjøpe for mye når man skal begynne med oljemaling. Her er det du faktisk trenger.

## Det du trenger

### 1. Maling
Start med en **begrenset palett**: hvitt, en blå, en gul jordfarge, en rødbrun jordfarge og eventuelt sort. Kjøp hvitt i en større tube.

### 2. Pensler
Tre til seks pensler i ulike former holder lenge: et par flate, et par filbert og en liten rund for detaljer. Et penselsett er en enkel start.

### 3. Underlag
Lerretsplater er rimelige og perfekte til øving. Kjøp gjerne et par oppspente lerret til arbeider du vil ta vare på.

### 4. Medium
**Linolje** gjør malingen mer flytende. Du klarer deg lenge med én flaske.

### 5. Palett og palettkniv
En glassplate, en tre-palett eller avrivningspalett fungerer fint. En palettkniv brukes til å blande farger.

### 6. Rengjøring
Tørkepapir eller filler, et glass til rensing og **penselsåpe** for å vaske penslene skikkelig etterpå.

## Det du kan vente med

- Mange spesialmedier
- Store mengder farger
- Dyre pensler i alle størrelser

## Sikkerhet og arbeidsmiljø

- Sørg for **god ventilasjon**.
- Tørkepapir og filler med olje kan i sjeldne tilfeller selvantenne når de ligger sammenkrøllet. Legg dem utbrettet til tørk eller i en lukket metallbeholder med vann før de kastes.
- Følg alltid produsentens sikkerhetsinformasjon.

## Startpakke

Vil du slippe å sette sammen alt selv? Vår **startpakke** inneholder grunnfarger, penselsett, lerret og linolje – og du ser nøyaktig hva du sparer sammenlignet med enkeltkjøp.`,
  }),
  article({
    slug: "vedlikehold-av-pensler",
    title: "Vedlikehold av pensler",
    excerpt: "Med riktig rengjøring og oppbevaring varer penslene mye lenger. Slik tar du vare på dem.",
    cover_image_url: "/images/demo/penselsape.svg",
    reading_minutes: 4,
    related_product_ids: [pid("penselsape"), pid("penselsett-10"), pid("flat-bustpensel")],
    related_category_slugs: ["pensler", "malermedium"],
    seo_title: "Rengjøring av pensler etter oljemaling",
    seo_description:
      "Slik rengjør og oppbevarer du pensler etter oljemaling, så de holder formen og varer lenger.",
    body: `Gode pensler er en investering. Med riktig vedlikehold holder de formen i årevis.

## Rengjøring etter oljemaling – steg for steg

1. **Tørk av** så mye maling som mulig med tørkepapir eller en fille.
2. **Rens** penselen i et egnet rensemiddel om du bruker det, og tørk av igjen.
3. **Vask** med penselsåpe og lunkent vann. Gni penselen forsiktig i håndflaten til skummet er rent.
4. **Skyll** godt.
5. **Form** hårene tilbake til riktig fasong med fingrene.
6. **Tørk** penselen liggende eller med hårene ned – aldri stående med hårene opp, da vann kan renne ned i hylsen og løsne limet.

## Unngå disse feilene

- La aldri penslene stå med hårene ned i et glass over tid – de blir bøyd.
- Ikke la maling tørke inn i hylsen (metalldelen).
- Unngå varmt vann, som kan skade limet i hylsen.

## Oppbevaring

Oppbevar rene og tørre pensler liggende eller stående med hårene opp i et beger. Bruk gjerne et penseletui når du tar dem med på tur.

## Når penselen er slitt

Slitte bustpensler er ikke ubrukelige – de er ofte perfekte til undermaling, teksturer og tørrpensel-teknikk.`,
  }),
];
