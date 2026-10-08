import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Enkel, tilgjengelig select basert på native <select> – fungerer uten JavaScript i skjemaer. */
function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="native-select"
        className={cn(
          "flex h-10 w-full appearance-none rounded-md border border-input bg-white py-2 pr-9 pl-3 text-base shadow-xs focus-visible:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50 md:text-sm",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export { NativeSelect };
