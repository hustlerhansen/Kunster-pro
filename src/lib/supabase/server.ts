import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/env";

/**
 * Supabase-klient for serverkomponenter, server actions og route handlers.
 * Bruker innlogget brukers sesjon (cookies) – RLS gjelder.
 */
export async function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase er ikke konfigurert (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).");
  }
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Kalt fra en serverkomponent – sesjonen fornyes i proxy.ts.
        }
      },
    },
  });
}
