"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { integrations } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { emails } from "@/lib/email/templates";
import type { ActionState } from "@/app/actions/types";
import { dbError, fd, krToOre, optStr, staffAction, uuid, zodFail } from "./util";

/**
 * Behandling av søknad om handlekonto. Godkjenning er en MANUELL beslutning etter
 * nødvendige kontroller (f.eks. Brønnøysund, kredittvurdering). Kreditt opprettes som
 * «Venter på aktivering» med mindre administrator eksplisitt aktiverer den.
 */
export async function reviewApplication(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      application_id: uuid,
      decision: z.enum(["under_review", "approved", "rejected"]),
      credit_limit: krToOre,
      payment_terms_days: z.coerce.number().int().min(0).max(90),
      activate: z.string().optional(),
      decision_note: optStr(1000),
      checks_confirmed: z.string().optional(),
    })
    .safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  if (d.decision === "approved" && d.checks_confirmed !== "on") {
    return { ok: false, message: "Bekreft at nødvendige kontroller er gjennomført før godkjenning." };
  }
  if (d.decision === "approved" && d.activate === "on" && !integrations.businessInvoice()) {
    return { ok: false, message: "Kreditt kan ikke aktiveres før FEATURE_BUSINESS_INVOICE=true er satt (krever avklarte juridiske/økonomiske krav)." };
  }

  return staffAction<ActionState>({ action: `credit_application.${d.decision}`, adminOnly: true, entityType: "credit_application" }, async ({ userId }) => {
    // Service role: oppretter bedrift og kobler brukerens profil (beskyttede felt)
    const admin = createAdminClient();
    const { data: app } = await admin.from("credit_applications").select("*").eq("id", d.application_id).single();
    if (!app) return { result: { ok: false, message: "Fant ikke søknaden." } };

    if (d.decision === "under_review") {
      await admin.from("credit_applications").update({ status: "under_review" }).eq("id", app.id);
      revalidatePath("/admin/handlekontoer");
      return { result: { ok: true, message: "Søknaden er satt til «Under behandling»." }, entityId: app.id };
    }

    let companyId = app.company_id as string | null;
    if (d.decision === "approved") {
      if (!companyId) {
        const { data: existing } = await admin.from("companies").select("id").eq("org_number", app.org_number).maybeSingle();
        if (existing) companyId = existing.id;
        else {
          const { data: created, error } = await admin
            .from("companies")
            .insert({
              name: app.company_name,
              org_number: app.org_number,
              customer_category: app.customer_category,
              contact_name: app.contact_name,
              email: app.email,
              phone: app.phone,
              billing_address: app.billing_address,
              delivery_address: app.delivery_address,
              created_by: userId,
            })
            .select("id")
            .single();
          if (error) return { result: dbError("Kunne ikke opprette bedrift", error) };
          companyId = created.id;
        }
      }
      if (app.user_id) await admin.from("profiles").update({ company_id: companyId, customer_type: "business" }).eq("id", app.user_id);
      const { error: caErr } = await admin.from("credit_accounts").upsert(
        {
          company_id: companyId,
          status: d.activate === "on" ? "active" : "pending",
          credit_limit_ore: d.credit_limit,
          payment_terms_days: d.payment_terms_days,
          approved_by: userId,
          approved_at: new Date().toISOString(),
          notes: d.decision_note,
        },
        { onConflict: "company_id" },
      );
      if (caErr) return { result: dbError("Kunne ikke opprette kredittkonto", caErr) };
    }

    await admin
      .from("credit_applications")
      .update({ status: d.decision, company_id: companyId, decision_note: d.decision_note, reviewed_by: userId, reviewed_at: new Date().toISOString() })
      .eq("id", app.id);

    await sendEmail({
      to: app.email,
      template: "credit_application_decision",
      email: emails.creditApplicationDecision({
        companyName: app.company_name,
        contactName: app.contact_name,
        approved: d.decision === "approved",
        limitOre: d.decision === "approved" && d.activate === "on" ? d.credit_limit : null,
        termsDays: d.decision === "approved" && d.activate === "on" ? d.payment_terms_days : null,
        note:
          d.decision === "approved" && d.activate !== "on"
            ? "Bedriftskontoen er opprettet. Fakturakjøp aktiveres når alle vilkår er på plass – vi gir beskjed."
            : d.decision_note,
      }),
    });
    revalidatePath("/admin/handlekontoer");
    return {
      result: { ok: true, message: d.decision === "approved" ? "Søknaden er godkjent." : "Søknaden er avslått." },
      entityId: app.id,
      details: { company_id: companyId, credit_limit_ore: d.credit_limit, activated: d.activate === "on" },
    };
  });
}

export async function updateCreditAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      account_id: uuid,
      status: z.enum(["pending", "active", "suspended", "closed"]),
      credit_limit: krToOre,
      payment_terms_days: z.coerce.number().int().min(0).max(90),
      notes: optStr(1000),
    })
    .safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  if (d.status === "active" && !integrations.businessInvoice()) {
    return { ok: false, message: "Kreditt kan ikke aktiveres før FEATURE_BUSINESS_INVOICE=true er satt." };
  }
  return staffAction<ActionState>({ action: "credit_account.updated", adminOnly: true, entityType: "credit_account" }, async ({ supabase }) => {
    const { error } = await supabase
      .from("credit_accounts")
      .update({ status: d.status, credit_limit_ore: d.credit_limit, payment_terms_days: d.payment_terms_days, notes: d.notes })
      .eq("id", d.account_id);
    if (error) return { result: dbError("Kunne ikke oppdatere", error) };
    revalidatePath("/admin/handlekontoer");
    return { result: { ok: true, message: "Kredittkontoen er oppdatert." }, entityId: d.account_id, details: { status: d.status, limit: d.credit_limit } };
  });
}

export async function registerInvoicePayment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z.object({ invoice_id: uuid, amount: krToOre, reference: optStr(100) }).safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  if (d.amount <= 0) return { ok: false, message: "Beløpet må være større enn 0." };
  return staffAction<ActionState>({ action: "invoice.payment_registered", adminOnly: true, entityType: "invoice" }, async ({ supabase }) => {
    const { data, error } = await supabase.rpc("register_invoice_payment", { p_invoice_id: d.invoice_id, p_amount_ore: d.amount, p_reference: d.reference });
    if (error) return { result: dbError("Kunne ikke registrere betaling", error) };
    if (data === "paid") {
      const { data: inv } = await supabase.from("invoices").select("invoice_number, amount_ore, company:companies(name, email, contact_name)").eq("id", d.invoice_id).single();
      const company = inv?.company as unknown as { name: string; email: string | null; contact_name: string | null } | null;
      if (company?.email)
        await sendEmail({
          to: company.email,
          template: "payment_confirmation",
          email: emails.paymentConfirmation({ orderNumber: `faktura ${inv!.invoice_number}`, customerName: company.contact_name ?? company.name, totalOre: inv!.amount_ore, provider: "bankoverføring" }),
        });
    }
    revalidatePath("/admin/fakturaer");
    revalidatePath("/admin/handlekontoer");
    return { result: { ok: true, message: data === "paid" ? "Fakturaen er betalt." : "Delbetaling registrert." }, entityId: d.invoice_id, details: { amount: d.amount } };
  });
}

// ------------------------------------------------------------------ Prisgrupper
export async function savePriceGroup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({ id: z.string().optional(), name: z.string().trim().min(2).max(80), description: optStr(300), discount_percent: z.coerce.number().min(0).max(100), is_active: z.string().optional() })
    .safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  const { id, is_active, ...rest } = parsed.data;
  const validId = id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
  return staffAction<ActionState>({ action: "price_group.saved", adminOnly: true, entityType: "price_group" }, async ({ supabase }) => {
    const row = { ...rest, is_active: is_active === "on" };
    const { error } = validId ? await supabase.from("price_groups").update(row).eq("id", validId) : await supabase.from("price_groups").insert(row);
    if (error) return { result: dbError("Kunne ikke lagre prisgruppen", error) };
    revalidatePath("/admin/prisgrupper");
    return { result: { ok: true, message: "Prisgruppen er lagret." }, entityId: validId, details: row };
  });
}

export async function setPriceGroupPrice(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z.object({ price_group_id: uuid, variant_id: uuid, price: z.string().trim() }).safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  return staffAction<ActionState>({ action: "price_group.price_set", adminOnly: true, entityType: "price_group" }, async ({ supabase }) => {
    if (!d.price) {
      await supabase.from("price_group_prices").delete().eq("price_group_id", d.price_group_id).eq("variant_id", d.variant_id);
    } else {
      const ore = Math.round(Number(d.price.replace(",", ".")) * 100);
      if (!Number.isFinite(ore) || ore < 0) return { result: { ok: false, message: "Ugyldig pris" } };
      const { error } = await supabase.from("price_group_prices").upsert({ price_group_id: d.price_group_id, variant_id: d.variant_id, price_ore: ore });
      if (error) return { result: dbError("Kunne ikke lagre pris", error) };
    }
    revalidatePath(`/admin/prisgrupper/${d.price_group_id}`);
    return { result: { ok: true, message: "Pris lagret." }, entityId: d.price_group_id };
  });
}

export async function setCompanyPriceGroup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({ company_id: uuid, price_group_id: z.string().optional().transform((v) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : null)), status: z.enum(["active", "blocked"]) })
    .safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  return staffAction<ActionState>({ action: "company.updated", adminOnly: true, entityType: "company" }, async ({ supabase }) => {
    const { error } = await supabase.from("companies").update({ price_group_id: parsed.data.price_group_id, status: parsed.data.status }).eq("id", parsed.data.company_id);
    if (error) return { result: dbError("Kunne ikke oppdatere bedriften", error) };
    revalidatePath("/admin/handlekontoer");
    return { result: { ok: true, message: "Bedriften er oppdatert." }, entityId: parsed.data.company_id, details: parsed.data };
  });
}
