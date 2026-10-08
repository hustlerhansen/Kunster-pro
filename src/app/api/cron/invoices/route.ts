import { NextResponse } from "next/server";
import { integrations } from "@/lib/env";
import { isAuthorizedCron } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";

/** Markerer forfalte fakturaer. */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  if (!integrations.supabaseAdmin()) return NextResponse.json({ skipped: "database ikke konfigurert" });
  const { data, error } = await createAdminClient().rpc("mark_overdue_invoices");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ overdue: data });
}
