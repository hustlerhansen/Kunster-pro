"use server";

import { z } from "zod";
import { integrations } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp, rateLimitByIp } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/send";
import { emails } from "@/lib/email/templates";
import { siteUrl } from "@/lib/env";
import type { ActionState } from "./types";

export type { ActionState };

const CONSENT_TEXT =
  "Ja, jeg samtykker til å motta nyhetsbrev og tilbud på e-post fra Kunstner Pro. Samtykket kan trekkes tilbake når som helst.";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Skriv inn en gyldig e-postadresse").max(200),
  consent: z.literal("on", { message: "Du må samtykke for å melde deg på" }),
  source: z.string().max(40).default("ukjent"),
});

/** Påmelding med dobbel bekreftelse (double opt-in), jf. markedsføringsloven § 15. */
export async function subscribeNewsletter(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (formData.get("company_website")) return { ok: true, message: "Takk! Sjekk e-posten din for å bekrefte." };
  if (!(await rateLimitByIp("newsletter", 5, 3600))) {
    return { ok: false, message: "For mange forsøk. Prøv igjen senere." };
  }
  const parsed = schema.safeParse({
    email: formData.get("email"),
    consent: formData.get("consent"),
    source: formData.get("source") ?? undefined,
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  if (!integrations.supabaseAdmin()) {
    return { ok: false, message: "Nyhetsbrevet er ikke aktivert ennå (database ikke tilkoblet)." };
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("newsletter_subscribers")
    .select("id, status, confirm_token")
    .eq("email", parsed.data.email)
    .maybeSingle();

  if (existing?.status === "subscribed") {
    return { ok: true, message: "Du er allerede påmeldt nyhetsbrevet." };
  }

  const token = crypto.randomUUID();
  const row = {
    email: parsed.data.email,
    status: "pending" as const,
    consent_text: CONSENT_TEXT,
    consent_source: parsed.data.source,
    consent_ip: await clientIp(),
    confirm_token: token,
  };
  const { error } = existing
    ? await admin.from("newsletter_subscribers").update(row).eq("id", existing.id)
    : await admin.from("newsletter_subscribers").insert(row);
  if (error) return { ok: false, message: "Noe gikk galt. Prøv igjen senere." };

  await sendEmail({
    to: parsed.data.email,
    template: "newsletter_confirm",
    email: emails.newsletterConfirm(`${siteUrl}/nyhetsbrev/bekreft?token=${token}`),
  });
  return { ok: true, message: "Takk! Sjekk e-posten din og bekreft påmeldingen." };
}
