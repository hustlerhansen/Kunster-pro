import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { ProductListing, parseSort } from "@/components/shop/product-listing";
import { getProducts } from "@/lib/data/catalog";

export const metadata: Metadata = {
  title: "Alle produkter – oljemaling, pensler, lerret og malermedium",
  description: "Se hele sortimentet hos Kunstner Pro: oljemaling, pensler, lerret, malermedium og malersett.",
  alternates: { canonical: "/produkter" },
};

export default async function AllProductsPage({ searchParams }: PageProps<"/produkter">) {
  const sp = await searchParams;
  const sort = parseSort(sp.sort);
  const inStock = sp.lager === "1";
  const products = await getProducts({ sort, inStockOnly: inStock });
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Alle produkter" }]} />
      <h1 className="mt-5 mb-8 text-4xl font-semibold sm:text-5xl">Alle produkter</h1>
      <ProductListing products={products} basePath="/produkter" sort={sort} inStock={inStock} />
    </div>
  );
}
