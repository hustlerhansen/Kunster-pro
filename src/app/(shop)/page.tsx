import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, CreditCard, Headset, House, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/shop/product-card";
import { ProductImage } from "@/components/shop/product-image";
import { JsonLd } from "@/components/shop/json-ld";
import { getArticles, getBundleValue, getCategories, getProducts, getSettings } from "@/lib/data/catalog";
import { SITE } from "@/lib/site";
import { absoluteUrl } from "@/lib/utils";

export const revalidate = 300;

export default async function HomePage() {
  const [settings, categories, featured, articles] = await Promise.all([
    getSettings(),
    getCategories(),
    getProducts({ featured: true, sort: "popular", limit: 10 }),
    getArticles(),
  ]);
  const savings: Record<string, number | null> = {};
  for (const p of featured) {
    if (p.product_type === "set") {
      const value = await getBundleValue(p);
      savings[p.id] = value ? value - Math.min(...p.variants.map((v) => v.price_ore)) : null;
    }
  }
  const delivery = settings.delivery;
  const deliveryText = delivery.show_delivery_time && delivery.delivery_time_text ? delivery.delivery_time_text : "Levering i hele Norge";

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "OnlineStore",
          name: SITE.name,
          description: SITE.description,
          url: absoluteUrl("/"),
          ...(settings.company.legal_name ? { legalName: settings.company.legal_name } : {}),
          ...(settings.company.org_number ? { vatID: `NO${settings.company.org_number}MVA` } : {}),
          ...(settings.company.email ? { email: settings.company.email } : {}),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE.name,
          url: absoluteUrl("/"),
          potentialAction: {
            "@type": "SearchAction",
            target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/sok")}?q={search_term_string}` },
            "query-input": "required name=search_term_string",
          },
        }}
      />

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <Image
          src={settings.hero.image_url || "/images/demo/hero.svg"}
          alt={settings.hero.image_alt || "Penselstrøk i oljemaling med tube og pensel"}
          fill
          priority
          unoptimized={!settings.hero.image_url}
          sizes="100vw"
          className="-z-10 object-cover object-right"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/10 lg:via-ink/70" />
        <div className="container-page relative grid min-h-[30rem] items-center py-16 lg:min-h-[34rem] lg:grid-cols-[1.2fr_1fr]">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-semibold tracking-[0.3em] text-gold uppercase">{SITE.tagline}</p>
            <h1 className="text-5xl leading-[1.02] font-bold text-white sm:text-6xl lg:text-7xl">
              Profesjonelt
              <br />
              kunstutstyr
            </h1>
            <p className="mt-6 max-w-xl font-serif text-xl text-white/90 sm:text-2xl">
              Oljemaling, pensler, lerret og tilbehør for kunstnere som stiller høye krav.
            </p>
            <ul className="mt-7 space-y-3">
              {["Profesjonell kvalitet", "Konkurransedyktige priser", "Levering i hele Norge"].map((t) => (
                <li key={t} className="flex items-center gap-3 text-base text-white/90">
                  <span className="flex size-6 items-center justify-center rounded-full bg-gold text-ink">
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="lg">
                <Link href="/produkter">
                  Se alle produkter <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline-light" size="lg">
                <Link href="/oljemaling">Se vårt utvalg av oljemaling</Link>
              </Button>
            </div>
          </div>
          <div className="hidden justify-end lg:flex">
            <div className="flex size-52 flex-col items-center justify-center rounded-full border-4 border-gold/70 bg-ink/80 p-6 text-center shadow-2xl ring-8 ring-ink/40 backdrop-blur">
              <span className="font-serif text-2xl leading-tight font-bold text-gold">SPAR PENGER</span>
              <span className="mt-2 text-xs leading-snug font-semibold tracking-wide text-white/90 uppercase">
                uten å gå på kompromiss med kvaliteten
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FORDELER */}
      <section aria-label="Fordeler" className="border-b border-border bg-white">
        <div className="container-page grid grid-cols-2 gap-x-4 gap-y-6 py-7 md:grid-cols-3 lg:grid-cols-5">
          {[
            { icon: Truck, title: delivery.show_delivery_time && delivery.delivery_time_text ? "Rask levering" : "Levering i hele Norge", text: deliveryText === "Levering i hele Norge" ? "Hjem eller til hentested" : deliveryText },
            { icon: House, title: "Levering på døren", text: "Eller til ønsket adresse" },
            { icon: CreditCard, title: "Handlekonto", text: "For bedrifter og institusjoner" },
            { icon: ShieldCheck, title: "Kvalitetsprodukter", text: "Kuratert sortiment" },
            { icon: Headset, title: "Norsk kundeservice", text: "Kunstnere hjelper kunstnere" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3">
              <Icon className="size-8 shrink-0 text-ink" strokeWidth={1.4} aria-hidden />
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* KATEGORIER */}
      <section className="container-page py-12" aria-labelledby="kategorier-tittel">
        <h2 id="kategorier-tittel" className="sr-only">
          Kategorier
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((c, i) => (
            <Link
              key={c.id}
              href={`/${c.slug}`}
              className={`group relative block aspect-[6/7] overflow-hidden rounded-lg bg-ink ${i === 4 ? "col-span-2 md:col-span-1" : ""}`}
            >
              <ProductImage src={c.image_url} alt="" fit="cover" className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" sizes="(min-width:1024px) 20vw, 50vw" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 pt-16">
                <h3 className="text-xl font-semibold text-white sm:text-2xl">{c.name}</h3>
                {c.tagline && <p className="mt-0.5 hidden text-xs text-white/75 sm:block">{c.tagline}</p>}
                <span className="mt-2 inline-flex items-center gap-1 text-sm text-white/90 group-hover:text-gold">
                  Se utvalg <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* POPULÆRE PRODUKTER */}
      <section className="container-page pb-14" aria-labelledby="populare-tittel">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 id="populare-tittel" className="text-3xl font-semibold sm:text-4xl">
            Populære produkter
          </h2>
          <Link href="/produkter" className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline">
            Se alle produkter <ArrowRight className="size-4" />
          </Link>
        </div>
        <ProductGrid products={featured} savings={savings} />
      </section>

      {/* KAMPANJEBLOKKER */}
      <section className="container-page grid gap-4 pb-14 lg:grid-cols-2">
        <div className="relative isolate overflow-hidden rounded-lg bg-ink p-8 text-white sm:p-10">
          <ProductImage src="/images/demo/kategori-oljemaling.svg" alt="" fit="cover" className="absolute inset-y-0 right-0 -z-10 w-1/2 opacity-60" sizes="50vw" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/90 to-transparent" />
          <h2 className="max-w-xs text-3xl font-semibold text-white sm:text-4xl">Alt du trenger for oljemaling</h2>
          <ul className="mt-5 space-y-2 text-sm text-white/90">
            {["Kuratert sortiment", "Tydelige spesifikasjoner", "Malersett med dokumentert besparelse"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="size-4 text-gold" /> {t}
              </li>
            ))}
          </ul>
          <Button asChild variant="gold" className="mt-7">
            <Link href="/oljemaling">
              Utforsk oljemaling <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="relative overflow-hidden rounded-lg border border-border bg-[#EFEBE3] p-8 sm:p-10">
          <div className="relative z-10 max-w-sm">
            <h2 className="text-3xl font-semibold sm:text-4xl">Bli bedriftskunde eller få handlekonto</h2>
            <ul className="mt-5 space-y-2 text-sm">
              {["Faktura etter godkjenning", "Mengderabatter og prisavtaler", "Dedikert kundeservice", "Enkel gjenbestilling"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-gold">
                    <Check className="size-3 text-ink" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-7">
              <Link href="/handlekonto">
                Søk om handlekonto <ArrowRight />
              </Link>
            </Button>
          </div>
          <div aria-hidden className="absolute -right-6 bottom-6 hidden w-56 rotate-6 rounded-md bg-white p-5 shadow-xl sm:block">
            <p className="font-serif text-sm font-bold tracking-widest">FAKTURA</p>
            <div className="mt-3 space-y-2">
              {[80, 60, 70, 40].map((w, i) => (
                <div key={i} className="h-1.5 rounded bg-secondary" style={{ width: `${w}%` }} />
              ))}
            </div>
            <div className="mt-6 rounded bg-ink px-3 py-4 text-center font-serif text-white">
              Kunstner<span className="text-gold">·</span>Pro
              <p className="text-[0.55rem] tracking-[0.3em] text-white/70">HANDLEKONTO</p>
            </div>
          </div>
        </div>
      </section>

      {/* KUNSTNERGUIDE */}
      <section className="border-t border-border bg-white py-14" aria-labelledby="guide-tittel">
        <div className="container-page">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] text-gold-dark uppercase">Kunstnerguide</p>
              <h2 id="guide-tittel" className="mt-1 text-3xl font-semibold sm:text-4xl">
                Råd fra atelieret
              </h2>
            </div>
            <Link href="/kunstnerguide" className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline">
              Alle artikler <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {articles.slice(0, 3).map((a) => (
              <Link key={a.id} href={`/kunstnerguide/${a.slug}`} className="group overflow-hidden rounded-lg border border-border bg-background">
                <ProductImage src={a.cover_image_url} alt="" fit="cover" className="aspect-[16/9] bg-[#F6F4EF]" sizes="(min-width:768px) 33vw, 100vw" />
                <div className="p-5">
                  <h3 className="text-xl font-semibold group-hover:underline">{a.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>
                  {a.reading_minutes && <p className="mt-3 text-xs text-muted-foreground">{a.reading_minutes} min lesetid</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
