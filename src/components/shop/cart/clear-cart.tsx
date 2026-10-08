"use client";

import { useEffect } from "react";
import { useCart } from "./cart-provider";
import { trackEvent } from "../consent/analytics";

export function ClearCart({ orderNumber, totalOre }: { orderNumber: number; totalOre: number }) {
  const { clear, ready } = useCart();
  useEffect(() => {
    if (!ready) return;
    clear();
    const key = `kp-tracked-${orderNumber}`;
    try {
      if (!sessionStorage.getItem(key)) {
        trackEvent("purchase", { transaction_id: String(orderNumber), currency: "NOK", value: totalOre / 100 });
        sessionStorage.setItem(key, "1");
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, orderNumber]);
  return null;
}
