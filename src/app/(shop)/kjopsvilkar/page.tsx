import type { Metadata } from "next";
import { LegalPage } from "@/components/shop/legal-page";
import { KJOPSVILKAR } from "@/lib/legal/texts";

export const metadata: Metadata = { title: "Kjøpsvilkår", description: "Kjøpsvilkår for Kunstner Pro.", alternates: { canonical: "/kjopsvilkar" } };
export const revalidate = 300;

export default function Page() {
  return <LegalPage title="Kjøpsvilkår" body={KJOPSVILKAR} />;
}
