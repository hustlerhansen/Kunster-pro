import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { Markdown } from "@/components/shop/markdown";

export const metadata: Metadata = { title: "Om Kunstner Pro", description: "Kunstner Pro er en spesialisert nettbutikk for oljemaling og kunstmateriell.", alternates: { canonical: "/om-oss" } };

export default function AboutPage() {
  return (
    <div className="container-page max-w-3xl py-8">
      <Breadcrumbs items={[{ label: "Om oss" }]} />
      <h1 className="mt-6 text-4xl font-semibold sm:text-5xl">Om Kunstner Pro</h1>
      <p className="mt-4 font-serif text-2xl text-gold-dark">Spar penger uten å gå på kompromiss med kvaliteten.</p>
      <div className="mt-8">
        <Markdown>{`Kunstner Pro er en spesialisert nettbutikk for **oljemaling, pensler, lerret og malermedium**. Vi har valgt et oversiktlig og kuratert sortiment framfor hundrevis av tilfeldige produkter – slik at du raskt finner det du trenger, med tydelige spesifikasjoner.

## Slik jobber vi

- **Kuratert sortiment** – vi velger produkter med god kvalitet og fornuftig pris.
- **Ærlige opplysninger** – vi oppgir bare egenskaper som er dokumentert av produsenten.
- **Ærlige priser** – rabatter og førpriser følger norske prisregler, og malersett viser nøyaktig hva du sparer.
- **Norsk kundeservice** – vi svarer på spørsmål om produkter, bestillinger og retur.

## For virksomheter

Kunstskoler, atelierer, kursarrangører og bedrifter kan registrere bedriftskonto og søke om handlekonto. [Les mer om bedriftskunder](/bedrift).`}</Markdown>
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        Spørsmål? <Link href="/kontakt" className="underline">Kontakt oss</Link>.
      </p>
    </div>
  );
}
