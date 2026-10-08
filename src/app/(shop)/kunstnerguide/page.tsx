import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { ProductImage } from "@/components/shop/product-image";
import { getArticles } from "@/lib/data/catalog";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Kunstnerguide – råd om oljemaling, pensler og lerret",
  description: "Praktiske guider om oljemaling: velg riktig maling, pensler og lerret, utstyr for nybegynnere og vedlikehold av pensler.",
  alternates: { canonical: "/kunstnerguide" },
};

export default async function GuideIndex() {
  const articles = await getArticles();
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Kunstnerguide" }]} />
      <header className="mt-5 mb-10 max-w-3xl">
        <h1 className="text-4xl font-semibold sm:text-5xl">Kunstnerguide</h1>
        <p className="mt-3 text-lg text-muted-foreground">Faglige råd om oljemaling, pensler, lerret og utstyr – skrevet for å være lette å lese og bruke i praksis.</p>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <Link key={a.id} href={`/kunstnerguide/${a.slug}`} className="group overflow-hidden rounded-lg border bg-white">
            <ProductImage src={a.cover_image_url} alt="" fit="cover" className="aspect-[16/9] bg-[#F6F4EF]" sizes="(min-width:1024px) 33vw, 100vw" />
            <div className="p-5">
              <h2 className="text-xl font-semibold group-hover:underline">{a.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{a.excerpt}</p>
              {a.reading_minutes && <p className="mt-3 text-xs text-muted-foreground">{a.reading_minutes} min lesetid</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
