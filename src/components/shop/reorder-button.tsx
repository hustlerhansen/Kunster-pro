"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getReorderLines } from "@/app/actions/account";
import { useCart } from "./cart/cart-provider";

/** «Kjøp samme produkter igjen» – legger linjene fra en tidligere ordre i handlekurven. */
export function ReorderButton({ orderId, size = "default" }: { orderId: string; size?: "default" | "sm" }) {
  const [pending, start] = useTransition();
  const { add } = useCart();
  const router = useRouter();
  return (
    <Button
      variant="gold"
      size={size}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const lines = await getReorderLines(orderId);
          if (!lines.length) {
            toast.error("Produktene fra denne ordren er ikke lenger tilgjengelige.");
            return;
          }
          lines.forEach((l) => add(l.variantId, l.quantity, l.snapshot, false));
          toast.success("Produktene er lagt i handlekurven. Priser og lager kontrolleres på nytt.");
          router.push("/handlekurv");
        })
      }
    >
      <RotateCcw /> Kjøp samme produkter igjen
    </Button>
  );
}
