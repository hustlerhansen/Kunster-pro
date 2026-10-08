import type { Metadata } from "next";
import { LegalPage } from "@/components/shop/legal-page";
import { ANGRERETT } from "@/lib/legal/texts";

export const metadata: Metadata = { title: "Angrerett", description: "14 dagers angrerett ved kjøp på nett – slik bruker du den.", alternates: { canonical: "/angrerett" } };
export const revalidate = 300;

export default function Page() {
  return <LegalPage title="Angrerett" body={ANGRERETT} />;
}
