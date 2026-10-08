import Link from "next/link";
import { ProductGrid } from "@/components/shop/product-card";
import { createClient } from "@/lib/supabase/server";
import { getProducts } from "@/lib/data/catalog";

export default async function FavoritesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("favorites").select("product_id").order("created_at", { ascending: false });
  const products = await getProducts({ ids: (data ?? []).map((f) => f.product_id) });
  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold">Favoritter</h2>
      {products.length ? (
        <ProductGrid products={products} />
      ) : (
        <p className="text-muted-foreground">
          Du har ingen favoritter ennå. Trykk på hjertet på en produktside for å lagre. <Link href="/produkter" className="underline">Se produkter</Link>.
        </p>
      )}
    </div>
  );
}
