"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { trackEvent } from "@/components/shop/consent/analytics";
import { syncAbandonedCart } from "@/app/actions/cart";
import { isSupabaseConfigured } from "@/lib/env";

/** Visningsdata lagres lokalt for rask visning. Pris og lager verifiseres alltid på serveren. */
export interface CartSnapshot {
  productName: string;
  variantName: string;
  slug: string;
  priceOre: number;
  imageUrl: string | null;
}

export interface CartItem {
  variantId: string;
  quantity: number;
  snapshot: CartSnapshot;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  ready: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (variantId: string, quantity: number, snapshot: CartSnapshot, openSheet?: boolean) => void;
  update: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  replace: (items: CartItem[]) => void;
  clear: () => void;
  discountCode: string;
  setDiscountCode: (code: string) => void;
  shippingCode: string;
  setShippingCode: (code: string) => void;
}

const STORAGE_KEY = "kp-cart-v1";
const MAX_QTY = 99;
const CartContext = createContext<CartContextValue | null>(null);

interface Stored {
  items: CartItem[];
  discountCode?: string;
  shippingCode?: string;
}

function load(): Stored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw) as Stored;
    const items = Array.isArray(parsed.items)
      ? parsed.items.filter((i) => typeof i?.variantId === "string" && Number.isInteger(i.quantity) && i.quantity > 0)
      : [];
    return { items, discountCode: parsed.discountCode ?? "", shippingCode: parsed.shippingCode ?? "" };
  } catch {
    return { items: [] };
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discountCode, setDiscountCode] = useState("");
  const [shippingCode, setShippingCode] = useState("");
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = load();
    /* eslint-disable react-hooks/set-state-in-effect -- hydrering fra localStorage */
    setItems(stored.items);
    setDiscountCode(stored.discountCode ?? "");
    setShippingCode(stored.shippingCode ?? "");
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const s = load();
        setItems(s.items);
        setDiscountCode(s.discountCode ?? "");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, discountCode, shippingCode }));
    } catch {
      // Lagring kan være blokkert (privat modus) – handlekurven fungerer fortsatt i økten.
    }
  }, [items, discountCode, shippingCode, ready]);

  // Synkroniser til server (debounce) – kun relevant for innloggede kunder
  useEffect(() => {
    if (!ready || !isSupabaseConfigured()) return;
    if (!document.cookie.includes("auth-token")) return;
    const t = setTimeout(() => {
      syncAbandonedCart(
        items.map((i) => ({ name: `${i.snapshot.productName} (${i.snapshot.variantName})`, quantity: i.quantity, priceOre: i.snapshot.priceOre })),
      ).catch(() => {});
    }, 4000);
    return () => clearTimeout(t);
  }, [items, ready]);

  const add = useCallback((variantId: string, quantity: number, snapshot: CartSnapshot, openSheet = true) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === variantId);
      if (existing) {
        return prev.map((i) =>
          i.variantId === variantId ? { ...i, quantity: Math.min(i.quantity + quantity, MAX_QTY), snapshot } : i,
        );
      }
      return [...prev, { variantId, quantity: Math.min(quantity, MAX_QTY), snapshot }];
    });
    trackEvent("add_to_cart", {
      currency: "NOK",
      value: (snapshot.priceOre * quantity) / 100,
      items: [{ item_id: variantId, item_name: snapshot.productName, item_variant: snapshot.variantName, price: snapshot.priceOre / 100, quantity }],
    });
    if (openSheet) setOpen(true);
  }, []);

  const update = useCallback((variantId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.variantId !== variantId)
        : prev.map((i) => (i.variantId === variantId ? { ...i, quantity: Math.min(quantity, MAX_QTY) } : i)),
    );
  }, []);

  const remove = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      ready,
      open,
      setOpen,
      add,
      update,
      remove,
      replace: setItems,
      clear: () => {
        setItems([]);
        setDiscountCode("");
      },
      discountCode,
      setDiscountCode,
      shippingCode,
      setShippingCode,
    }),
    [items, ready, open, add, update, remove, discountCode, shippingCode],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart må brukes innenfor CartProvider");
  return ctx;
}
