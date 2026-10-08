import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/shop/logo";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { signOut } from "@/app/actions/auth";

export const metadata: Metadata = { title: { default: "Administrasjon", template: "%s | Admin – Kunstner Pro" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="container-page max-w-2xl py-20">
        <Logo />
        <h1 className="mt-10 text-3xl font-semibold">Administrasjon</h1>
        <Alert variant="warning" className="mt-6">
          Adminpanelet krever at Supabase er koblet til (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY og SUPABASE_SERVICE_ROLE_KEY).
          Se <code>README.md</code> og <code>docs/MILJOVARIABLER.md</code>.
        </Alert>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/">Til butikken</Link>
        </Button>
      </div>
    );
  }
  const { profile } = await requireStaff();
  return (
    <div className="flex min-h-dvh bg-[#F4F2EE]">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col overflow-y-auto bg-ink px-3 py-5 lg:flex">
        <div className="px-3">
          <Logo inverted className="scale-90 origin-left" />
        </div>
        <div className="mt-8 flex-1">
          <AdminNav />
        </div>
        <div className="mt-6 border-t border-white/10 px-3 pt-4 text-xs text-white/60">
          <p className="truncate">{profile.email}</p>
          <p className="capitalize">{profile.role === "admin" ? "Administrator" : "Ansatt"}</p>
          <div className="mt-3 flex gap-3">
            <Link href="/" className="hover:text-gold">
              Butikken
            </Link>
            <form action={signOut}>
              <button className="hover:text-gold">Logg ut</button>
            </form>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between border-b bg-ink px-4 py-3 lg:hidden">
          <Logo inverted className="scale-75 origin-left" />
          <details className="relative">
            <summary className="cursor-pointer text-sm text-white">Meny</summary>
            <div className="absolute right-0 z-50 mt-2 max-h-[80vh] w-64 overflow-y-auto rounded-md bg-ink p-3 shadow-xl">
              <AdminNav />
            </div>
          </details>
        </div>
        <main className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
