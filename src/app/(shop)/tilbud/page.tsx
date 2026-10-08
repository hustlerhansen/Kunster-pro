import type { Metadata } from "next";
import Link from "next/link";
import { Info, Percent } from "lucide-react";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { ProductGrid } from "@/components/shop/product-card";
import { getAllProducts, getBundleValue, getProductsOnSale, getVolumeDiscounts } from "@/lib/data/catalog";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Tilbud på oljemaling og kunstmateriell",
  description: "Aktuelle tilbud, mengderabatter og malersett med dokumentert besparelse hos Kunstner Pro.",
  alternates: { canonical: "/tilbud" },
};

export default async function OffersPage() {
  const [onSale, volume, all] = await Promise.all([getProductsOnSale(), getVolumeDiscounts(), getAllProducts()]);
  const sets = all.filter((p) => p.product_type === "set");
  const savings: Record<string, number | null> = {};
  for (const p of sets) {
    const value = await getBundleValue(p);
    savings[p.id] = value ? value - Math.min(...p.variants.map((v) => v.price_ore)) : null;
  }
  const volumeProducts = all.filter((p) => volume.some((v) => v.product_id === p.id || v.category_id === p.category_id));

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Tilbud" }]} />
      <header className="mt-5 mb-8 max-w-3xl">
        <h1 className="text-4xl font-semibold sm:text-5xl">Tilbud</h1>
        <p className="mt-3 text-lg text-muted-foreground">Vi viser bare reelle besparelser – i tråd med norske prisregler.</p>
      </header>

      <section className="mb-14">
        <h2 className="mb-2 text-2xl font-semibold">Prisreduserte produkter</h2>
        <p className="mb-5 flex items-start gap-2 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" /> Førprisen er den laveste prisen produktet har hatt de siste 30 dagene før prisreduksjonen.
        </p>
        {onSale.length ? <ProductGrid products={onSale} /> : <p className="rounded-lg border bg-white p-6 text-muted-foreground">Ingen prisreduserte produkter akkurat nå.</p>}
      </section>

      {volume.length > 0 && (
        <section className="mb-14">
          <h2 className="mb-4 text-2xl font-semibold">Mengderabatt</h2>
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            {volume.map((v) => (
              <div key={v.id} className="flex gap-3 rounded-lg border border-gold/50 bg-gold-light/40 p-4">
                <Percent className="size-5 shrink-0 text-gold-dark" />
                <div>
                  <p className="font-semibold">{v.name}</p>
                  {v.description && <p className="text-sm text-muted-foreground">{v.description}</p>}
                </div>
              </div>
            ))}
          </div>
          <ProductGrid products={volumeProducts} />
        </section>
      )}

      <section>
        <h2 className="mb-2 text-2xl font-semibold">Malersett – spar mot enkeltkjøp</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Besparelsen er beregnet mot dagens pris på de samme produktene kjøpt enkeltvis. <Link href="/malersett" className="underline">Se alle malersett</Link>.
        </p>
        <ProductGrid products={sets} savings={savings} />
      </section>
    </div>
  );
}
