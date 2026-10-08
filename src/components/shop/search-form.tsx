import Form from "next/form";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchForm({ className, defaultValue, id = "sok" }: { className?: string; defaultValue?: string; id?: string }) {
  return (
    <Form action="/sok" role="search" className={cn("relative flex w-full", className)}>
      <label htmlFor={id} className="sr-only">
        Søk etter produkter
      </label>
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Søk etter oljemaling, pensler, lerret …"
        autoComplete="off"
        maxLength={100}
        className="h-11 w-full rounded-l-md border border-r-0 border-input bg-white px-4 text-sm placeholder:text-muted-foreground focus:border-gold focus:outline-none"
      />
      <button type="submit" className="flex h-11 w-12 shrink-0 items-center justify-center rounded-r-md bg-ink text-white transition-colors hover:bg-ink/85" aria-label="Søk">
        <Search className="size-5" />
      </button>
    </Form>
  );
}
