import type { Metadata } from "next";
import Link from "next/link";
import { Building2, GraduationCap, Brush, Palette, Store, Users } from "lucide-react";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { BusinessRegisterForm } from "@/components/forms/business-forms";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getCurrentCompany, getCurrentProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Kunstmateriell for bedrifter, kunstskoler og atelierer",
  description: "Bedriftskunde hos Kunstner Pro: bedriftskonto, fakturabetaling etter godkjenning, større bestillinger, mengderabatter og dedikert kundeservice.",
  alternates: { canonical: "/bedrift" },
};

const GROUPS = [
  { icon: Palette, title: "Profesjonelle kunstnere" },
  { icon: GraduationCap, title: "Kunstskoler" },
  { icon: Users, title: "Kunstforeninger" },
  { icon: Brush, title: "Atelierer" },
  { icon: Building2, title: "Kursarrangører" },
  { icon: Store, title: "Kunstbutikker" },
];

export default async function BusinessPage() {
  const [profile, company] = await Promise.all([getCurrentProfile(), getCurrentCompany()]);
  return (
    <div>
      <section className="bg-ink py-16 text-white">
        <div className="container-page">
          <Breadcrumbs items={[{ label: "For bedrifter" }]} />
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold text-white sm:text-5xl">Kunstmateriell for virksomheter</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            Bedriftskonto, fakturabetaling etter godkjenning, større bestillinger, mengderabatter, dedikert kundeservice og enkel gjenbestilling.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {GROUPS.map(({ icon: Icon, title }) => (
              <div key={title} className="rounded-lg border border-white/15 bg-white/5 p-4 text-center">
                <Icon className="mx-auto size-7 text-gold" strokeWidth={1.5} />
                <p className="mt-2 text-sm">{title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="container-page grid gap-10 py-12 lg:grid-cols-2">
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold">Slik fungerer det</h2>
          <ol className="space-y-4">
            {[
              ["Opprett brukerkonto", "Personlig innlogging for den som handler."],
              ["Registrer bedriften", "Organisasjonsnummer, faktura- og leveringsadresse. Du får tilgang til bedriftslevering."],
              ["Søk om handlekonto (valgfritt)", "For fakturakjøp. Søknaden vurderes manuelt."],
              ["Avtalepriser", "Vi kan tilby prisavtaler og mengderabatter for større og faste kjøp."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold font-semibold">{i + 1}</span>
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="text-sm text-muted-foreground">{d}</p>
                </div>
              </li>
            ))}
          </ol>
          <Button asChild variant="gold" size="lg">
            <Link href="/handlekonto">Søk om handlekonto</Link>
          </Button>
        </div>
        <div className="rounded-lg border bg-white p-6 sm:p-8">
          <h2 className="mb-5 text-2xl font-semibold">Registrer bedriftskonto</h2>
          {!isSupabaseConfigured() ? (
            <Alert variant="warning">Registrering aktiveres når databasen er koblet til.</Alert>
          ) : company ? (
            <Alert variant="success">
              Du er registrert som bedriftskunde for <strong>{company.name}</strong> (org.nr. {company.org_number}). <Link href="/konto/handlekonto" className="underline">Se handlekonto</Link>.
            </Alert>
          ) : !profile ? (
            <div className="space-y-4">
              <p>Logg inn eller opprett en brukerkonto først.</p>
              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/logg-inn?neste=/bedrift">Logg inn</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/registrer">Opprett konto</Link>
                </Button>
              </div>
            </div>
          ) : (
            <BusinessRegisterForm defaults={{ email: profile.email ?? undefined, name: profile.full_name ?? undefined }} />
          )}
        </div>
      </div>
    </div>
  );
}
