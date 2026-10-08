"use server";

import { z } from "zod";
import { integrations } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { rateLimitByIp } from "@/lib/rate-limit";
import { businessSchema, fieldErrors, formDataToObject } from "@/lib/validation";
import { sendEmail } from "@/lib/email/send";
import { emails } from "@/lib/email/templates";
import { audit } from "@/lib/audit";
import type { ActionState } from "./types";

const applicationSchema = businessSchema.extend({
  requested_limit: z.coerce.number().int().min(1000, "Minste kredittramme er 1 000 kr").max(500000, "Kontakt oss for rammer over 500 000 kr"),
  expected_monthly: z.coerce.number().int().min(0).max(1000000).optional(),
  message: z.string().trim().max(2000).optional(),
  accept_terms: z.literal("on", { message: "Du må bekrefte vilkårene" }),
});

/**
 * Søknad om handlekonto (bedrift). Gir IKKE automatisk kreditt – søknaden behandles
 * manuelt av administrator etter nødvendige kontroller.
 */
export async function submitCreditApplication(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (formData.get("company_website")) return { ok: true, message: "Takk! Søknaden er mottatt." };
  if (!integrations.supabaseAdmin()) return { ok: false, message: "Søknad er ikke tilgjengelig ennå (database ikke tilkoblet)." };
  if (!(await rateLimitByIp("credit-application", 3, 3600))) return { ok: false, message: "For mange søknader. Prøv igjen senere." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Du må være innlogget for å søke om handlekonto." };

  const parsed = applicationSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, message: "Kontroller feltene som er markert.", fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const admin = createAdminClient();

  const { data: pending } = await admin
    .from("credit_applications")
    .select("id")
    .eq("org_number", d.org_number)
    .in("status", ["submitted", "under_review"])
    .limit(1);
  if (pending?.length) return { ok: false, message: "Det finnes allerede en søknad under behandling for dette organisasjonsnummeret." };

  const billing = { line1: d.billing_line1, postal_code: d.billing_postal_code, city: d.billing_city, country: "NO" };
  const delivery = d.delivery_line1 ? { line1: d.delivery_line1, postal_code: d.delivery_postal_code ?? "", city: d.delivery_city ?? "", country: "NO" } : null;

  const { data: app, error } = await admin
    .from("credit_applications")
    .insert({
      user_id: user.id,
      company_name: d.company_name,
      org_number: d.org_number,
      customer_category: d.customer_category,
      contact_name: d.contact_name,
      email: d.email,
      phone: d.phone,
      billing_address: billing,
      delivery_address: delivery,
      requested_limit_ore: d.requested_limit * 100,
      expected_monthly_ore: d.expected_monthly ? d.expected_monthly * 100 : null,
      message: d.message || null,
      terms_accepted: true,
    })
    .select("id")
    .single();
  if (error) return { ok: false, message: "Kunne ikke sende søknaden. Prøv igjen." };

  await sendEmail({ to: d.email, template: "credit_application_received", email: emails.creditApplicationReceived({ companyName: d.company_name, contactName: d.contact_name }) });
  if (process.env.ADMIN_NOTIFICATION_EMAIL) {
    await sendEmail({
      to: process.env.ADMIN_NOTIFICATION_EMAIL,
      template: "admin_new_credit_application",
      email: emails.deliveryUpdate({ orderNumber: "–", customerName: "administrator", status: "Ny søknad om handlekonto", message: `${d.company_name} (${d.org_number}) har søkt om handlekonto.` }),
    });
  }
  await audit({ action: "credit_application.submitted", actorId: user.id, actorEmail: user.email, entityType: "credit_application", entityId: app.id });
  return { ok: true, message: "Takk! Søknaden er mottatt og behandles manuelt. Du får svar på e-post, og kan følge status på Min side." };
}

/**
 * Registrering av bedriftskunde (uten kreditt). Kobler innlogget bruker til bedriften,
 * slik at bedriftslevering og ev. prisavtaler kan brukes. Fakturakjøp krever egen søknad.
 */
export async function registerBusiness(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!integrations.supabaseAdmin()) return { ok: false, message: "Registrering er ikke tilgjengelig ennå (database ikke tilkoblet)." };
  if (!(await rateLimitByIp("business-register", 5, 3600))) return { ok: false, message: "For mange forsøk. Prøv igjen senere." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Logg inn eller opprett en brukerkonto først." };
  const parsed = businessSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, message: "Kontroller feltene som er markert.", fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const admin = createAdminClient();

  const { data: existing } = await admin.from("companies").select("id").eq("org_number", d.org_number).maybeSingle();
  if (existing) {
    return { ok: false, message: "Bedriften er allerede registrert. Kontakt kundeservice for å bli lagt til som bruker." };
  }
  const { data: company, error } = await admin
    .from("companies")
    .insert({
      name: d.company_name,
      org_number: d.org_number,
      customer_category: d.customer_category,
      contact_name: d.contact_name,
      email: d.email,
      phone: d.phone,
      billing_address: { line1: d.billing_line1, postal_code: d.billing_postal_code, city: d.billing_city, country: "NO" },
      delivery_address: d.delivery_line1 ? { line1: d.delivery_line1, postal_code: d.delivery_postal_code, city: d.delivery_city, country: "NO" } : null,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) return { ok: false, message: "Kunne ikke registrere bedriften." };
  await admin.from("profiles").update({ company_id: company.id, customer_type: "business" }).eq("id", user.id);
  await audit({ action: "company.registered", actorId: user.id, actorEmail: user.email, entityType: "company", entityId: company.id });
  return { ok: true, message: "Bedriftskontoen er registrert! Du kan nå velge bedriftslevering i kassen. Søk om handlekonto for å handle på faktura." };
}
