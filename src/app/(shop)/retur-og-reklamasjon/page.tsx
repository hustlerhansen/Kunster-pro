import type { Metadata } from "next";
import { LegalPage } from "@/components/shop/legal-page";
import { RETUR } from "@/lib/legal/texts";

export const metadata: Metadata = { title: "Retur og reklamasjon", description: "Slik returnerer du varer og reklamerer på feil eller mangler.", alternates: { canonical: "/retur-og-reklamasjon" } };
export const revalidate = 300;

export default function Page() {
  return <LegalPage title="Retur og reklamasjon" body={RETUR} />;
}
