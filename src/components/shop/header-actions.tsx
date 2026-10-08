"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CreditCard, LayoutDashboard, ShoppingCart, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "./cart/cart-provider";

export function useSessionInfo() {
  const [info, setInfo] = useState<{ loggedIn: boolean; isStaff: boolean; name: string | null }>({
    loggedIn: false,
    isStaff: false,
    name: null,
  });
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    let active = true;
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        if (active) setInfo({ loggedIn: false, isStaff: false, name: null });
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle();
      if (active)
        setInfo({
          loggedIn: true,
          isStaff: profile?.role === "admin" || profile?.role === "staff",
          name: profile?.full_name?.split(" ")[0] ?? null,
        });
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return info;
}

function Action({ href, icon: Icon, label, badge }: { href?: string; icon: typeof User; label: string; badge?: React.ReactNode }) {
  const inner = (
    <>
      <span className="relative">
        <Icon className="size-6" strokeWidth={1.6} aria-hidden />
        {badge}
      </span>
      <span className="hidden text-xs font-medium sm:block">{label}</span>
    </>
  );
  const cls = "flex flex-col items-center gap-1 rounded-md px-2 py-1 text-ink transition-colors hover:text-gold-dark";
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function HeaderActions() {
  const { loggedIn, isStaff, name } = useSessionInfo();
  const { count, ready, setOpen } = useCart();
  return (
    <div className="flex items-center gap-1 sm:gap-3">
      {isStaff && <Action href="/admin" icon={LayoutDashboard} label="Admin" />}
      <Action href={loggedIn ? "/konto" : "/logg-inn"} icon={User} label={loggedIn ? (name ? `Hei, ${name}` : "Min konto") : "Logg inn"} />
      <span className="hidden md:block">
        <Action href="/handlekonto" icon={CreditCard} label="Handlekonto" />
      </span>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-col items-center gap-1 rounded-md px-2 py-1 text-ink transition-colors hover:text-gold-dark"
        aria-label={`Handlekurv, ${count} varer`}
        data-testid="cart-button"
      >
        <span className="relative">
          <ShoppingCart className="size-6" strokeWidth={1.6} aria-hidden />
          <span
            className="absolute -top-2 -right-2.5 flex size-5 items-center justify-center rounded-full bg-ink text-[0.65rem] font-semibold text-white ring-2 ring-white"
            data-testid="cart-count"
          >
            {ready ? count : 0}
          </span>
        </span>
        <span className="hidden text-xs font-medium sm:block">Handlekurv</span>
      </button>
    </div>
  );
}
