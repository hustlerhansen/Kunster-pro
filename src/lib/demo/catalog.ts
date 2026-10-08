/**
 * DEMOSORTIMENT – Kunstner Pro
 *
 * Alle produkter, priser og lagertall her er FIKTIVE og merket is_demo = true.
 * Produktene tilhører butikkens eget demovaremerke «Kunstner Pro Studio» for å unngå
 * udokumenterte påstander om ekte merkevarer. Pigmentinformasjon, dekkevne og
 * lysekthet er bevisst IKKE fylt ut – dette skal kun registreres når det er
 * dokumentert av produsent/leverandør.
 *
 * Bildene er illustrasjoner (SVG-plassholdere) og skal erstattes med ekte produktfoto.
 */
import { demoId } from "./ids";
import type {
  Brand,
  Category,
  Product,
  ProductType,
  ShippingMethod,
  SpecValues,
  StoreSettings,
  Variant,
  VolumeDiscount,
} from "../types";

export const DEMO_BRAND: Brand = {
  id: demoId("brand:kunstner-pro-studio"),
  slug: "kunstner-pro-studio",
  name: "Kunstner Pro Studio",
  description: "Demovaremerke brukt i demosortimentet. Erstattes med ekte merkevarer før lansering.",
  website: null,
  is_house_brand: true,
};

export const DEMO_CATEGORIES: Category[] = [
  {
    id: demoId("cat:oljemaling"),
    slug: "oljemaling",
    name: "Oljemaling",
    tagline: "Enkeltfarger, sett og store tuber",
    description:
      "Oljemaling for kunstnere som stiller høye krav – enkeltfarger i flere tubestørrelser, komplette sett og store tuber for større formater.",
    long_description: `## Kjøpe oljemaling på nett

Hos Kunstner Pro finner du et kuratert utvalg oljemaling for både øvede og profesjonelle kunstnere. Vi fokuserer på et oversiktlig sortiment framfor hundrevis av tilfeldige produkter, slik at det er enkelt å finne riktig farge i riktig størrelse.

### Velg riktig tubestørrelse
- **12–37 ml** passer for farger du bruker lite av, og for å prøve nye kulører.
- **60 ml** er et godt valg for farger du bruker jevnlig.
- **200 ml** lønner seg for hvitt og andre farger du bruker mye av, og gir lavere pris per milliliter.

### Om fargeinformasjon
Pigmentinformasjon, dekkevne og lysekthet oppgis kun når produsenten har dokumentert det. Mangler opplysningen, kontakt oss gjerne – vi hjelper deg med å finne riktig produkt.`,
    image_url: "/images/demo/kategori-oljemaling.svg",
    seo_title: "Oljemaling – kjøp profesjonell oljemaling på nett",
    seo_description:
      "Kjøp oljemaling på nett hos Kunstner Pro. Enkeltfarger, oljemalingssett og store tuber til konkurransedyktige priser. Levering i hele Norge.",
    sort_order: 1,
  },
  {
    id: demoId("cat:pensler"),
    slug: "pensler",
    name: "Pensler",
    tagline: "Flate, runde og filbert – naturhår og syntetisk",
    description:
      "Pensler til oljemaling i de formene og størrelsene du faktisk bruker – fra stive bustpensler til myke syntetiske pensler for detaljer.",
    long_description: `## Pensler til oljemaling

Oljemaling er tyktflytende og krever pensler som tåler mye. **Bustpensler (naturhår)** holder formen og flytter mye maling, mens **syntetiske pensler** gir jevnere strøk og presise kanter.

### Vanlige penselformer
- **Flat** – brede strøk, skarpe kanter og blokker av farge.
- **Rund** – linjer, detaljer og konturer.
- **Filbert (kattetunge)** – myke overganger og organiske former.

Les mer i guiden vår om hvordan du velger pensler.`,
    image_url: "/images/demo/kategori-pensler.svg",
    seo_title: "Pensler til oljemaling – flate, runde og filbert",
    seo_description:
      "Pensler til oljemaling: penselsett, flate og runde pensler, naturhår og syntetisk. Kvalitetspensler til gode priser hos Kunstner Pro.",
    sort_order: 2,
  },
  {
    id: demoId("cat:lerret"),
    slug: "lerret",
    name: "Lerret",
    tagline: "Oppspente lerret, lerretsplater og pakker",
    description:
      "Oppspente lerret, lerretsplater og lerret i pakker i vanlige formater. Kjøp flere og spar – perfekt for kurs, skoler og atelierer.",
    long_description: `## Lerret til maling

Et godt lerret er grunnlaget for maleriet. Vi oppgir alltid **materiale, grunning, dybde og mål** slik at du vet nøyaktig hva du får.

### Oppspent lerret eller lerretsplate?
- **Oppspent lerret** på blindramme er standard for ferdige malerier.
- **Lerretsplater** er rimelige og plassbesparende – fine til studier og skisser.
- **Lerret i pakker** gir lavere pris per stk.`,
    image_url: "/images/demo/kategori-lerret.svg",
    seo_title: "Lerret til maling – oppspente lerret og lerretsplater",
    seo_description:
      "Lerret til maling: oppspente lerret, lerretsplater og lerret i pakker. Tydelige mål, materiale og grunning. Mengderabatt ved kjøp av flere.",
    sort_order: 3,
  },
  {
    id: demoId("cat:malermedium"),
    slug: "malermedium",
    name: "Malermedium & tilbehør",
    tagline: "Linolje, medium og penselrens",
    description:
      "Linolje, malermedium og rengjøring – det du trenger for å justere konsistens og tørketid, og ta vare på penslene dine.",
    long_description: `## Malermedium og tilbehør til oljemaling

Medium brukes for å endre konsistens, glans og tørketid i oljemaling. **Linolje** er det klassiske bindemiddelet i oljemaling og brukes ofte for å gjøre malingen mer flytende.

Husk prinsippet **«fett over magert»**: lagene oppå bør inneholde like mye eller mer olje enn lagene under, for å redusere risikoen for sprekkdannelser.`,
    image_url: "/images/demo/kategori-malermedium.svg",
    seo_title: "Malermedium og linolje til oljemaling",
    seo_description:
      "Linolje, malermedium og penselrens til oljemaling. Alt du trenger for å justere konsistens og ta vare på penslene.",
    sort_order: 4,
  },
  {
    id: demoId("cat:malersett"),
    slug: "malersett",
    name: "Malersett",
    tagline: "Start- og profesjonelle sett",
    description:
      "Ferdig sammensatte sett med oljemaling, pensler, lerret og medium. Du ser alltid hva du sparer sammenlignet med enkeltkjøp.",
    long_description: `## Malersett for oljemaling

Våre sett er satt sammen av produkter fra det faste sortimentet. Derfor kan vi vise nøyaktig **hva settet ville kostet ved enkeltkjøp** – og hvor mye du sparer.`,
    image_url: "/images/demo/kategori-malersett.svg",
    seo_title: "Malersett for oljemaling – startpakke og profesjonelle sett",
    seo_description:
      "Malersett for oljemaling: startpakke for nybegynnere, profesjonell malepakke og komplett kunstnersett. Se hva du sparer mot enkeltkjøp.",
    sort_order: 5,
  },
];

const catId = (slug: string) => DEMO_CATEGORIES.find((c) => c.slug === slug)!.id;

interface VariantSeed {
  key: string;
  name: string;
  options?: SpecValues;
  price: number; // kr inkl. MVA
  stock: number;
  min?: number;
  weight?: number;
  cost?: number; // demo innkjøpspris i EUR
}

interface ProductSeed {
  key: string;
  name: string;
  subtitle?: string;
  category: string;
  type: ProductType;
  short: string;
  description: string;
  usage?: string;
  specs?: SpecValues;
  featured?: boolean;
  color?: string;
  image: string;
  variants: VariantSeed[];
  bundle?: { product: string; variant: string; qty: number }[];
  related?: string[];
}

const P: ProductSeed[] = [
  // ------------------------------------------------------------------ OLJEMALING (6)
  {
    key: "oljemalingssett-12",
    name: "Oljemalingssett 12 farger",
    subtitle: "12 tuber à 21 ml",
    category: "oljemaling",
    type: "oil_paint",
    short: "Komplett palett med 12 farger – et godt utgangspunkt for både studier og ferdige arbeider.",
    description:
      "Et sett med 12 oljefarger i tuber à 21 ml, satt sammen for å gi en allsidig palett med varme og kalde grunnfarger, jordfarger, hvitt og sort.\n\nSettet leveres i en oppbevaringseske.",
    usage: "Maleri på lerret, lerretsplate og grunnet treplate.",
    specs: { volume: "12 × 21 ml", contents: "12 farger inkl. hvitt og sort" },
    featured: true,
    image: "/images/demo/oljemalingssett-12.svg",
    variants: [{ key: "std", name: "12 × 21 ml", price: 499, stock: 24, min: 6, weight: 420, cost: 14.5 }],
    related: ["titanhvit", "penselsett-10", "linolje"],
  },
  {
    key: "titanhvit",
    name: "Oljemaling Titanhvit",
    subtitle: "Studiokvalitet",
    category: "oljemaling",
    type: "oil_paint",
    color: "#F4F1EA",
    short: "Hvit oljemaling – fargen de fleste bruker mest av. Velg stor tube og spar per milliliter.",
    description:
      "Titanhvit er den mest brukte hvitfargen i oljemaling. Fordi hvitt brukes i nesten alle blandinger, lønner det seg å kjøpe større tuber.\n\nTilgjengelig i fire størrelser fra 12 ml til 200 ml.",
    usage: "Blanding, lysing av farger og dekkende partier.",
    specs: { color: "Titanhvit" },
    featured: true,
    image: "/images/demo/olje-titanhvit.svg",
    variants: [
      { key: "12", name: "12 ml", options: { volume_ml: 12 }, price: 49, stock: 40, min: 10, weight: 40, cost: 1.2 },
      { key: "37", name: "37 ml", options: { volume_ml: 37 }, price: 89, stock: 60, min: 15, weight: 90, cost: 2.4 },
      { key: "60", name: "60 ml", options: { volume_ml: 60 }, price: 129, stock: 35, min: 10, weight: 140, cost: 3.5 },
      { key: "200", name: "200 ml", options: { volume_ml: 200 }, price: 279, stock: 18, min: 6, weight: 420, cost: 7.9 },
    ],
    related: ["ultramarinbla", "gul-oker", "linolje"],
  },
  {
    key: "ultramarinbla",
    name: "Oljemaling Ultramarinblå",
    subtitle: "Studiokvalitet",
    category: "oljemaling",
    type: "oil_paint",
    color: "#1F3A93",
    short: "Dyp, varm blåfarge – en klassiker på paletten.",
    description:
      "Ultramarinblå er en dyp blåfarge som brukes til himmel, skygger og mørke blandinger.\n\nTilgjengelig i fire størrelser fra 12 ml til 200 ml.",
    usage: "Himmel, vann, skygger og mørke blandinger.",
    specs: { color: "Ultramarinblå" },
    featured: true,
    image: "/images/demo/olje-ultramarinbla.svg",
    variants: [
      { key: "12", name: "12 ml", options: { volume_ml: 12 }, price: 55, stock: 30, min: 8, weight: 40, cost: 1.5 },
      { key: "37", name: "37 ml", options: { volume_ml: 37 }, price: 99, stock: 42, min: 12, weight: 90, cost: 2.8 },
      { key: "60", name: "60 ml", options: { volume_ml: 60 }, price: 139, stock: 20, min: 8, weight: 140, cost: 3.9 },
      { key: "200", name: "200 ml", options: { volume_ml: 200 }, price: 299, stock: 9, min: 4, weight: 420, cost: 8.6 },
    ],
    related: ["titanhvit", "brent-sienna", "penselsett-10"],
  },
  {
    key: "gul-oker",
    name: "Oljemaling Gul oker",
    subtitle: "Studiokvalitet",
    category: "oljemaling",
    type: "oil_paint",
    color: "#C9962E",
    short: "Varm jordfarge for hudtoner, landskap og undermaling.",
    description:
      "Gul oker er en varm jordfarge som er mye brukt i landskap, portretter og til undermaling.\n\nTilgjengelig i tre størrelser.",
    usage: "Landskap, hudtoner og undermaling.",
    specs: { color: "Gul oker" },
    image: "/images/demo/olje-gul-oker.svg",
    variants: [
      { key: "37", name: "37 ml", options: { volume_ml: 37 }, price: 89, stock: 38, min: 10, weight: 90, cost: 2.3 },
      { key: "60", name: "60 ml", options: { volume_ml: 60 }, price: 125, stock: 16, min: 6, weight: 140, cost: 3.3 },
      { key: "200", name: "200 ml", options: { volume_ml: 200 }, price: 269, stock: 7, min: 3, weight: 420, cost: 7.4 },
    ],
    related: ["brent-sienna", "titanhvit"],
  },
  {
    key: "brent-sienna",
    name: "Oljemaling Brent sienna",
    subtitle: "Studiokvalitet",
    category: "oljemaling",
    type: "oil_paint",
    color: "#8A3B1E",
    short: "Rødbrun jordfarge – allsidig til skisser, skygger og varme toner.",
    description:
      "Brent sienna er en rødbrun jordfarge som mange bruker til skisser og undermaling, og i blanding med blått for nøytrale mørke toner.\n\nTilgjengelig i tre størrelser.",
    usage: "Undermaling, skygger og varme blandinger.",
    specs: { color: "Brent sienna" },
    image: "/images/demo/olje-brent-sienna.svg",
    variants: [
      { key: "37", name: "37 ml", options: { volume_ml: 37 }, price: 89, stock: 33, min: 10, weight: 90, cost: 2.3 },
      { key: "60", name: "60 ml", options: { volume_ml: 60 }, price: 125, stock: 14, min: 6, weight: 140, cost: 3.3 },
      { key: "200", name: "200 ml", options: { volume_ml: 200 }, price: 269, stock: 2, min: 3, weight: 420, cost: 7.4 },
    ],
    related: ["gul-oker", "ultramarinbla"],
  },
  {
    key: "lampesort",
    name: "Oljemaling Lampesort",
    subtitle: "Studiokvalitet",
    category: "oljemaling",
    type: "oil_paint",
    color: "#1B1B1B",
    short: "Dyp sortfarge for kontraster og mørke partier.",
    description: "Lampesort er en dyp sortfarge for kontraster, mørke partier og gråtoner i blanding med hvitt.",
    usage: "Kontraster, mørke partier og gråtoner.",
    specs: { color: "Lampesort" },
    image: "/images/demo/olje-lampesort.svg",
    variants: [
      { key: "37", name: "37 ml", options: { volume_ml: 37 }, price: 85, stock: 28, min: 8, weight: 90, cost: 2.1 },
      { key: "60", name: "60 ml", options: { volume_ml: 60 }, price: 119, stock: 0, min: 5, weight: 140, cost: 3.1 },
    ],
    related: ["titanhvit"],
  },

  // ------------------------------------------------------------------ PENSLER (4)
  {
    key: "penselsett-10",
    name: "Penselsett for oljemaling",
    subtitle: "10 pensler – flate, runde og filbert",
    category: "pensler",
    type: "brush",
    short: "Allsidig sett med de mest brukte formene og størrelsene for oljemaling.",
    description:
      "Et sett med 10 pensler i flate, runde og filbert-former i ulike størrelser. Syntetiske hår og lange skaft som passer til staffelimaling.\n\nLeveres i oppbevaringsetui.",
    usage: "Oljemaling – fra brede strøk til detaljer.",
    specs: { hair_type: "Syntetisk", shape: "Flat, rund og filbert", contents: "10 pensler", handle: "Langt skaft" },
    featured: true,
    image: "/images/demo/penselsett-10.svg",
    variants: [{ key: "std", name: "10 stk", price: 349, stock: 22, min: 6, weight: 180, cost: 9.8 }],
    related: ["flat-bustpensel", "rund-syntetisk", "penselsape"],
  },
  {
    key: "flat-bustpensel",
    name: "Flat bustpensel",
    subtitle: "Naturhår (svinebust)",
    category: "pensler",
    type: "brush",
    short: "Stiv naturhårpensel som flytter mye maling og holder formen.",
    description:
      "Flat pensel med stive naturhår (svinebust). Godt egnet til å legge store fargeflater og arbeide med tykk maling.",
    usage: "Store flater, impasto og blokker av farge.",
    specs: { hair_type: "Naturhår (svinebust)", shape: "Flat", handle: "Langt skaft" },
    image: "/images/demo/pensel-flat.svg",
    variants: [
      { key: "4", name: "Str. 4", options: { size: "4" }, price: 59, stock: 25, min: 6, weight: 15, cost: 1.4 },
      { key: "8", name: "Str. 8", options: { size: "8" }, price: 79, stock: 25, min: 6, weight: 18, cost: 1.9 },
      { key: "12", name: "Str. 12", options: { size: "12" }, price: 99, stock: 18, min: 5, weight: 22, cost: 2.5 },
      { key: "16", name: "Str. 16", options: { size: "16" }, price: 129, stock: 10, min: 4, weight: 26, cost: 3.2 },
    ],
    related: ["rund-syntetisk", "filbert-syntetisk", "penselsape"],
  },
  {
    key: "rund-syntetisk",
    name: "Rund pensel, syntetisk",
    subtitle: "Spiss for linjer og detaljer",
    category: "pensler",
    type: "brush",
    short: "Rund syntetisk pensel med god spiss – for linjer, konturer og detaljer.",
    description: "Rund pensel med syntetiske hår som holder spissen godt. Egnet for detaljer og linjer i oljemaling.",
    usage: "Linjer, konturer og detaljer.",
    specs: { hair_type: "Syntetisk", shape: "Rund", handle: "Langt skaft" },
    image: "/images/demo/pensel-rund.svg",
    variants: [
      { key: "2", name: "Str. 2", options: { size: "2" }, price: 49, stock: 30, min: 8, weight: 10, cost: 1.1 },
      { key: "4", name: "Str. 4", options: { size: "4" }, price: 55, stock: 30, min: 8, weight: 12, cost: 1.3 },
      { key: "6", name: "Str. 6", options: { size: "6" }, price: 65, stock: 22, min: 6, weight: 14, cost: 1.6 },
      { key: "10", name: "Str. 10", options: { size: "10" }, price: 85, stock: 12, min: 4, weight: 18, cost: 2.1 },
    ],
    related: ["flat-bustpensel", "filbert-syntetisk"],
  },
  {
    key: "filbert-syntetisk",
    name: "Filbert pensel, syntetisk",
    subtitle: "Kattetunge",
    category: "pensler",
    type: "brush",
    short: "Avrundet flat pensel for myke overganger og organiske former.",
    description: "Filbert (kattetunge) kombinerer egenskapene til flat og rund pensel. Fin til blanding av overganger og myke kanter.",
    usage: "Overganger, portrett og organiske former.",
    specs: { hair_type: "Syntetisk", shape: "Filbert", handle: "Langt skaft" },
    image: "/images/demo/pensel-filbert.svg",
    variants: [
      { key: "6", name: "Str. 6", options: { size: "6" }, price: 69, stock: 20, min: 6, weight: 14, cost: 1.7 },
      { key: "10", name: "Str. 10", options: { size: "10" }, price: 89, stock: 16, min: 5, weight: 18, cost: 2.2 },
      { key: "14", name: "Str. 14", options: { size: "14" }, price: 109, stock: 9, min: 4, weight: 22, cost: 2.8 },
    ],
    related: ["flat-bustpensel", "rund-syntetisk"],
  },

  // ------------------------------------------------------------------ LERRET (4)
  {
    key: "oppspent-lerret-bomull",
    name: "Oppspent lerret, bomull",
    subtitle: "380 g/m² · 1,8 cm dybde",
    category: "lerret",
    type: "canvas",
    short: "Oppspent bomullslerret på blindramme – klart til bruk.",
    description:
      "Bomullslerret spent på blindramme av tre. Grunnet fra fabrikk og klart til bruk med oljemaling.\n\nKjøp 5 eller flere oppspente lerret og få mengderabatt.",
    usage: "Oljemaling og akryl.",
    specs: { material: "Bomull, 380 g/m²", primer: "Grunnet (universalgrunning)", depth_cm: 1.8, pack_count: 1 },
    featured: true,
    image: "/images/demo/lerret-oppspent.svg",
    variants: [
      { key: "30x40", name: "30 × 40 cm", options: { width_cm: 30, height_cm: 40 }, price: 79, stock: 60, min: 15, weight: 450, cost: 2.1 },
      { key: "40x50", name: "40 × 50 cm", options: { width_cm: 40, height_cm: 50 }, price: 109, stock: 45, min: 10, weight: 650, cost: 2.9 },
      { key: "50x70", name: "50 × 70 cm", options: { width_cm: 50, height_cm: 70 }, price: 169, stock: 30, min: 8, weight: 950, cost: 4.4 },
      { key: "60x80", name: "60 × 80 cm", options: { width_cm: 60, height_cm: 80 }, price: 219, stock: 18, min: 6, weight: 1200, cost: 5.7 },
      { key: "80x100", name: "80 × 100 cm", options: { width_cm: 80, height_cm: 100 }, price: 349, stock: 8, min: 3, weight: 1900, cost: 9.2 },
    ],
    related: ["lerret-pakke-5", "lerretsplater", "titanhvit"],
  },
  {
    key: "lerret-pakke-5",
    name: "Lerret i pakke – 5 stk",
    subtitle: "Oppspent bomull 30 × 40 cm",
    category: "lerret",
    type: "canvas",
    short: "Fem oppspente lerret i samme format – lavere pris per lerret.",
    description: "Pakke med fem oppspente bomullslerret i formatet 30 × 40 cm. Perfekt for kurs, serier og studier.",
    usage: "Oljemaling og akryl, kurs og serier.",
    specs: { material: "Bomull, 380 g/m²", primer: "Grunnet (universalgrunning)", width_cm: 30, height_cm: 40, depth_cm: 1.8, pack_count: 5 },
    featured: true,
    image: "/images/demo/lerret-pakke.svg",
    variants: [{ key: "std", name: "5 × 30 × 40 cm", price: 329, stock: 20, min: 5, weight: 2300, cost: 9.4 }],
    related: ["oppspent-lerret-bomull", "lerretsplater"],
  },
  {
    key: "lerretsplater",
    name: "Lerretsplater",
    subtitle: "Pakke med 3 stk",
    category: "lerret",
    type: "canvas",
    short: "Lerret på stiv plate – rimelig og plassbesparende for studier og skisser.",
    description: "Lerretsplater med bomullslerret limt på stiv plate. Leveres i pakker med tre plater.",
    usage: "Studier, skisser og friluftsmaling.",
    specs: { material: "Bomullslerret på plate", primer: "Grunnet (universalgrunning)", pack_count: 3 },
    image: "/images/demo/lerretsplater.svg",
    variants: [
      { key: "24x30", name: "24 × 30 cm", options: { width_cm: 24, height_cm: 30, depth_cm: 0.3 }, price: 119, stock: 26, min: 6, weight: 600, cost: 3.1 },
      { key: "30x40", name: "30 × 40 cm", options: { width_cm: 30, height_cm: 40, depth_cm: 0.3 }, price: 159, stock: 19, min: 6, weight: 900, cost: 4.2 },
    ],
    related: ["oppspent-lerret-bomull", "lerret-pakke-5"],
  },
  {
    key: "dypt-lerret-lin",
    name: "Dypt lerret, lin",
    subtitle: "4 cm dyp ramme",
    category: "lerret",
    type: "canvas",
    short: "Linlerret på dyp blindramme – kan henges uten innramming.",
    description: "Linlerret spent på dyp blindramme (4 cm). Den dype rammen gir et eksklusivt uttrykk og kan henges uten ramme.",
    usage: "Ferdige arbeider og utstillinger.",
    specs: { material: "Lin", primer: "Grunnet (universalgrunning)", depth_cm: 4, pack_count: 1 },
    image: "/images/demo/lerret-lin.svg",
    variants: [
      { key: "40x40", name: "40 × 40 cm", options: { width_cm: 40, height_cm: 40 }, price: 249, stock: 12, min: 4, weight: 900, cost: 7.2 },
      { key: "50x60", name: "50 × 60 cm", options: { width_cm: 50, height_cm: 60 }, price: 339, stock: 8, min: 3, weight: 1300, cost: 9.8 },
      { key: "70x100", name: "70 × 100 cm", options: { width_cm: 70, height_cm: 100 }, price: 599, stock: 4, min: 2, weight: 2600, cost: 17.5 },
    ],
    related: ["oppspent-lerret-bomull"],
  },

  // ------------------------------------------------------------------ MALERMEDIUM (3)
  {
    key: "linolje",
    name: "Raffinert linolje",
    subtitle: "Medium for oljemaling",
    category: "malermedium",
    type: "medium",
    short: "Klassisk medium for å gjøre oljemaling mer flytende.",
    description:
      "Raffinert linolje brukes til å gjøre oljemaling mer flytende og gi økt glans. Bruk med måte – for mye olje kan gi rynker og gulning.\n\nHusk prinsippet «fett over magert».",
    usage: "Fortynning av oljemaling og glasering.",
    specs: { contents: "Raffinert linolje" },
    featured: true,
    image: "/images/demo/linolje.svg",
    variants: [
      { key: "75", name: "75 ml", options: { volume_ml: 75 }, price: 69, stock: 30, min: 8, weight: 110, cost: 1.6 },
      { key: "250", name: "250 ml", options: { volume_ml: 250 }, price: 129, stock: 24, min: 6, weight: 320, cost: 3.2 },
      { key: "500", name: "500 ml", options: { volume_ml: 500 }, price: 219, stock: 10, min: 4, weight: 600, cost: 5.6 },
    ],
    related: ["malermedium", "penselsape"],
  },
  {
    key: "malermedium",
    name: "Malermedium for oljemaling",
    subtitle: "Linoljebasert",
    category: "malermedium",
    type: "medium",
    short: "Allsidig medium for glasering og jevnere strøk.",
    description: "Linoljebasert malermedium som gjør malingen lettere å arbeide med og egner seg for glasering.",
    usage: "Glasering og jevnere strøk.",
    specs: { contents: "Linoljebasert medium" },
    image: "/images/demo/malermedium.svg",
    variants: [
      { key: "75", name: "75 ml", options: { volume_ml: 75 }, price: 99, stock: 22, min: 6, weight: 110, cost: 2.4 },
      { key: "250", name: "250 ml", options: { volume_ml: 250 }, price: 199, stock: 12, min: 4, weight: 320, cost: 5.1 },
    ],
    related: ["linolje"],
  },
  {
    key: "penselsape",
    name: "Penselsåpe",
    subtitle: "For rengjøring av pensler",
    category: "malermedium",
    type: "accessory",
    short: "Fast såpe for rengjøring og pleie av pensler etter oljemaling.",
    description:
      "Fast penselsåpe for rengjøring av pensler. Tørk av overflødig maling først, vask med såpe og lunkent vann, og la penselen tørke liggende eller med hårene ned.",
    usage: "Rengjøring av pensler etter maling.",
    specs: { contents: "Fast såpe" },
    image: "/images/demo/penselsape.svg",
    variants: [{ key: "100", name: "100 g", options: { weight_g: 100 }, price: 89, stock: 35, min: 8, weight: 130, cost: 2.0 }],
    related: ["penselsett-10", "flat-bustpensel"],
  },

  // ------------------------------------------------------------------ MALERSETT (3)
  {
    key: "startpakke-oljemaling",
    name: "Startpakke oljemaling",
    subtitle: "Alt du trenger for å komme i gang",
    category: "malersett",
    type: "set",
    short: "Fem grunnfarger, penselsett, to lerret og linolje – samlet til en lavere pris.",
    description:
      "En startpakke for deg som vil begynne med oljemaling. Settet er satt sammen av produkter fra vårt faste sortiment, slik at du kan se nøyaktig hva du sparer sammenlignet med enkeltkjøp.",
    usage: "Nybegynnere og kurs.",
    featured: true,
    image: "/images/demo/sett-start.svg",
    variants: [{ key: "std", name: "Startpakke", price: 799, stock: 10, min: 3, weight: 2100 }],
    bundle: [
      { product: "titanhvit", variant: "37", qty: 1 },
      { product: "ultramarinbla", variant: "37", qty: 1 },
      { product: "gul-oker", variant: "37", qty: 1 },
      { product: "brent-sienna", variant: "37", qty: 1 },
      { product: "lampesort", variant: "37", qty: 1 },
      { product: "penselsett-10", variant: "std", qty: 1 },
      { product: "oppspent-lerret-bomull", variant: "30x40", qty: 2 },
      { product: "linolje", variant: "75", qty: 1 },
    ],
    related: ["profesjonell-malepakke", "komplett-kunstnersett"],
  },
  {
    key: "profesjonell-malepakke",
    name: "Profesjonell malepakke",
    subtitle: "Store tuber og bustpensler",
    category: "malersett",
    type: "set",
    short: "For deg som maler mye: store tuber i nøkkelfarger, bustpensler og medium.",
    description:
      "Malepakke med 200 ml-tuber i de mest brukte fargene, flate bustpensler i tre størrelser og malermedium. Satt sammen av produkter fra det faste sortimentet.",
    usage: "Øvede og profesjonelle kunstnere.",
    image: "/images/demo/sett-profesjonell.svg",
    variants: [{ key: "std", name: "Profesjonell pakke", price: 1390, stock: 6, min: 2, weight: 2400 }],
    bundle: [
      { product: "titanhvit", variant: "200", qty: 1 },
      { product: "ultramarinbla", variant: "200", qty: 1 },
      { product: "gul-oker", variant: "200", qty: 1 },
      { product: "brent-sienna", variant: "200", qty: 1 },
      { product: "flat-bustpensel", variant: "8", qty: 1 },
      { product: "flat-bustpensel", variant: "12", qty: 1 },
      { product: "flat-bustpensel", variant: "16", qty: 1 },
      { product: "malermedium", variant: "250", qty: 1 },
    ],
    related: ["startpakke-oljemaling", "komplett-kunstnersett"],
  },
  {
    key: "komplett-kunstnersett",
    name: "Komplett kunstnersett",
    subtitle: "Sett, pensler, lerret og medium",
    category: "malersett",
    type: "set",
    short: "Oljemalingssett med 12 farger, penselsett, lerret i pakke, linolje og penselsåpe.",
    description:
      "Et komplett sett for deg som vil ha alt på plass: 12 farger, 10 pensler, fem oppspente lerret, linolje og penselsåpe. Satt sammen av produkter fra vårt faste sortiment.",
    usage: "Hobbykunstnere, kurs og gave.",
    featured: true,
    image: "/images/demo/sett-komplett.svg",
    variants: [{ key: "std", name: "Komplett sett", price: 1190, stock: 8, min: 2, weight: 3200 }],
    bundle: [
      { product: "oljemalingssett-12", variant: "std", qty: 1 },
      { product: "penselsett-10", variant: "std", qty: 1 },
      { product: "lerret-pakke-5", variant: "std", qty: 1 },
      { product: "linolje", variant: "250", qty: 1 },
      { product: "penselsape", variant: "100", qty: 1 },
    ],
    related: ["startpakke-oljemaling", "profesjonell-malepakke"],
  },
];

const productId = (key: string) => demoId(`product:${key}`);
const variantId = (pkey: string, vkey: string) => demoId(`variant:${pkey}:${vkey}`);
const skuPrefix: Record<ProductType, string> = {
  oil_paint: "OLJ",
  brush: "PEN",
  canvas: "LER",
  medium: "MED",
  set: "SET",
  accessory: "TIL",
};

function buildProduct(seed: ProductSeed, index: number): Product {
  const id = productId(seed.key);
  const category = DEMO_CATEGORIES.find((c) => c.slug === seed.category)!;
  const variants: Variant[] = seed.variants.map((v, i) => ({
    id: variantId(seed.key, v.key),
    product_id: id,
    sku: `KP-${skuPrefix[seed.type]}-${seed.key.toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 10)}-${v.key.toUpperCase().replace(/[^A-Z0-9]+/g, "")}`,
    name: v.name,
    options: v.options ?? {},
    price_ore: v.price * 100,
    vat_rate: 25,
    weight_g: v.weight ?? null,
    color_hex: seed.color ?? null,
    stock_on_hand: v.stock,
    stock_reserved: 0,
    stock_available: v.stock,
    min_stock: v.min ?? 0,
    is_active: true,
    sort_order: i,
    reference_price_ore: null,
  }));
  return {
    id,
    slug: seed.key,
    name: seed.name,
    subtitle: seed.subtitle ?? null,
    short_description: seed.short,
    description: seed.description,
    category_id: category.id,
    category: { id: category.id, slug: category.slug, name: category.name },
    brand_id: DEMO_BRAND.id,
    brand: { id: DEMO_BRAND.id, slug: DEMO_BRAND.slug, name: DEMO_BRAND.name, is_house_brand: true },
    product_type: seed.type,
    specs: seed.specs ?? {},
    usage: seed.usage ?? null,
    status: "active",
    is_demo: true,
    featured: seed.featured ?? false,
    sort_order: index,
    delivery_note: null,
    related_product_ids: (seed.related ?? []).map(productId),
    seo_title: null,
    seo_description: null,
    images: [{ url: seed.image, alt: `${seed.name} – illustrasjon`, is_placeholder: true, sort_order: 0 }],
    variants,
    bundle_items: seed.bundle?.map((b) => ({ variant_id: variantId(b.product, b.variant), quantity: b.qty })),
  };
}

export const DEMO_PRODUCTS: Product[] = P.map(buildProduct);

/** Demo-innkjøpskost (EUR) per variant – brukes kun i admin/seed og er merket DEMO. */
export const DEMO_VARIANT_COSTS: { variant_id: string; purchase_price_eur: number }[] = P.flatMap((p) =>
  p.variants
    .filter((v) => typeof v.cost === "number")
    .map((v) => ({ variant_id: variantId(p.key, v.key), purchase_price_eur: v.cost! })),
);

export const DEMO_SUPPLIER = {
  id: demoId("supplier:demo-eu"),
  name: "Demo-leverandør Europa (DEMO)",
  country: "DE",
  region: "EU" as const,
  currency: "EUR",
  lead_time_days: 14,
};

export const DEMO_EXCHANGE_RATE_EUR = 11.5;

export const DEMO_SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: demoId("ship:pickup"),
    code: "bring-pickup",
    name: "Hentested",
    description: "Hent pakken på et hentested i nærheten. Du får varsel når pakken er klar.",
    carrier: "bring",
    type: "pickup",
    price_ore: 7900,
    free_threshold_ore: 99900,
    delivery_estimate: null,
    max_weight_g: 20000,
    requires_business: false,
    is_active: true,
    sort_order: 1,
  },
  {
    id: demoId("ship:home"),
    code: "bring-home",
    name: "Hjemlevering",
    description: "Levering på døren eller til ønsket adresse.",
    carrier: "bring",
    type: "home",
    price_ore: 12900,
    free_threshold_ore: 99900,
    delivery_estimate: null,
    max_weight_g: 35000,
    requires_business: false,
    is_active: true,
    sort_order: 2,
  },
  {
    id: demoId("ship:business"),
    code: "bring-business",
    name: "Bedriftslevering",
    description: "Levering til bedriftsadresse på hverdager i arbeidstid.",
    carrier: "bring",
    type: "business",
    price_ore: 9900,
    free_threshold_ore: 99900,
    delivery_estimate: null,
    max_weight_g: 35000,
    requires_business: true,
    is_active: true,
    sort_order: 3,
  },
];

export const DEMO_VOLUME_DISCOUNTS: VolumeDiscount[] = [
  {
    id: demoId("vd:lerret-5"),
    name: "Kjøp 5 lerret – spar 10 %",
    description: "Gjelder oppspente lerret i alle størrelser. Rabatten beregnes automatisk i handlekurven.",
    product_id: productId("oppspent-lerret-bomull"),
    category_id: null,
    min_quantity: 5,
    percent_off: 10,
    starts_at: null,
    ends_at: null,
    is_active: true,
  },
];

export const DEFAULT_SETTINGS: StoreSettings = {
  store: {
    name: "Kunstner Pro",
    tagline: "Oljemaling & Kunstmateriell",
    main_message: "Spar penger uten å gå på kompromiss med kvaliteten.",
    support_email: null,
    support_phone: null,
    support_hours: null,
  },
  delivery: {
    // Ingen konkret leveringstid vises før logistikken er dokumentert og aktivert i admin.
    show_delivery_time: false,
    delivery_time_text: null,
    dispatch_text: null,
    free_shipping_threshold_ore: 99900,
  },
  banner: {
    items: [
      { icon: "truck", text: "Rask levering i hele Norge", href: "/frakt-og-levering" },
      { icon: "gift", text: "Fri frakt over 999 kr", href: "/frakt-og-levering" },
      { icon: "star", text: "Profesjonell kvalitet", href: null },
      { icon: "card", text: "Handlekonto for bedrifter", href: "/handlekonto" },
      { icon: "headset", text: "Norsk kundeservice", href: "/kontakt" },
    ],
  },
  payments: { card_enabled: true, vipps_enabled: false, invoice_enabled: false },
  company: {
    legal_name: null,
    org_number: null,
    vat_registered: true,
    address: null,
    email: null,
    phone: null,
  },
  hero: { image_url: null, image_alt: null },
};

export function demoBundleValueOre(product: Product, all: Product[] = DEMO_PRODUCTS): number | null {
  if (!product.bundle_items?.length) return null;
  const variants = new Map(all.flatMap((p) => p.variants).map((v) => [v.id, v]));
  let sum = 0;
  for (const item of product.bundle_items) {
    const v = variants.get(item.variant_id);
    if (!v) return null;
    sum += v.price_ore * item.quantity;
  }
  return sum;
}

export { catId as demoCategoryId, productId as demoProductId, variantId as demoVariantId };
