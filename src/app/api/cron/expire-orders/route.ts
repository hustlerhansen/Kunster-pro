import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { integrations } from "@/lib/env";
import { isAuthorizedCron } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";
import { CATALOG_TAG } from "@/lib/data/catalog";

/** Frigjør lager for ordre der betalingen aldri ble fullført. */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  if (!integrations.supabaseAdmin()) return NextResponse.json({ skipped: "database ikke konfigurert" });
  const { data, error } = await createAdminClient().rpc("expire_pending_orders");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data) revalidateTag(CATALOG_TAG, "max");
  return NextResponse.json({ released: data });
}
