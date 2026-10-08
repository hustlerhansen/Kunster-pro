import { AlertTriangle } from "lucide-react";
import { Breadcrumbs } from "./breadcrumbs";
import { Markdown } from "./markdown";
import { getSettings } from "@/lib/data/catalog";
import type { StoreSettings } from "@/lib/types";

export const LEGAL_UPDATED = "8. oktober 2026";

/** Setter inn ekte firmaopplysninger fra innstillinger, eller tydelig markering når de mangler. */
export function fillCompany(md: string, s: StoreSettings): string {
  const miss = (label: string) => `**[${label} ikke registrert ennå]**`;
  const c = s.company;
  return md
    .replaceAll("{{firmanavn}}", c.legal_name ?? miss("Firmanavn"))
    .replaceAll("{{orgnr}}", c.org_number ? `${c.org_number}${c.vat_registered ? " MVA" : ""}` : miss("Organisasjonsnummer"))
    .replaceAll("{{adresse}}", c.address ?? miss("Adresse"))
    .replaceAll("{{epost}}", c.email ?? s.store.support_email ?? miss("E-postadresse"))
    .replaceAll("{{telefon}}", c.phone ?? s.store.support_phone ?? miss("Telefonnummer"));
}

export async function LegalPage({ title, body }: { title: string; body: string }) {
  const s = await getSettings();
  const incomplete = !s.company.legal_name || !s.company.org_number || !s.company.address;
  return (
    <div className="container-page max-w-3xl py-8">
      <Breadcrumbs items={[{ label: title }]} />
      <h1 className="mt-6 text-4xl font-semibold sm:text-5xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sist oppdatert {LEGAL_UPDATED}</p>
      {incomplete && (
        <div className="mt-6 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="size-5 shrink-0" />
          <p>
            <strong>Utkast:</strong> Firmaopplysninger er ikke registrert ennå. Teksten er en mal basert på norsk forbrukerlovgivning og må kvalitetssikres før lansering.
          </p>
        </div>
      )}
      <div className="mt-8">
        <Markdown>{fillCompany(body, s)}</Markdown>
      </div>
    </div>
  );
}
