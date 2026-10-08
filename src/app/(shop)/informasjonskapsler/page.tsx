import type { Metadata } from "next";
import { LegalPage } from "@/components/shop/legal-page";
import { COOKIES } from "@/lib/legal/texts";

export const metadata: Metadata = { title: "Informasjonskapsler", description: "Oversikt over informasjonskapsler og samtykke.", alternates: { canonical: "/informasjonskapsler" } };
export const revalidate = 300;

export default function Page() {
  return <LegalPage title="Informasjonskapsler" body={COOKIES} />;
}
