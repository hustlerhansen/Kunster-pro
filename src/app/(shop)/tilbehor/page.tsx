import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { ProductGrid } from "@/components/shop/product-card";
import { getAllProducts } from "@/lib/data/catalog";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Tilbehør til oljemaling",
  description: "Tilbehør til oljemaling: penselrens, medium og utstyr for maling og vedlikehold.",
  alternates: { canonical: "/tilbehor" },
};

export default async function AccessoriesPage() {
  const products = (await getAllProducts()).filter((p) => p.product_type === "accessory" || p.product_type === "medium");
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Tilbehør" }]} />
      <header className="mt-5 mb-8 max-w-3xl">
        <h1 className="text-4xl font-semibold sm:text-5xl">Tilbehør</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Medium, rengjøring og utstyr som gjør arbeidet enklere. Se også <Link href="/malermedium" className="underline">malermedium</Link>.
        </p>
      </header>
      <ProductGrid products={products} />
    </div>
  );
}
