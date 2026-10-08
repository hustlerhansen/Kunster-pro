"use client";

import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}
