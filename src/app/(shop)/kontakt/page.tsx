import type { Metadata } from "next";
import { Mail, Phone, Clock } from "lucide-react";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { ContactForm } from "@/components/forms/contact-form";
import { getSettings } from "@/lib/data/catalog";

export const metadata: Metadata = { title: "Kontakt oss – kundeservice", description: "Kontakt Kunstner Pro kundeservice om produkter, bestillinger, retur og handlekonto.", alternates: { canonical: "/kontakt" } };

export default async function ContactPage() {
  const s = await getSettings();
  const email = s.store.support_email ?? s.company.email;
  const phone = s.store.support_phone ?? s.company.phone;
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Kontakt oss" }]} />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h1 className="text-4xl font-semibold sm:text-5xl">Kontakt oss</h1>
          <p className="mt-4 text-lg text-muted-foreground">Norsk kundeservice – kunstnere hjelper kunstnere. Vi svarer på spørsmål om produkter, bestillinger, retur og handlekonto.</p>
          <ul className="mt-8 space-y-4 text-sm">
            <li className="flex gap-3">
              <Mail className="size-5" /> {email ? <a href={`mailto:${email}`} className="underline">{email}</a> : <span className="italic text-muted-foreground">E-postadresse ikke registrert ennå</span>}
            </li>
            <li className="flex gap-3">
              <Phone className="size-5" /> {phone ?? <span className="italic text-muted-foreground">Telefon ikke registrert ennå</span>}
            </li>
            <li className="flex gap-3">
              <Clock className="size-5" /> {s.store.support_hours ?? <span className="italic text-muted-foreground">Åpningstider ikke registrert ennå</span>}
            </li>
          </ul>
          <div className="mt-8 rounded-lg border bg-white p-5 text-sm">
            <p className="font-semibold">Firmaopplysninger</p>
            <p className="mt-2 text-muted-foreground">
              {s.company.legal_name ?? "Firmanavn ikke registrert ennå"}
              <br />
              Org.nr. {s.company.org_number ?? "ikke registrert ennå"}
              <br />
              {s.company.address ?? "Adresse ikke registrert ennå"}
            </p>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6 sm:p-8">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
