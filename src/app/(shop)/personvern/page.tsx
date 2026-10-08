import type { Metadata } from "next";
import { LegalPage } from "@/components/shop/legal-page";
import { PERSONVERN } from "@/lib/legal/texts";

export const metadata: Metadata = { title: "Personvernerklæring", description: "Hvordan Kunstner Pro behandler personopplysninger.", alternates: { canonical: "/personvern" } };
export const revalidate = 300;

export default function Page() {
  return <LegalPage title="Personvernerklæring" body={PERSONVERN} />;
}
