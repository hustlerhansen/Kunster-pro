"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityInput({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  label = "Antall",
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  label?: string;
}) {
  const h = size === "sm" ? "h-8" : "h-12";
  const w = size === "sm" ? "w-8" : "w-11";
  return (
    <div className={cn("inline-flex items-center rounded-md border border-input bg-white", h)}>
      <button type="button" className={cn("flex h-full items-center justify-center text-ink disabled:opacity-40", w)} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Reduser antall">
        <Minus className="size-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (Number.isFinite(n)) onChange(Math.min(Math.max(n, min), max));
        }}
        className={cn("h-full border-x border-input text-center text-sm font-medium [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none", size === "sm" ? "w-9" : "w-12")}
      />
      <button type="button" className={cn("flex h-full items-center justify-center text-ink disabled:opacity-40", w)} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Øk antall">
        <Plus className="size-4" />
      </button>
    </div>
  );
}
