"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAV } from "@/lib/site";
import { cn } from "@/lib/utils";

export function MainNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Hovedmeny" className="hidden border-y border-border bg-white lg:block">
      <ul className="container-page flex h-12 items-center justify-between">
        {MAIN_NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "relative py-3 text-[0.9rem] font-medium text-ink transition-colors hover:text-gold-dark",
                  item.href === "/tilbud" && "text-gold-dark",
                  active && "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-gold",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
