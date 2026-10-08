"use client";

import { useEffect, useRef, useState } from "react";
import { priceCartAction } from "@/app/actions/cart";
import type { CartTotals } from "@/lib/pricing/cart";
import { useCart } from "./cart-provider";

/** Henter autoritative priser fra serveren hver gang handlekurven endres. */
export function usePricedCart() {
  const { items, ready, discountCode, shippingCode, replace } = useCart();
  const [totals, setTotals] = useState<CartTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const seq = useRef(0);

  useEffect(() => {
    if (!ready) return;
    const id = ++seq.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synkroniserer med server
    setLoading(true);
    priceCartAction({
      lines: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      discountCode: discountCode || null,
      shippingCode: shippingCode || null,
    }).then((res) => {
      if (id !== seq.current) return;
      setLoading(false);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setError(null);
      setTotals(res.totals);
      // Fjern varer som ikke finnes lenger, og oppdater visningspriser
      const known = new Map(res.totals.lines.map((l) => [l.variant_id, l]));
      const cleaned = items
        .filter((i) => known.has(i.variantId))
        .map((i) => {
          const l = known.get(i.variantId)!;
          return l.unit_price_ore !== i.snapshot.priceOre ? { ...i, snapshot: { ...i.snapshot, priceOre: l.unit_price_ore } } : i;
        });
      if (cleaned.length !== items.length || cleaned.some((c, idx) => c !== items[idx])) replace(cleaned);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, JSON.stringify(items.map((i) => [i.variantId, i.quantity])), discountCode, shippingCode, nonce]);

  return { totals, loading, error, refresh: () => setNonce((n) => n + 1) };
}
