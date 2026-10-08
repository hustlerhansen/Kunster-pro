"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/env";

let browserClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}
