import { exVat, formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Prisvisning. Førpris vises KUN når den er beregnet som laveste pris de siste 30 dagene
 * før prisreduksjonen (prisopplysningsforskriften) – aldri en manuelt satt «veiledende pris».
 */
export function Price({
  priceOre,
  referencePriceOre,
  vatRate = 25,
  fromPrice = false,
  size = "md",
  showExVat = false,
  className,
}: {
  priceOre: number;
  referencePriceOre?: number | null;
  vatRate?: number;
  fromPrice?: boolean;
  size?: "sm" | "md" | "lg";
  showExVat?: boolean;
  className?: string;
}) {
  const discounted = typeof referencePriceOre === "number" && referencePriceOre > priceOre;
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span
          className={cn(
            "font-semibold tracking-tight",
            size === "lg" ? "text-3xl" : size === "md" ? "text-xl" : "text-base",
            discounted && "text-destructive",
          )}
        >
          {fromPrice && <span className="mr-1 text-[0.7em] font-normal text-muted-foreground">fra</span>}
          {formatPrice(priceOre)}
        </span>
        {discounted && (
          <span className="text-sm text-muted-foreground">
            Før <s>{formatPrice(referencePriceOre!)}</s>
          </span>
        )}
      </div>
      {discounted && size === "lg" && (
        <span className="text-xs text-muted-foreground">Førpris = laveste pris de siste 30 dagene før prisreduksjonen.</span>
      )}
      {showExVat && (
        <span className="text-xs text-muted-foreground">
          {formatPrice(exVat(priceOre, vatRate))} ekskl. MVA · inkl. {vatRate} % MVA
        </span>
      )}
    </div>
  );
}
