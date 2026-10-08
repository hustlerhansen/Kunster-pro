import type { Metadata } from "next";
import Link from "next/link";
import { Check, FileText, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { CreditApplicationForm } from "@/components/forms/business-forms";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Handlekonto for bedrifter, skoler og atelierer",
  description: "Søk om handlekonto hos Kunstner Pro. For kunstskoler, atelierer, kursarrangører og bedrifter – fakturakjøp etter manuell godkjenning.",
  alternates: { canonical: "/handlekonto" },
};

export default async function CreditAccountPage() {
  const profile = await getCurrentProfile();
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Handlekonto" }]} />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h1 className="text-4xl font-semibold sm:text-5xl">Handlekonto</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            For profesjonelle kunstnere med enkeltpersonforetak, kunstskoler, kunstforeninger, atelierer, kursarrangører og kunstbutikker.
          </p>
          <ul className="mt-6 space-y-3">
            {["Handle på faktura etter godkjenning", "Avtalepriser og mengderabatter", "Samlet fakturaoversikt og betalingshistorikk", "Dedikert kundeservice og enkel gjenbestilling"].map((t) => (
              <li key={t} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold">
                  <Check className="size-4 text-ink" strokeWidth={3} />
                </span>
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-8 space-y-4 rounded-lg border bg-white p-5 text-sm">
            <p className="flex gap-3">
              <ShieldCheck className="size-5 shrink-0 text-gold-dark" />
              <span>
                <strong>Manuell vurdering.</strong> Alle søknader behandles manuelt. Vi kan innhente opplysninger fra Brønnøysundregistrene og kredittopplysningsbyrå før
                søknaden avgjøres. Kreditt gis aldri automatisk.
              </span>
            </p>
            <p className="flex gap-3">
              <FileText className="size-5 shrink-0 text-gold-dark" />
              <span>
                <strong>Kun for virksomheter.</strong> Handlekonto med faktura tilbys kun til registrerte virksomheter med organisasjonsnummer – ikke til privatpersoner.
              </span>
            </p>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6 sm:p-8">
          <h2 className="mb-5 text-2xl font-semibold">Søk om handlekonto</h2>
          {!isSupabaseConfigured() ? (
            <Alert variant="warning">Søknadsskjemaet aktiveres når databasen er koblet til.</Alert>
          ) : !profile ? (
            <div className="space-y-4">
              <p>Du må ha en brukerkonto for å søke. Søknaden knyttes til kontoen din, slik at du kan følge status på Min side.</p>
              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/logg-inn?neste=/handlekonto">Logg inn</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/registrer">Opprett konto</Link>
                </Button>
              </div>
            </div>
          ) : (
            <CreditApplicationForm defaults={{ email: profile.email ?? undefined, name: profile.full_name ?? undefined }} />
          )}
        </div>
      </div>
    </div>
  );
}
