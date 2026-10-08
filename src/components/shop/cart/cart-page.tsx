"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, Tag, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/money";
import { ProductImage } from "../product-image";
import { QuantityInput } from "./quantity-input";
import { OrderSummary } from "./order-summary";
import { useCart } from "./cart-provider";
import { usePricedCart } from "./use-priced-cart";

const ISSUE_TEXT = {
  unavailable: "Produktet er ikke lenger tilgjengelig.",
  out_of_stock: "Ikke på lager.",
  insufficient_stock: "Ikke nok på lager – reduser antall.",
};

export function CartPageClient() {
  const { items, ready, update, remove, discountCode, setDiscountCode, shippingCode, setShippingCode } = useCart();
  const { totals, loading, error } = usePricedCart();
  const [codeInput, setCodeInput] = useState(discountCode);

  if (!ready) return <Skeleton className="h-64" />;
  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-10 text-center">
        <p className="text-lg">Handlekurven er tom.</p>
        <Button asChild className="mt-5">
          <Link href="/produkter">Se alle produkter</Link>
        </Button>
      </div>
    );
  }

  const lineMap = new Map(totals?.lines.map((l) => [l.variant_id, l]));
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        {error && <Alert variant="destructive">{error}</Alert>}
        {totals?.amount_to_free_shipping_ore !== null && totals?.amount_to_free_shipping_ore !== undefined && totals.subtotal_ore > 0 && (
          <div className="rounded-lg border bg-white p-4 text-sm">
            <p className="flex items-center gap-2">
              <Truck className="size-4" />
              {totals.amount_to_free_shipping_ore > 0 ? (
                <>Handle for {formatPrice(totals.amount_to_free_shipping_ore)} til, så får du fri frakt.</>
              ) : (
                <strong>Du har fri frakt!</strong>
              )}
            </p>
            {totals.free_shipping_threshold_ore && (
              <div className="mt-2 h-1.5 overflow-hidden rounded bg-secondary">
                <div className="h-full bg-gold transition-all" style={{ width: `${Math.min(100, ((totals.subtotal_ore - totals.code_discount_ore) / totals.free_shipping_threshold_ore) * 100)}%` }} />
              </div>
            )}
          </div>
        )}
        <ul className="divide-y rounded-lg border bg-white">
          {items.map((item) => {
            const line = lineMap.get(item.variantId);
            return (
              <li key={item.variantId} className="flex gap-4 p-4" data-testid="cart-line">
                <ProductImage src={item.snapshot.imageUrl} alt={item.snapshot.productName} className="size-24 shrink-0 rounded-md border bg-[#F6F4EF]" sizes="96px" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex justify-between gap-4">
                    <div>
                      <Link href={`/produkt/${item.snapshot.slug}`} className="font-medium hover:underline">
                        {item.snapshot.productName}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {item.snapshot.variantName} · {formatPrice(line?.unit_price_ore ?? item.snapshot.priceOre)} per stk
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold" data-testid="line-total">
                        {formatPrice(line ? line.line_total_ore : item.snapshot.priceOre * item.quantity)}
                      </p>
                      {line && line.volume_discount_ore > 0 && (
                        <p className="text-xs text-success">
                          {line.volume_discount_label}: −{formatPrice(line.volume_discount_ore)}
                        </p>
                      )}
                    </div>
                  </div>
                  {line?.issue && (
                    <p className="flex items-center gap-1 text-sm text-destructive">
                      <AlertTriangle className="size-4" /> {ISSUE_TEXT[line.issue]}
                      {line.issue === "insufficient_stock" && line.max_quantity > 0 && ` (maks ${line.max_quantity})`}
                    </p>
                  )}
                  <div className="mt-auto flex items-center gap-3 pt-2">
                    <QuantityInput size="sm" value={item.quantity} onChange={(n) => update(item.variantId, n)} max={99} />
                    <button type="button" onClick={() => remove(item.variantId)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-4" /> Fjern
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <aside className="h-fit space-y-5 rounded-lg border bg-white p-5 lg:sticky lg:top-4">
        <h2 className="text-xl font-semibold">Sammendrag</h2>
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            setDiscountCode(codeInput.trim().toUpperCase());
          }}
        >
          <label htmlFor="rabattkode" className="flex items-center gap-1.5 text-sm font-medium">
            <Tag className="size-4" /> Rabattkode
          </label>
          <div className="flex gap-2">
            <Input id="rabattkode" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="Skriv inn kode" maxLength={40} />
            <Button type="submit" variant="outline">
              Bruk
            </Button>
          </div>
          {totals?.code && (
            <p className={`text-sm ${totals.code.valid ? "text-success" : "text-destructive"}`} role="status">
              {totals.code.message}
              {discountCode && (
                <button
                  type="button"
                  className="ml-2 underline"
                  onClick={() => {
                    setDiscountCode("");
                    setCodeInput("");
                  }}
                >
                  Fjern
                </button>
              )}
            </p>
          )}
        </form>

        {totals && totals.shipping_options.length > 0 && (
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium">Frakt</legend>
            {totals.shipping_options.map((o) => (
              <label key={o.code} className="flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm has-[:checked]:border-ink">
                <input type="radio" name="frakt" checked={totals.shipping?.code === o.code} onChange={() => setShippingCode(o.code)} className="mt-1 accent-[#111]" />
                <span className="flex-1">
                  <span className="font-medium">{o.name}</span>
                  {o.delivery_estimate && <span className="block text-xs text-muted-foreground">{o.delivery_estimate}</span>}
                </span>
                <span>{o.is_free ? "Gratis" : formatPrice(o.price_ore)}</span>
              </label>
            ))}
          </fieldset>
        )}

        {totals ? <OrderSummary totals={totals} /> : <Skeleton className="h-32" />}

        <Button asChild size="lg" className="w-full" disabled={loading || !totals || totals.has_issues || totals.items_count === 0}>
          {totals?.has_issues ? <span>Rett opp handlekurven</span> : <Link href="/kasse">Gå til kassen</Link>}
        </Button>
        <p className="text-center text-xs text-muted-foreground">Alle priser inkl. 25 % MVA.</p>
      </aside>
    </div>
  );
}
