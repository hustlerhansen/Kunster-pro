"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { integrations, isSupabaseConfigured, siteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitByIp } from "@/lib/rate-limit";
import { fieldErrors, formDataToObject, passwordSchema, registerSchema } from "@/lib/validation";
import { sendEmail } from "@/lib/email/send";
import { emails } from "@/lib/email/templates";
import { audit } from "@/lib/audit";
import type { ActionState } from "./types";

const NOT_CONFIGURED: ActionState = {
  ok: false,
  message: "Innlogging er ikke tilgjengelig ennå – databasen (Supabase) er ikke koblet til.",
};

/** Tillat kun interne omdirigeringer (hindrer «open redirect»). */
function safeNext(value: FormDataEntryValue | null, fallback = "/konto"): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : fallback;
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!(await rateLimitByIp("login", 30, 600)) || !(await rateLimitByIp(`login:${email}`, 8, 600))) {
    return { ok: false, message: "For mange innloggingsforsøk. Vent noen minutter og prøv igjen." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: String(formData.get("password") ?? "") });
  if (error) {
    const unconfirmed = /confirm/i.test(error.message);
    return {
      ok: false,
      message: unconfirmed ? "E-postadressen er ikke bekreftet ennå. Sjekk innboksen din." : "Feil e-post eller passord.",
    };
  }
  redirect(safeNext(formData.get("neste")));
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  if (!(await rateLimitByIp("signup", 5, 3600))) {
    return { ok: false, message: "For mange registreringer fra denne adressen. Prøv igjen senere." };
  }
  const parsed = registerSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { ok: false, message: "Kontroller feltene som er markert.", fieldErrors: fieldErrors(parsed.error) };
  }
  const d = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: d.email,
    password: d.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?neste=/konto`,
      data: { full_name: d.full_name, phone: d.phone, marketing_consent: d.marketing_consent === "on" },
    },
  });
  if (error) {
    return { ok: false, message: /registered|exists/i.test(error.message) ? "Det finnes allerede en konto med denne e-postadressen." : "Registreringen feilet. Prøv igjen." };
  }
  const userId = data.user?.id;
  if (userId && integrations.supabaseAdmin()) {
    const admin = createAdminClient();
    await admin.from("addresses").insert({
      user_id: userId,
      label: "Hjem",
      full_name: d.full_name,
      line1: d.line1,
      postal_code: d.postal_code,
      city: d.city,
      phone: d.phone,
      is_default: true,
    });
    if (d.marketing_consent === "on") {
      await admin.from("newsletter_subscribers").upsert(
        {
          email: d.email,
          user_id: userId,
          status: "subscribed",
          consent_text: "Samtykke til nyhetsbrev og tilbud gitt ved registrering av kundekonto.",
          consent_source: "registrering",
          confirmed_at: new Date().toISOString(),
        },
        { onConflict: "email" },
      );
    }
  }
  await sendEmail({ to: d.email, template: "welcome", email: emails.welcome(d.full_name.split(" ")[0]) });
  await audit({ action: "account.created", actorId: userId, actorEmail: d.email, entityType: "user", entityId: userId });

  if (data.session) redirect("/konto");
  return { ok: true, message: "Kontoen er opprettet! Vi har sendt deg en e-post – klikk på lenken for å bekrefte e-postadressen." };
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  if (!email.success) return { ok: false, message: "Skriv inn en gyldig e-postadresse." };
  if (!(await rateLimitByIp("reset", 5, 3600))) return { ok: false, message: "For mange forsøk. Prøv igjen senere." };

  // Samme svar uansett om kontoen finnes – hindrer kartlegging av brukere.
  const generic: ActionState = { ok: true, message: "Hvis det finnes en konto for adressen, har vi sendt en e-post med lenke for å velge nytt passord." };

  if (integrations.supabaseAdmin() && integrations.resend()) {
    const { data, error } = await createAdminClient().auth.admin.generateLink({ type: "recovery", email: email.data });
    if (!error && data?.properties?.hashed_token) {
      const link = `${siteUrl}/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=recovery&neste=/tilbakestill-passord`;
      await sendEmail({ to: email.data, template: "password_reset", email: emails.passwordReset(link) });
    }
    return generic;
  }
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${siteUrl}/auth/callback?neste=/tilbakestill-passord` });
  return generic;
}

export async function updatePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const pw = passwordSchema.safeParse(formData.get("password"));
  if (!pw.success) return { ok: false, message: pw.error.issues[0].message };
  if (pw.data !== formData.get("password_confirm")) return { ok: false, message: "Passordene er ikke like." };
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { ok: false, message: "Lenken er utløpt. Be om en ny e-post for å tilbakestille passordet." };
  const { error } = await supabase.auth.updateUser({ password: pw.data });
  if (error) return { ok: false, message: "Kunne ikke oppdatere passordet. Prøv igjen." };
  await audit({ action: "account.password_changed", actorId: user.user.id, actorEmail: user.user.email });
  return { ok: true, message: "Passordet er oppdatert." };
}
