"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCart, type CartSnapshot } from "./cart-provider";

export function AddToCartButton({
  variantId,
  snapshot,
  quantity = 1,
  disabled,
  compact = false,
  className,
}: {
  variantId: string;
  snapshot: CartSnapshot;
  quantity?: number;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const { add } = useCart();
  if (compact) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => add(variantId, quantity, snapshot)}
        aria-label={`Legg ${snapshot.productName} i handlekurven`}
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-md bg-gold text-ink shadow-sm transition-colors hover:bg-[#c9a253] disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground",
          className,
        )}
      >
        <ShoppingCart className="size-[1.1rem]" />
      </button>
    );
  }
  return (
    <Button
      type="button"
      variant="gold"
      size="lg"
      disabled={disabled}
      onClick={() => add(variantId, quantity, snapshot)}
      className={cn("w-full", className)}
      data-testid="add-to-cart"
    >
      <ShoppingCart />
      {disabled ? "Ikke på lager" : "Legg i handlekurv"}
    </Button>
  );
}
