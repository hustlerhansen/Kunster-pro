import "server-only";
import { Resend } from "resend";
import { integrations } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RenderedEmail } from "./templates";

let resend: Resend | null = null;

/**
 * Sender e-post via Resend. Uten RESEND_API_KEY logges e-posten som «skipped»
 * (ingenting sendes), slik at flyten kan testes uten nøkler.
 */
export async function sendEmail(opts: {
  to: string;
  template: string;
  email: RenderedEmail;
  orderId?: string | null;
  replyTo?: string;
}): Promise<{ ok: boolean; skipped?: boolean; id?: string; error?: string }> {
  let result: { ok: boolean; skipped?: boolean; id?: string; error?: string };
  if (!integrations.resend()) {
    console.info(`[e-post] (ikke sendt – RESEND_API_KEY mangler) ${opts.template} → ${opts.to}: ${opts.email.subject}`);
    result = { ok: true, skipped: true };
  } else {
    try {
      resend ??= new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: opts.to,
        subject: opts.email.subject,
        html: opts.email.html,
        text: opts.email.text,
        replyTo: opts.replyTo ?? process.env.EMAIL_REPLY_TO ?? undefined,
      });
      result = error ? { ok: false, error: error.message } : { ok: true, id: data?.id };
    } catch (err) {
      result = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  if (integrations.supabaseAdmin()) {
    try {
      await createAdminClient()
        .from("email_log")
        .insert({
          to_email: opts.to,
          template: opts.template,
          subject: opts.email.subject,
          status: result.skipped ? "skipped" : result.ok ? "sent" : "failed",
          provider_message_id: result.id ?? null,
          error: result.error ?? null,
          order_id: opts.orderId ?? null,
        });
    } catch {
      // logging skal aldri stoppe en bestilling
    }
  }
  if (!result.ok) console.error(`[e-post] feilet ${opts.template} → ${opts.to}: ${result.error}`);
  return result;
}
