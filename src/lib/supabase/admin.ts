import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/env";

/**
 * Service role-klient. OMGÅR RLS – brukes KUN på serveren for operasjoner som
 * ordreopprettelse, webhooks og systemjobber, etter at tilgang er validert.
 * Skal aldri eksponeres til klienten.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY mangler – serveroperasjonen kan ikke utføres.");
  }
  return createSupabaseClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
