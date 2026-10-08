import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/env";

let client: ReturnType<typeof createSupabaseClient> | null = null;

/**
 * Anonym klient uten cookies for offentlige katalogdata.
 * Gjør det mulig å cache katalogsider (ISR) – RLS begrenser til publisert innhold.
 */
export function createPublicClient() {
  if (!isSupabaseConfigured()) throw new Error("Supabase er ikke konfigurert.");
  if (!client) {
    client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
