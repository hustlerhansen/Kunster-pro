import Link from "next/link";
import type { Product } from "@/lib/types";
import type { ProductSort } from "@/lib/data/catalog";
import { ProductGrid } from "./product-card";
import { cn } from "@/lib/utils";

const SORTS: { value: ProductSort; label: string }[] = [
  { value: "popular", label: "Populære" },
  { value: "price-asc", label: "Pris lav–høy" },
  { value: "price-desc", label: "Pris høy–lav" },
  { value: "name", label: "Navn A–Å" },
];

export function parseSort(value: string | string[] | undefined): ProductSort {
  const v = Array.isArray(value) ? value[0] : value;
  return SORTS.some((s) => s.value === v) ? (v as ProductSort) : "popular";
}

export function ProductListing({
  products,
  basePath,
  sort,
  inStock,
  savings,
}: {
  products: Product[];
  basePath: string;
  sort: ProductSort;
  inStock: boolean;
  savings?: Record<string, number | null>;
}) {
  const href = (params: { sort?: string; lager?: boolean }) => {
    const sp = new URLSearchParams();
    const s = params.sort ?? sort;
    if (s !== "popular") sp.set("sort", s);
    if (params.lager ?? inStock) sp.set("lager", "1");
    const q = sp.toString();
    return q ? `${basePath}?${q}` : basePath;
  };
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <p className="text-sm text-muted-foreground">
          {products.length} {products.length === 1 ? "produkt" : "produkter"}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href={href({ lager: !inStock })}
            scroll={false}
            className={cn("rounded-full border px-3 py-1.5", inStock ? "border-ink bg-ink text-white" : "border-input bg-white hover:border-ink")}
          >
            Kun på lager
          </Link>
          <span className="ml-2 text-muted-foreground">Sorter:</span>
          {SORTS.map((s) => (
            <Link
              key={s.value}
              href={href({ sort: s.value })}
              scroll={false}
              className={cn("rounded-full px-3 py-1.5", sort === s.value ? "bg-secondary font-medium" : "hover:bg-secondary/60")}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>
      {products.length ? (
        <ProductGrid products={products} savings={savings} />
      ) : (
        <p className="py-16 text-center text-muted-foreground">Ingen produkter matcher valget ditt.</p>
      )}
    </div>
  );
}
