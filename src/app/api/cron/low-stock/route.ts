import { NextResponse } from "next/server";
import { integrations } from "@/lib/env";
import { isAuthorizedCron } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { emails } from "@/lib/email/templates";

/** Daglig varsel til administrator om varianter under minimumsbeholdning. */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  if (!integrations.supabaseAdmin()) return NextResponse.json({ skipped: "database ikke konfigurert" });
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  const { data } = await createAdminClient()
    .from("product_variants")
    .select("sku, name, stock_available, min_stock, product:products!inner(name, status)")
    .eq("is_active", true)
    .eq("product.status", "active");
  const low = ((data ?? []) as unknown as { sku: string; name: string; stock_available: number; min_stock: number; product: { name: string } }[])
    .filter((v) => v.stock_available <= v.min_stock)
    .map((v) => ({ sku: v.sku, name: `${v.product.name} – ${v.name}`, available: v.stock_available, min: v.min_stock }));
  if (low.length && to) await sendEmail({ to, template: "low_stock_admin", email: emails.lowStockAdmin(low) });
  return NextResponse.json({ low: low.length, notified: Boolean(low.length && to) });
}
