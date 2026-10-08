"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { MAIN_NAV } from "@/lib/site";
import { useSessionInfo } from "./header-actions";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { loggedIn, isStaff } = useSessionInfo();
  const links = [
    ...MAIN_NAV,
    { label: loggedIn ? "Min konto" : "Logg inn / Registrer", href: loggedIn ? "/konto" : "/logg-inn" },
    { label: "Handlekonto", href: "/handlekonto" },
    { label: "For bedrifter", href: "/bedrift" },
    { label: "Kundeservice", href: "/kontakt" },
    ...(isStaff ? [{ label: "Administrasjon", href: "/admin" }] : []),
  ];
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="rounded-md p-2 lg:hidden" aria-label="Åpne meny">
        <Menu className="size-6" />
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Meny</SheetTitle>
          <SheetDescription className="sr-only">Navigasjon</SheetDescription>
        </SheetHeader>
        <nav className="flex-1 overflow-y-auto p-2" aria-label="Mobilmeny">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-md px-3 py-3 text-base font-medium hover:bg-secondary">
              {l.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
