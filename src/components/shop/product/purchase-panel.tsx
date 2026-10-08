"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { Price } from "../price";
import { StockStatus } from "../stock-status";
import { AddToCartButton } from "../cart/add-to-cart-button";
import { QuantityInput } from "../cart/quantity-input";
import { FavoriteButton } from "./favorite-button";
import { buildSpecRows } from "@/lib/specs";

export function PurchasePanel({ product }: { product: Product }) {
  const firstAvailable = product.variants.find((v) => v.stock_available > 0) ?? product.variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id);
  const [qty, setQty] = useState(1);
  const variant = product.variants.find((v) => v.id === variantId) ?? firstAvailable;
  if (!variant) return <p className="text-muted-foreground">Produktet er ikke tilgjengelig.</p>;
  const max = Math.max(1, Math.min(variant.stock_available, 99));

  return (
    <div className="space-y-6">
      <Price priceOre={variant.price_ore} referencePriceOre={variant.reference_price_ore} vatRate={variant.vat_rate} size="lg" showExVat />

      {product.variants.length > 1 && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">
            Velg variant: <span className="font-normal text-muted-foreground">{variant.name}</span>
          </legend>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={v.id === variant.id}
                onClick={() => {
                  setVariantId(v.id);
                  setQty(1);
                }}
                className={cn(
                  "min-w-20 rounded-md border px-3 py-2 text-sm transition-colors",
                  v.id === variant.id ? "border-ink bg-ink text-white" : "border-input bg-white hover:border-ink",
                  v.stock_available <= 0 && "text-muted-foreground line-through decoration-1",
                  v.id === variant.id && v.stock_available <= 0 && "text-white/70",
                )}
                data-testid="variant-option"
              >
                {v.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {product.variants.length > 1 && Object.keys(variant.options ?? {}).length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {buildSpecRows(product.product_type, {}, variant.options).map((r) => (
            <div key={r.key} className="contents">
              <dt className="text-muted-foreground">{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <StockStatus available={variant.stock_available} minStock={variant.min_stock} />
        <span className="text-muted-foreground">Varenr. {variant.sku}</span>
      </div>

      <div className="flex gap-2 sm:gap-3">
        <QuantityInput value={qty} onChange={setQty} max={max} />
        <AddToCartButton
          variantId={variant.id}
          quantity={qty}
          disabled={variant.stock_available <= 0}
          snapshot={{
            productName: product.name,
            variantName: variant.name,
            slug: product.slug,
            priceOre: variant.price_ore,
            imageUrl: product.images[0]?.url ?? null,
          }}
          className="min-w-0 flex-1 px-3 sm:px-7"
        />
        <FavoriteButton productId={product.id} />
      </div>
    </div>
  );
}
