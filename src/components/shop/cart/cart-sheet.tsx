"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/money";
import { ProductImage } from "../product-image";
import { QuantityInput } from "./quantity-input";
import { useCart } from "./cart-provider";

export function CartSheet() {
  const { items, open, setOpen, update, remove, count } = useCart();
  const estimate = items.reduce((s, i) => s + i.snapshot.priceOre * i.quantity, 0);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Handlekurv ({count})</SheetTitle>
          <SheetDescription>Priser og lager bekreftes i handlekurven og kassen.</SheetDescription>
        </SheetHeader>
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="text-muted-foreground">Handlekurven er tom.</p>
            <Button asChild variant="outline" onClick={() => setOpen(false)}>
              <Link href="/oljemaling">Se oljemaling</Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-3 py-4">
                  <ProductImage src={item.snapshot.imageUrl} alt={item.snapshot.productName} className="size-20 shrink-0 rounded-md border bg-[#F6F4EF]" sizes="80px" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link href={`/produkt/${item.snapshot.slug}`} onClick={() => setOpen(false)} className="truncate text-sm font-medium hover:underline">
                      {item.snapshot.productName}
                    </Link>
                    <span className="text-xs text-muted-foreground">{item.snapshot.variantName}</span>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <QuantityInput size="sm" value={item.quantity} onChange={(n) => update(item.variantId, n)} />
                      <span className="text-sm font-semibold">{formatPrice(item.snapshot.priceOre * item.quantity)}</span>
                      <button type="button" onClick={() => remove(item.variantId)} className="text-muted-foreground hover:text-destructive" aria-label="Fjern">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t bg-background p-5">
              <div className="flex justify-between text-sm">
                <span>Foreløpig sum (inkl. MVA)</span>
                <span className="font-semibold">{formatPrice(estimate)}</span>
              </div>
              <Button asChild variant="outline" className="w-full" onClick={() => setOpen(false)}>
                <Link href="/handlekurv">Se handlekurv</Link>
              </Button>
              <Button asChild variant="default" size="lg" className="w-full" onClick={() => setOpen(false)}>
                <Link href="/kasse">Gå til kassen</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
