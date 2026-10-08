import type { Metadata } from "next";
import { AccountNav } from "@/components/shop/account-nav";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { AuthCard } from "@/components/shop/auth-card";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Min side", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return <AuthCard title="Min side">Min side blir tilgjengelig når databasen er koblet til.</AuthCard>;
  }
  const { profile } = await requireUser("/konto");
  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-gold-dark uppercase">Min side</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Hei{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!</h1>
        </div>
        <form action={signOut}>
          <Button variant="outline" size="sm">
            Logg ut
          </Button>
        </form>
      </div>
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <AccountNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
