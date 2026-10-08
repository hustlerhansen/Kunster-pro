import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { ProductGrid } from "@/components/shop/product-card";
import { SearchForm } from "@/components/shop/search-form";
import { searchProducts } from "@/lib/data/catalog";

export const metadata: Metadata = { title: "Søk", robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: PageProps<"/sok">) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? "";
  const results = q ? await searchProducts(q) : [];
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Søk" }]} />
      <h1 className="mt-5 text-4xl font-semibold">{q ? `Søk etter «${q}»` : "Søk"}</h1>
      <SearchForm className="my-6 max-w-xl" defaultValue={q} id="sok-side" />
      {q.length > 0 && q.length < 2 && <p className="text-muted-foreground">Skriv minst to tegn.</p>}
      {q.length >= 2 && (
        <>
          <p className="mb-5 text-sm text-muted-foreground" data-testid="search-count">
            {results.length} treff
          </p>
          {results.length ? <ProductGrid products={results} /> : <p className="py-10 text-muted-foreground">Ingen produkter matchet søket. Prøv et annet ord, for eksempel «lerret» eller «pensel».</p>}
        </>
      )}
    </div>
  );
}
