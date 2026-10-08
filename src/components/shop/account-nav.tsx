"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/konto", label: "Oversikt" },
  { href: "/konto/bestillinger", label: "Mine bestillinger" },
  { href: "/konto/fakturaer", label: "Fakturaer og kvitteringer" },
  { href: "/konto/adresser", label: "Leveringsadresser" },
  { href: "/konto/favoritter", label: "Favoritter" },
  { href: "/konto/handlekonto", label: "Handlekonto" },
  { href: "/konto/returer", label: "Returer" },
  { href: "/konto/innstillinger", label: "Kontoinnstillinger" },
  { href: "/kontakt", label: "Kundeservice" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Min side" className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
      {LINKS.map((l) => {
        const active = l.href === "/konto" ? pathname === "/konto" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "shrink-0 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors",
              active ? "bg-ink text-white" : "hover:bg-secondary",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
