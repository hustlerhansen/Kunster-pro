import "server-only";
import { headers } from "next/headers";
import { integrations } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

const memory = new Map<string, { start: number; count: number }>();

/**
 * Enkel rate limiting. Bruker Postgres (delt mellom serverinstanser) når service role er
 * konfigurert, ellers minnebasert fallback (per instans).
 */
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  if (integrations.supabaseAdmin()) {
    try {
      const { data, error } = await createAdminClient().rpc("check_rate_limit", {
        p_key: key,
        p_max: max,
        p_window_seconds: windowSeconds,
      });
      if (!error) return Boolean(data);
    } catch {
      // fall gjennom til minnebasert
    }
  }
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || now - entry.start > windowSeconds * 1000) {
    memory.set(key, { start: now, count: 1 });
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

export async function rateLimitByIp(action: string, max: number, windowSeconds: number) {
  const ip = await clientIp();
  return rateLimit(`${action}:${ip}`, max, windowSeconds);
}
