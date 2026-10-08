import { cn } from "@/lib/utils";

export function StockStatus({ available, minStock = 0, className }: { available: number; minStock?: number; className?: string }) {
  const state = available <= 0 ? "out" : available <= Math.max(3, Math.min(minStock, 5)) ? "low" : "in";
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", className)}>
      <span
        className={cn(
          "size-2 rounded-full",
          state === "in" && "bg-success",
          state === "low" && "bg-amber-500",
          state === "out" && "bg-destructive",
        )}
        aria-hidden
      />
      <span className={cn(state === "out" ? "text-destructive" : "text-foreground/80")}>
        {state === "in" ? "På lager" : state === "low" ? `Få igjen (${available} stk)` : "Ikke på lager"}
      </span>
    </span>
  );
}
