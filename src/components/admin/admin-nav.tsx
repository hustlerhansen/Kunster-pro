"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Boxes, Building2, FileText, FolderTree, Gauge, Mail, MessageSquare, Package, Percent, ReceiptText,
  RotateCcw, ScrollText, Settings, ShoppingBag, Truck, Users, Warehouse, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const GROUPS = [
  { title: "Oversikt", links: [{ href: "/admin", label: "Dashbord", icon: Gauge }] },
  {
    title: "Salg",
    links: [
      { href: "/admin/ordrer", label: "Ordrer", icon: ShoppingBag },
      { href: "/admin/returer", label: "Returer", icon: RotateCcw },
      { href: "/admin/kunder", label: "Kunder", icon: Users },
      { href: "/admin/handlekontoer", label: "Handlekonto og kreditt", icon: Wallet },
      { href: "/admin/fakturaer", label: "Fakturaer", icon: ReceiptText },
      { href: "/admin/henvendelser", label: "Henvendelser", icon: MessageSquare },
    ],
  },
  {
    title: "Katalog",
    links: [
      { href: "/admin/produkter", label: "Produkter", icon: Package },
      { href: "/admin/kategorier", label: "Kategorier", icon: FolderTree },
      { href: "/admin/prisgrupper", label: "Prisgrupper (B2B)", icon: Building2 },
    ],
  },
  {
    title: "Innkjøp og lager",
    links: [
      { href: "/admin/lager", label: "Lager", icon: Warehouse },
      { href: "/admin/suppliers", label: "Leverandører", icon: Truck },
      { href: "/admin/innkjop", label: "Innkjøpsordrer", icon: Boxes },
      { href: "/admin/lonnsomhet", label: "Lønnsomhet", icon: BarChart3 },
    ],
  },
  {
    title: "Markedsføring",
    links: [
      { href: "/admin/kampanjer", label: "Kampanjer og rabatter", icon: Percent },
      { href: "/admin/nyhetsbrev", label: "Nyhetsbrev", icon: Mail },
      { href: "/admin/artikler", label: "Kunstnerguide", icon: FileText },
    ],
  },
  {
    title: "System",
    links: [
      { href: "/admin/frakt", label: "Frakt", icon: Truck },
      { href: "/admin/innstillinger", label: "Innstillinger", icon: Settings },
      { href: "/admin/logg", label: "Hendelseslogg", icon: ScrollText },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="space-y-5 text-sm" aria-label="Administrasjon">
      {GROUPS.map((g) => (
        <div key={g.title}>
          <p className="mb-1.5 px-3 text-[0.65rem] font-semibold tracking-[0.18em] text-white/40 uppercase">{g.title}</p>
          <ul className="space-y-0.5">
            {g.links.map((l) => {
              const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={cn("flex items-center gap-2.5 rounded-md px-3 py-1.5 text-white/75 hover:bg-white/10 hover:text-white", active && "bg-white/10 text-gold")}
                  >
                    <l.icon className="size-4" />
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
