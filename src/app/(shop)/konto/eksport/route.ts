import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

/** Eksport av egne personopplysninger (GDPR art. 15/20). RLS sikrer at kun egne data hentes. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  const supabase = await createClient();
  const [profile, addresses, favorites, orders, returns, applications, invoices] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("addresses").select("*"),
    supabase.from("favorites").select("product_id, created_at"),
    supabase.from("orders").select("*, order_items(*), shipments(*)"),
    supabase.from("returns").select("*"),
    supabase.from("credit_applications").select("*"),
    supabase.from("invoices").select("*"),
  ]);
  await audit({ action: "account.data_export", actorId: user.id, actorEmail: user.email });
  const body = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at, last_sign_in_at: user.last_sign_in_at },
    profile: profile.data,
    addresses: addresses.data,
    favorites: favorites.data,
    orders: orders.data,
    returns: returns.data,
    credit_applications: applications.data,
    invoices: invoices.data,
  };
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="kunstner-pro-mine-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
