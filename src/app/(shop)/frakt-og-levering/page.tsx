import type { Metadata } from "next";
import { LegalPage } from "@/components/shop/legal-page";
import { getSettings, getShippingMethods } from "@/lib/data/catalog";
import { formatPrice } from "@/lib/money";

export const metadata: Metadata = { title: "Frakt og levering", description: "Fraktpriser, leveringsalternativer og fri frakt hos Kunstner Pro.", alternates: { canonical: "/frakt-og-levering" } };
export const revalidate = 300;

export default async function Page() {
  const [methods, settings] = await Promise.all([getShippingMethods(), getSettings()]);
  const table = methods
    .map((m) => `| ${m.name}${m.requires_business ? " (bedrift)" : ""} | ${m.description ?? ""} | ${formatPrice(m.price_ore)} | ${m.free_threshold_ore ? `Over ${formatPrice(m.free_threshold_ore)}` : "–"} | ${m.delivery_estimate ?? "Oppgis av transportør"} |`)
    .join("\n");
  const delivery = settings.delivery.show_delivery_time && settings.delivery.delivery_time_text
    ? `Normal leveringstid er **${settings.delivery.delivery_time_text}**.${settings.delivery.dispatch_text ? ` ${settings.delivery.dispatch_text}.` : ""}`
    : "Leveringstiden avhenger av fraktmetode og adresse. Vi oppgir ikke faste leveringstider før de er bekreftet av transportør.";
  const body = `Vi leverer i hele Norge – hjem på døren, til ønsket adresse, til hentested eller til bedrift.

## Fraktalternativer og priser
| Fraktmetode | Beskrivelse | Pris | Fri frakt | Leveringstid |
|---|---|---|---|---|
${table}

Alle priser er inkl. MVA. Endelig fraktpris vises i kassen før du betaler.

## Leveringstid
${delivery} Uten avtalt leveringstid skal levering skje uten unødig opphold, og senest innen 30 dager.

## Ordrebekreftelse og sporing
Du får ordrebekreftelse på e-post når betalingen er bekreftet, og en ny e-post med sporingsnummer når pakken sendes. Du kan også følge bestillingen under **Min side → Mine bestillinger**.

## Hentested
Pakker som ikke hentes innen fristen returneres til oss. Ved uavhentede pakker kan vi kreve dekket faktiske frakt- og returkostnader.

## Forsinkelse
Er pakken forsinket, ta kontakt med oss på {{epost}}. Dine rettigheter ved forsinkelse følger av forbrukerkjøpsloven – se [kjøpsvilkårene](/kjopsvilkar).`;
  return <LegalPage title="Frakt og levering" body={body} />;
}
