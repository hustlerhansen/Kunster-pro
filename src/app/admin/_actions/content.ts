"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { integrations, siteUrl } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { emails } from "@/lib/email/templates";
import { esc } from "@/lib/email/layout";
import { slugify } from "@/lib/utils";
import type { ActionState } from "@/app/actions/types";
import { bool, dbError, fd, krToOre, optInt, optKrToOre, optStr, refreshCatalog, staffAction, uuid, zodFail } from "./util";

const optDate = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v ? new Date(v).toISOString() : null));
const optUuid = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : null));

// ------------------------------------------------------------------ Rabattkoder
export async function saveDiscountCode(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = fd(formData);
  const parsed = z
    .object({
      id: z.string().optional(),
      code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,40}$/, "Koden kan kun inneholde A–Z, 0–9, - og _ (3–40 tegn)"),
      description: optStr(200),
      type: z.enum(["percent", "fixed", "free_shipping"]),
      value: z.string().trim().optional(),
      min_order: krToOre,
      category_id: optUuid,
      starts_at: optDate,
      ends_at: optDate,
      max_uses: optInt,
      once_per_customer: bool,
      is_active: bool,
    })
    .safeParse(raw);
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  const n = Number((d.value ?? "0").replace(",", "."));
  const value = d.type === "percent" ? Math.round(n) : d.type === "fixed" ? Math.round(n * 100) : 0;
  if (d.type === "percent" && (value < 1 || value > 100)) return { ok: false, message: "Prosent må være 1–100." };
  if (d.type === "fixed" && value <= 0) return { ok: false, message: "Beløpet må være større enn 0." };
  if (d.starts_at && d.ends_at && d.ends_at <= d.starts_at) return { ok: false, message: "Sluttdato må være etter startdato." };
  const id = d.id && /^[0-9a-f-]{36}$/i.test(d.id) ? d.id : null;
  const row = {
    code: d.code,
    description: d.description,
    type: d.type,
    value,
    min_order_ore: d.min_order,
    category_id: d.category_id,
    starts_at: d.starts_at,
    ends_at: d.ends_at,
    max_uses: d.max_uses,
    once_per_customer: d.once_per_customer,
    is_active: d.is_active,
  };
  return staffAction<ActionState>({ action: id ? "discount_code.updated" : "discount_code.created", entityType: "discount_code" }, async ({ supabase }) => {
    const { error } = id ? await supabase.from("discount_codes").update(row).eq("id", id) : await supabase.from("discount_codes").insert(row);
    if (error) return { result: dbError("Kunne ikke lagre rabattkoden", error) };
    revalidatePath("/admin/kampanjer");
    return { result: { ok: true, message: "Rabattkoden er lagret." }, entityId: id, details: row };
  });
}

export async function saveVolumeDiscount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      id: z.string().optional(),
      name: z.string().trim().min(3).max(120),
      description: optStr(300),
      product_id: optUuid,
      category_id: optUuid,
      min_quantity: z.coerce.number().int().min(2, "Minst 2 stk"),
      percent_off: z.coerce.number().gt(0).lt(100),
      starts_at: optDate,
      ends_at: optDate,
      is_active: bool,
    })
    .safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  const { id, ...row } = parsed.data;
  if (!row.product_id && !row.category_id) return { ok: false, message: "Velg produkt eller kategori." };
  const validId = id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
  return staffAction<ActionState>({ action: "volume_discount.saved", entityType: "volume_discount" }, async ({ supabase }) => {
    const { error } = validId ? await supabase.from("volume_discounts").update(row).eq("id", validId) : await supabase.from("volume_discounts").insert(row);
    if (error) return { result: dbError("Kunne ikke lagre mengderabatten", error) };
    refreshCatalog("/admin/kampanjer", "/tilbud");
    return { result: { ok: true, message: "Mengderabatten er lagret." }, entityId: validId, details: row };
  });
}

export async function deleteVolumeDiscount(formData: FormData) {
  const id = String(formData.get("id"));
  if (!uuid.safeParse(id).success) return;
  await staffAction({ action: "volume_discount.deleted", entityType: "volume_discount" }, async ({ supabase }) => {
    await supabase.from("volume_discounts").delete().eq("id", id);
    return { result: null, entityId: id };
  });
  refreshCatalog("/admin/kampanjer");
}

// ------------------------------------------------------------------ Artikler
export async function saveArticle(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      id: z.string().optional(),
      title: z.string().trim().min(5).max(160),
      slug: z.string().trim().max(80).optional(),
      excerpt: optStr(300),
      body: z.string().max(50000),
      cover_image_url: optStr(500),
      author_name: optStr(80),
      reading_minutes: optInt,
      related_products: z.string().optional(),
      related_category_slugs: z.string().optional(),
      seo_title: optStr(70),
      seo_description: optStr(170),
      status: z.enum(["draft", "published"]),
    })
    .safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  const { id, related_products, related_category_slugs, slug, ...rest } = parsed.data;
  const validId = id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
  const row = {
    ...rest,
    slug: slugify(slug || rest.title),
    reading_minutes: rest.reading_minutes ?? Math.max(1, Math.round(rest.body.split(/\s+/).length / 200)),
    related_product_ids: (related_products ?? "").split(",").map((s) => s.trim()).filter((s) => /^[0-9a-f-]{36}$/i.test(s)),
    related_category_slugs: (related_category_slugs ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  };
  const res = await staffAction({ action: validId ? "article.updated" : "article.created", entityType: "article" }, async ({ supabase }) => {
    let publishedAt: string | null | undefined;
    if (row.status === "published") {
      const { data: existing } = validId ? await supabase.from("articles").select("published_at").eq("id", validId).maybeSingle() : { data: null };
      publishedAt = existing?.published_at ?? new Date().toISOString();
    }
    const payload = { ...row, ...(publishedAt ? { published_at: publishedAt } : {}) };
    const q = validId
      ? await supabase.from("articles").update(payload).eq("id", validId).select("id").single()
      : await supabase.from("articles").insert(payload).select("id").single();
    return { result: q, entityId: q.data?.id ?? validId, details: { title: row.title, status: row.status } };
  });
  if (res.error) return dbError("Kunne ikke lagre artikkelen", res.error);
  revalidateTag("articles", "max");
  revalidatePath(`/kunstnerguide/${row.slug}`);
  revalidatePath("/kunstnerguide");
  if (!validId) redirect(`/admin/artikler/${res.data.id}`);
  return { ok: true, message: "Artikkelen er lagret." };
}

export async function deleteArticle(formData: FormData) {
  const id = String(formData.get("id"));
  if (!uuid.safeParse(id).success) return;
  await staffAction({ action: "article.deleted", entityType: "article" }, async ({ supabase }) => {
    await supabase.from("articles").delete().eq("id", id);
    return { result: null, entityId: id };
  });
  revalidateTag("articles", "max");
  redirect("/admin/artikler");
}

// ------------------------------------------------------------------ Nyhetsbrev / e-postkampanjer
export async function saveEmailCampaign(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({ id: z.string().optional(), subject: z.string().trim().min(3).max(150), preheader: optStr(150), body_markdown: z.string().trim().min(10).max(20000) })
    .safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  const { id, ...row } = parsed.data;
  const validId = id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
  return staffAction<ActionState>({ action: "email_campaign.saved", entityType: "email_campaign" }, async ({ supabase, userId }) => {
    const { error } = validId
      ? await supabase.from("email_campaigns").update(row).eq("id", validId).eq("status", "draft")
      : await supabase.from("email_campaigns").insert({ ...row, created_by: userId });
    if (error) return { result: dbError("Kunne ikke lagre kampanjen", error) };
    revalidatePath("/admin/nyhetsbrev");
    return { result: { ok: true, message: "Kampanjen er lagret som utkast." }, entityId: validId };
  });
}

/** Enkel, trygg markdown → HTML for e-post (avsnitt, fet, lenker). */
function markdownToEmailHtml(md: string): string {
  return md
    .split(/\n{2,}/)
    .map((block) => {
      let html = esc(block.trim()).replace(/\n/g, "<br>");
      html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g, (_m, text, href) => {
        const url = href.startsWith("/") ? `${siteUrl}${href}` : href;
        return `<a href="${url}" style="color:#111">${text}</a>`;
      });
      if (/^#{1,3}\s/.test(block.trim())) return `<h2 style="font-family:Georgia,serif;font-size:20px;margin:24px 0 8px">${html.replace(/^#{1,3}\s/, "")}</h2>`;
      return `<p style="margin:0 0 14px">${html}</p>`;
    })
    .join("");
}

/** Sender kampanje KUN til abonnenter med bekreftet samtykke (status «subscribed»). */
export async function sendEmailCampaign(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get("id"));
  const testOnly = formData.get("test") === "1";
  if (!uuid.safeParse(id).success) return { ok: false, message: "Ugyldig kampanje" };
  if (!integrations.resend()) return { ok: false, message: "Resend er ikke konfigurert (RESEND_API_KEY / EMAIL_FROM)." };

  return staffAction<ActionState>({ action: testOnly ? "email_campaign.test_sent" : "email_campaign.sent", adminOnly: !testOnly, entityType: "email_campaign" }, async ({ supabase, email }) => {
    const { data: campaign } = await supabase.from("email_campaigns").select("*").eq("id", id).single();
    if (!campaign) return { result: { ok: false, message: "Fant ikke kampanjen." } };
    const html = markdownToEmailHtml(campaign.body_markdown);

    if (testOnly) {
      if (!email) return { result: { ok: false, message: "Mangler e-postadresse for test." } };
      await sendEmail({ to: email, template: "campaign_test", email: emails.campaign({ subject: `[TEST] ${campaign.subject}`, preheader: campaign.preheader, html, unsubscribeUrl: `${siteUrl}/nyhetsbrev/avmeld` }) });
      return { result: { ok: true, message: `Testutsendelse sendt til ${email}.` }, entityId: id };
    }
    if (campaign.status !== "draft") return { result: { ok: false, message: "Kampanjen er allerede sendt." } };

    const admin = createAdminClient();
    await admin.from("email_campaigns").update({ status: "sending" }).eq("id", id);
    const { data: subscribers } = await admin.from("newsletter_subscribers").select("email, unsubscribe_token").eq("status", "subscribed").limit(5000);
    let sent = 0;
    for (const s of subscribers ?? []) {
      const r = await sendEmail({
        to: s.email,
        template: "campaign",
        email: emails.campaign({ subject: campaign.subject, preheader: campaign.preheader, html, unsubscribeUrl: `${siteUrl}/nyhetsbrev/avmeld?token=${s.unsubscribe_token}` }),
      });
      if (r.ok) sent++;
    }
    await admin.from("email_campaigns").update({ status: "sent", sent_count: sent, sent_at: new Date().toISOString() }).eq("id", id);
    revalidatePath("/admin/nyhetsbrev");
    return { result: { ok: true, message: `Kampanjen er sendt til ${sent} abonnenter.` }, entityId: id, details: { sent } };
  });
}

// ------------------------------------------------------------------ Frakt
export async function saveShippingMethod(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      id: z.string().optional(),
      code: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,40}$/, "Kode: a–z, 0–9 og bindestrek"),
      name: z.string().trim().min(2).max(80),
      description: optStr(300),
      carrier: z.enum(["bring", "postnord", "helthjem", "own", "other"]),
      type: z.enum(["home", "pickup", "business"]),
      price: krToOre,
      free_threshold: optKrToOre,
      delivery_estimate: optStr(80),
      max_weight_g: optInt,
      requires_business: bool,
      is_active: bool,
      sort_order: optInt,
    })
    .safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  const { id, price, free_threshold, sort_order, ...rest } = parsed.data;
  const row = { ...rest, price_ore: price, free_threshold_ore: free_threshold, sort_order: sort_order ?? 0 };
  const validId = id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
  return staffAction<ActionState>({ action: "shipping_method.saved", adminOnly: true, entityType: "shipping_method" }, async ({ supabase }) => {
    const { error } = validId ? await supabase.from("shipping_methods").update(row).eq("id", validId) : await supabase.from("shipping_methods").insert(row);
    if (error) return { result: dbError("Kunne ikke lagre fraktmetoden", error) };
    refreshCatalog("/admin/frakt");
    revalidateTag("settings", "max");
    return { result: { ok: true, message: "Fraktmetoden er lagret." }, entityId: validId, details: row };
  });
}

// ------------------------------------------------------------------ Innstillinger
const BANNER_ICONS = ["truck", "gift", "star", "card", "headset", "map", "shield"] as const;

export async function saveSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = fd(formData);
  const section = raw.section;
  let value: Record<string, unknown>;
  switch (section) {
    case "store":
      value = {
        name: raw.name?.trim() || "Kunstner Pro",
        tagline: raw.tagline?.trim() || "Oljemaling & Kunstmateriell",
        main_message: raw.main_message?.trim() || "",
        support_email: raw.support_email?.trim() || null,
        support_phone: raw.support_phone?.trim() || null,
        support_hours: raw.support_hours?.trim() || null,
      };
      break;
    case "delivery": {
      const show = raw.show_delivery_time === "on";
      if (show && raw.logistics_confirmed !== "on") {
        return { ok: false, message: "Bekreft at leveringstiden er dokumentert av logistikkpartner før den vises." };
      }
      value = {
        show_delivery_time: show,
        delivery_time_text: raw.delivery_time_text?.trim() || null,
        dispatch_text: raw.dispatch_text?.trim() || null,
        free_shipping_threshold_ore: raw.free_shipping_threshold ? Math.round(Number(raw.free_shipping_threshold.replace(",", ".")) * 100) : null,
      };
      break;
    }
    case "banner": {
      const items = [0, 1, 2, 3, 4]
        .map((i) => ({
          icon: (BANNER_ICONS as readonly string[]).includes(raw[`icon_${i}`]) ? raw[`icon_${i}`] : "star",
          text: (raw[`text_${i}`] ?? "").trim().slice(0, 60),
          href: (raw[`href_${i}`] ?? "").trim().startsWith("/") ? raw[`href_${i}`].trim() : null,
        }))
        .filter((i) => i.text);
      value = { items };
      break;
    }
    case "payments":
      if (raw.invoice_enabled === "on" && !integrations.businessInvoice()) {
        return { ok: false, message: "Faktura kan ikke aktiveres før FEATURE_BUSINESS_INVOICE=true er satt (krever juridisk/økonomisk avklaring)." };
      }
      if (raw.vipps_enabled === "on" && !integrations.vipps()) {
        return { ok: false, message: "Vipps kan ikke aktiveres før VIPPS_*-nøkler er satt og VIPPS_ENABLED=true." };
      }
      value = { card_enabled: raw.card_enabled === "on", vipps_enabled: raw.vipps_enabled === "on", invoice_enabled: raw.invoice_enabled === "on" };
      break;
    case "company": {
      const org = raw.org_number?.replace(/\s/g, "") || null;
      if (org && !/^\d{9}$/.test(org)) return { ok: false, message: "Organisasjonsnummer må ha 9 siffer." };
      value = {
        legal_name: raw.legal_name?.trim() || null,
        org_number: org,
        vat_registered: raw.vat_registered === "on",
        address: raw.address?.trim() || null,
        email: raw.email?.trim() || null,
        phone: raw.phone?.trim() || null,
      };
      break;
    }
    case "hero":
      value = { image_url: /^(https:\/\/|\/)/.test(raw.image_url ?? "") ? raw.image_url.trim() : null, image_alt: raw.image_alt?.trim() || null };
      break;
    default:
      return { ok: false, message: "Ukjent seksjon." };
  }
  return staffAction<ActionState>({ action: `settings.${section}_updated`, adminOnly: true, entityType: "settings" }, async ({ supabase, userId }) => {
    const { error } = await supabase.from("settings").upsert({ key: section, value, updated_by: userId, updated_at: new Date().toISOString() });
    if (error) return { result: dbError("Kunne ikke lagre innstillingene", error) };
    revalidateTag("settings", "max");
    revalidatePath("/", "layout");
    return { result: { ok: true, message: "Innstillingene er lagret." }, entityId: section, details: value };
  });
}
