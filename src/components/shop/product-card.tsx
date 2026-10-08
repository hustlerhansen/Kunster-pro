import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { ProductImage } from "./product-image";
import { Price } from "./price";
import { StockStatus } from "./stock-status";
import { AddToCartButton } from "./cart/add-to-cart-button";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ product, priority = false, savingsOre }: { product: Product; priority?: boolean; savingsOre?: number | null }) {
  const variants = product.variants;
  const cheapest = variants.reduce((min, v) => (v.price_ore < min.price_ore ? v : min), variants[0]);
  if (!cheapest) return null;
  const available = variants.reduce((s, v) => s + Math.max(v.stock_available, 0), 0);
  const multi = variants.length > 1;
  const differentPrices = new Set(variants.map((v) => v.price_ore)).size > 1;
  const onSale = variants.some((v) => (v.reference_price_ore ?? 0) > v.price_ore);
  const image = product.images[0];
  const href = `/produkt/${product.slug}`;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-white transition-shadow hover:shadow-lg">
      <Link href={href} className="relative block aspect-square bg-[#F6F4EF]">
        <ProductImage src={image?.url} alt={image?.alt ?? product.name} priority={priority} className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]" />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {onSale && <Badge variant="destructive">Tilbud</Badge>}
          {typeof savingsOre === "number" && savingsOre > 0 && <Badge variant="gold">Spar {Math.round(savingsOre / 100)} kr</Badge>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-sans text-[0.95rem] leading-snug font-medium">
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {product.name}
          </Link>
        </h3>
        {(product.subtitle || multi) && (
          <p className="text-sm text-muted-foreground">
            {product.subtitle ?? ""}
            {multi && <span className="block text-xs">{variants.length} varianter</span>}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div className="flex flex-col gap-1">
            <Price priceOre={cheapest.price_ore} referencePriceOre={cheapest.reference_price_ore} fromPrice={differentPrices} size="md" />
            <StockStatus available={available} />
          </div>
          <div className="relative z-10">
            {multi ? (
              <Link
                href={href}
                aria-label={`Velg variant av ${product.name}`}
                className="flex size-10 items-center justify-center rounded-md bg-gold text-ink shadow-sm transition-colors hover:bg-[#c9a253]"
              >
                <ChevronRight className="size-5" />
              </Link>
            ) : (
              <AddToCartButton
                compact
                variantId={cheapest.id}
                disabled={cheapest.stock_available <= 0}
                snapshot={{
                  productName: product.name,
                  variantName: cheapest.name,
                  slug: product.slug,
                  priceOre: cheapest.price_ore,
                  imageUrl: image?.url ?? null,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, savings }: { products: Product[]; savings?: Record<string, number | null> }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} savingsOre={savings?.[p.id]} />
      ))}
    </div>
  );
}
