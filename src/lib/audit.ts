import "server-only";
import { integrations } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp } from "@/lib/rate-limit";

/** Logger kritiske hendelser (admin-endringer, betaling, kreditt, sletting av konto). */
export async function audit(entry: {
  action: string;
  actorId?: string | null;
  actorEmail?: string | null;
  entityType?: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
}) {
  const line = { ...entry, at: new Date().toISOString() };
  if (!integrations.supabaseAdmin()) {
    console.info("[audit]", JSON.stringify(line));
    return;
  }
  try {
    let ip: string | null = null;
    try {
      ip = await clientIp();
    } catch {
      ip = null; // utenfor forespørsel (f.eks. webhook-bakgrunn)
    }
    await createAdminClient()
      .from("audit_log")
      .insert({
        action: entry.action,
        actor_id: entry.actorId ?? null,
        actor_email: entry.actorEmail ?? null,
        entity_type: entry.entityType ?? null,
        entity_id: entry.entityId ?? null,
        details: entry.details ?? {},
        ip,
      });
  } catch (err) {
    console.error("[audit] kunne ikke logge", err, line);
  }
}
