import Link from "next/link";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter-form";
import { CookieSettingsLink } from "./consent/cookie-banner";
import { getSettings } from "@/lib/data/catalog";
import { LEGAL_NAV, MAIN_NAV } from "@/lib/site";

export async function SiteFooter() {
  const settings = await getSettings();
  const c = settings.company;
  const missing = <span className="text-gold/80 italic">ikke registrert ennå</span>;
  return (
    <footer className="mt-20 bg-ink text-white">
      <div className="border-b border-white/10">
        <div className="container-page grid gap-8 py-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">Faglige tips og nyheter fra atelieret</h2>
            <p className="mt-2 max-w-lg text-sm text-white/70">
              Meld deg på nyhetsbrevet for guider, nye produkter og kampanjer. Du kan melde deg av når som helst.
            </p>
          </div>
          <NewsletterForm source="footer" />
        </div>
      </div>
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo inverted />
          <p className="mt-5 max-w-sm text-sm text-white/70">{settings.store.main_message}</p>
          <dl className="mt-6 space-y-1 text-sm text-white/70">
            <div>
              <dt className="inline">Firmanavn: </dt>
              <dd className="inline">{c.legal_name ?? missing}</dd>
            </div>
            <div>
              <dt className="inline">Org.nr.: </dt>
              <dd className="inline">{c.org_number ? `${c.org_number}${c.vat_registered ? " MVA" : ""}` : missing}</dd>
            </div>
            <div>
              <dt className="inline">Adresse: </dt>
              <dd className="inline">{c.address ?? missing}</dd>
            </div>
            <div>
              <dt className="inline">E-post: </dt>
              <dd className="inline">{c.email ? <a href={`mailto:${c.email}`} className="hover:text-gold">{c.email}</a> : missing}</dd>
            </div>
          </dl>
        </div>
        <FooterCol title="Sortiment" links={MAIN_NAV.slice(0, 7)} />
        <FooterCol
          title="Kundeservice"
          links={[
            { label: "Kontakt oss", href: "/kontakt" },
            { label: "Min konto", href: "/konto" },
            { label: "Handlekonto", href: "/handlekonto" },
            { label: "For bedrifter", href: "/bedrift" },
            { label: "Kunstnerguide", href: "/kunstnerguide" },
            { label: "Om Kunstner Pro", href: "/om-oss" },
          ]}
        />
        <div>
          <FooterCol title="Vilkår og personvern" links={LEGAL_NAV} />
          <CookieSettingsLink className="mt-2 text-sm text-white/70 hover:text-gold" />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Kunstner Pro. Alle priser er oppgitt i norske kroner inkl. 25 % MVA.</p>
          <p className="flex flex-wrap gap-2">
            {settings.payments.card_enabled && <PayBadge>Kort</PayBadge>}
            {settings.payments.vipps_enabled && <PayBadge>Vipps</PayBadge>}
            {settings.payments.invoice_enabled && <PayBadge>Faktura (bedrift)</PayBadge>}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="mb-4 font-sans text-sm font-semibold tracking-wider text-gold uppercase">{title}</h3>
      <ul className="space-y-2 text-sm text-white/75">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-gold">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PayBadge({ children }: { children: React.ReactNode }) {
  return <span className="rounded border border-white/20 px-2 py-1 text-white/70">{children}</span>;
}
