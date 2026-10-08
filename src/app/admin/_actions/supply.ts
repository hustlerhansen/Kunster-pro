"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Papa from "papaparse";
import { z } from "zod";
import type { ActionState } from "@/app/actions/types";
import { bool, dbError, fd, int, krToOre, num, optInt, optStr, refreshCatalog, staffAction, uuid, zodFail } from "./util";

// ------------------------------------------------------------------ Leverandører
const supplierSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Navn mangler").max(160),
  contact_name: optStr(120),
  email: z.string().trim().email("Ugyldig e-post").optional().or(z.literal("")).transform((v) => v || null),
  phone: optStr(40),
  website: z.string().trim().url("Ugyldig nettadresse").optional().or(z.literal("")).transform((v) => v || null),
  country: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "Land må være landkode (f.eks. NO, DE, CN)"),
  region: z.enum(["NO", "EU", "CN", "OTHER"]),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Valuta må være tre bokstaver"),
  lead_time_days: optInt,
  min_order_value: z.string().optional().transform((v) => (v ? Number(v.replace(",", ".")) : null)),
  payment_terms: optStr(120),
  notes: optStr(2000),
  is_active: bool,
});

export async function saveSupplier(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = supplierSchema.safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  const { id, ...row } = parsed.data;
  const validId = id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
  const res = await staffAction({ action: validId ? "supplier.updated" : "supplier.created", entityType: "supplier" }, async ({ supabase }) => {
    const q = validId
      ? await supabase.from("suppliers").update(row).eq("id", validId).select("id").single()
      : await supabase.from("suppliers").insert(row).select("id").single();
    return { result: q, entityId: q.data?.id ?? validId, details: { name: row.name } };
  });
  if (res.error) return dbError("Kunne ikke lagre leverandøren", res.error);
  revalidatePath("/admin/suppliers");
  if (!validId) redirect(`/admin/suppliers/${res.data.id}`);
  return { ok: true, message: "Leverandøren er lagret." };
}

export async function saveSupplierProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      supplier_id: uuid,
      variant_id: uuid,
      supplier_sku: optStr(80),
      purchase_price: num.refine((v) => v >= 0, "Ugyldig pris"),
      currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
      min_order_quantity: int.refine((v) => v > 0, "Må være minst 1"),
      is_preferred: bool,
    })
    .safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  return staffAction<ActionState>({ action: "supplier_product.saved", entityType: "supplier" }, async ({ supabase }) => {
    if (parsed.data.is_preferred) await supabase.from("supplier_products").update({ is_preferred: false }).eq("variant_id", parsed.data.variant_id);
    const { error } = await supabase.from("supplier_products").upsert(parsed.data, { onConflict: "supplier_id,variant_id" });
    if (error) return { result: dbError("Kunne ikke lagre", error) };
    revalidatePath(`/admin/suppliers/${parsed.data.supplier_id}`);
    return { result: { ok: true, message: "Innkjøpspris lagret (historikk oppdateres automatisk)." }, entityId: parsed.data.supplier_id, details: parsed.data };
  });
}

/**
 * CSV-import av leverandørpriser. Kolonner: sku;leverandor_sku;innkjopspris;valuta;minimum
 * (semikolon eller komma). Kun data du har rett til å bruke – ingen scraping.
 */
export async function importSupplierProductsCsv(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supplierId = String(formData.get("supplier_id"));
  const file = formData.get("file");
  if (!uuid.safeParse(supplierId).success) return { ok: false, message: "Ugyldig leverandør" };
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Velg en CSV-fil." };
  if (file.size > 2 * 1024 * 1024) return { ok: false, message: "Filen er for stor (maks 2 MB)." };
  const text = await file.text();
  const parsedCsv = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim().toLowerCase() });
  if (parsedCsv.errors.length) return { ok: false, message: `CSV-feil: ${parsedCsv.errors[0].message}` };

  return staffAction<ActionState>({ action: "supplier_product.csv_import", entityType: "supplier" }, async ({ supabase }) => {
    const { data: supplier } = await supabase.from("suppliers").select("currency").eq("id", supplierId).single();
    const skus = parsedCsv.data.map((r) => (r.sku ?? "").trim().toUpperCase()).filter(Boolean);
    const { data: variants } = await supabase.from("product_variants").select("id, sku").in("sku", skus);
    const bySku = new Map((variants ?? []).map((v) => [v.sku.toUpperCase(), v.id]));
    const rows: Record<string, unknown>[] = [];
    const errors: string[] = [];
    parsedCsv.data.forEach((r, i) => {
      const sku = (r.sku ?? "").trim().toUpperCase();
      const variantId = bySku.get(sku);
      const price = Number((r.innkjopspris ?? r.pris ?? "").replace(",", "."));
      if (!variantId) return errors.push(`Linje ${i + 2}: ukjent SKU «${sku}»`);
      if (!Number.isFinite(price) || price < 0) return errors.push(`Linje ${i + 2}: ugyldig pris`);
      rows.push({
        supplier_id: supplierId,
        variant_id: variantId,
        supplier_sku: (r.leverandor_sku ?? "").trim() || null,
        purchase_price: price,
        currency: ((r.valuta ?? supplier?.currency ?? "NOK").trim().toUpperCase() || "NOK").slice(0, 3),
        min_order_quantity: Math.max(1, parseInt(r.minimum ?? "1", 10) || 1),
      });
    });
    if (rows.length) {
      const { error } = await supabase.from("supplier_products").upsert(rows, { onConflict: "supplier_id,variant_id" });
      if (error) return { result: dbError("Import feilet", error) };
    }
    revalidatePath(`/admin/suppliers/${supplierId}`);
    return {
      result: { ok: errors.length === 0, message: `Importerte ${rows.length} linjer.${errors.length ? ` ${errors.length} feil: ${errors.slice(0, 3).join("; ")}` : ""}` },
      entityId: supplierId,
      details: { imported: rows.length, errors: errors.length },
    };
  });
}

/** CSV-import av leverandører. Kolonner: navn;kontaktperson;epost;telefon;nettsted;land;region;valuta;leveringstid */
export async function importSuppliersCsv(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Velg en CSV-fil." };
  if (file.size > 2 * 1024 * 1024) return { ok: false, message: "Filen er for stor (maks 2 MB)." };
  const parsedCsv = Papa.parse<Record<string, string>>(await file.text(), { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim().toLowerCase() });
  if (parsedCsv.errors.length) return { ok: false, message: `CSV-feil: ${parsedCsv.errors[0].message}` };
  const rows = parsedCsv.data
    .map((r) => ({
      name: (r.navn ?? "").trim(),
      contact_name: r.kontaktperson?.trim() || null,
      email: r.epost?.trim() || null,
      phone: r.telefon?.trim() || null,
      website: r.nettsted?.trim() || null,
      country: (r.land ?? "NO").trim().toUpperCase().slice(0, 2),
      region: ["NO", "EU", "CN", "OTHER"].includes((r.region ?? "").trim().toUpperCase()) ? r.region.trim().toUpperCase() : "OTHER",
      currency: (r.valuta ?? "NOK").trim().toUpperCase().slice(0, 3),
      lead_time_days: r.leveringstid ? parseInt(r.leveringstid, 10) || null : null,
    }))
    .filter((r) => r.name.length >= 2);
  return staffAction<ActionState>({ action: "supplier.csv_import", entityType: "supplier" }, async ({ supabase }) => {
    const { error } = await supabase.from("suppliers").insert(rows);
    if (error) return { result: dbError("Import feilet", error) };
    revalidatePath("/admin/suppliers");
    return { result: { ok: true, message: `Importerte ${rows.length} leverandører.` }, details: { count: rows.length } };
  });
}

// ------------------------------------------------------------------ Innkjøpsordrer
export async function createPurchaseOrder(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z.object({ supplier_id: uuid }).safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  const res = await staffAction({ action: "purchase_order.created", entityType: "purchase_order" }, async ({ supabase, userId }) => {
    const { data: supplier } = await supabase.from("suppliers").select("currency, lead_time_days").eq("id", parsed.data.supplier_id).single();
    const expected = supplier?.lead_time_days ? new Date(Date.now() + supplier.lead_time_days * 86400000).toISOString().slice(0, 10) : null;
    const q = await supabase
      .from("purchase_orders")
      .insert({ supplier_id: parsed.data.supplier_id, currency: supplier?.currency ?? "NOK", expected_at: expected, created_by: userId })
      .select("id")
      .single();
    return { result: q, entityId: q.data?.id };
  });
  if (res.error) return dbError("Kunne ikke opprette innkjøpsordre", res.error);
  redirect(`/admin/innkjop/${res.data.id}`);
}

export async function updatePurchaseOrder(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      id: uuid,
      status: z.enum(["draft", "sent", "confirmed", "shipped", "cancelled"]),
      currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
      exchange_rate: num.refine((v) => v > 0, "Valutakurs må være over 0"),
      freight: krToOre,
      duty: krToOre,
      other: krToOre,
      expected_at: z.string().optional().transform((v) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)),
      notes: optStr(2000),
    })
    .safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  return staffAction<ActionState>({ action: "purchase_order.updated", entityType: "purchase_order" }, async ({ supabase }) => {
    const { data: current } = await supabase.from("purchase_orders").select("status").eq("id", d.id).single();
    if (current?.status === "received") return { result: { ok: false, message: "Mottatte innkjøpsordrer kan ikke endres." } };
    const { error } = await supabase
      .from("purchase_orders")
      .update({
        status: d.status,
        currency: d.currency,
        exchange_rate: d.exchange_rate,
        freight_cost_ore: d.freight,
        duty_cost_ore: d.duty,
        other_cost_ore: d.other,
        expected_at: d.expected_at,
        notes: d.notes,
        ...(d.status === "sent" && current?.status === "draft" ? { ordered_at: new Date().toISOString() } : {}),
      })
      .eq("id", d.id);
    if (error) return { result: dbError("Kunne ikke oppdatere", error) };
    revalidatePath(`/admin/innkjop/${d.id}`);
    return { result: { ok: true, message: "Innkjøpsordren er oppdatert." }, entityId: d.id, details: { status: d.status } };
  });
}

export async function addPurchaseOrderItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({ purchase_order_id: uuid, variant_id: uuid, quantity: int.refine((v) => v > 0, "Antall må være over 0"), unit_price: num.refine((v) => v >= 0, "Ugyldig pris") })
    .safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  return staffAction<ActionState>({ action: "purchase_order.item_added", entityType: "purchase_order" }, async ({ supabase }) => {
    const { data: po } = await supabase.from("purchase_orders").select("status").eq("id", parsed.data.purchase_order_id).single();
    if (po?.status !== "draft") return { result: { ok: false, message: "Linjer kan bare legges til i utkast." } };
    const { error } = await supabase.from("purchase_order_items").insert(parsed.data);
    if (error) return { result: dbError("Kunne ikke legge til linje", error) };
    revalidatePath(`/admin/innkjop/${parsed.data.purchase_order_id}`);
    return { result: { ok: true, message: "Linje lagt til." }, entityId: parsed.data.purchase_order_id };
  });
}

export async function removePurchaseOrderItem(formData: FormData) {
  const id = String(formData.get("id"));
  const poId = String(formData.get("purchase_order_id"));
  if (!uuid.safeParse(id).success) return;
  await staffAction({ action: "purchase_order.item_removed", entityType: "purchase_order" }, async ({ supabase }) => {
    const { data: po } = await supabase.from("purchase_orders").select("status").eq("id", poId).single();
    if (po?.status === "draft") await supabase.from("purchase_order_items").delete().eq("id", id);
    return { result: null, entityId: poId };
  });
  revalidatePath(`/admin/innkjop/${poId}`);
}

/** Varemottak: øker beholdning og oppdaterer landed cost (fordelte kostnader). */
export async function receivePurchaseOrder(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const poId = String(formData.get("purchase_order_id"));
  if (!uuid.safeParse(poId).success) return { ok: false, message: "Ugyldig innkjøpsordre" };
  const receipts: { item_id: string; quantity: number }[] = [];
  formData.forEach((v, k) => {
    if (k.startsWith("recv_") && typeof v === "string") {
      const q = parseInt(v, 10);
      if (q > 0) receipts.push({ item_id: k.slice(5), quantity: q });
    }
  });
  if (!receipts.length) return { ok: false, message: "Oppgi mottatt antall for minst én linje." };
  return staffAction<ActionState>({ action: "purchase_order.received", entityType: "purchase_order" }, async ({ supabase }) => {
    const { data, error } = await supabase.rpc("receive_purchase_order", { p_po_id: poId, p_receipts: receipts });
    if (error) {
      const msg = /RECEIVE_EXCEEDS/.test(error.message) ? "Mottatt antall overstiger bestilt antall." : /NOT_RECEIVABLE/.test(error.message) ? "Ordren må være sendt/bekreftet før varemottak." : error.message;
      return { result: { ok: false, message: `Varemottak feilet: ${msg}` } };
    }
    refreshCatalog(`/admin/innkjop/${poId}`, "/admin/lager");
    return { result: { ok: true, message: `${data} enheter er mottatt og lagt på lager. Landed cost er oppdatert.` }, entityId: poId, details: { receipts } };
  });
}

// ------------------------------------------------------------------ Lager
export async function adjustStock(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      variant_id: uuid,
      mode: z.enum(["delta", "count"]),
      value: int,
      reason: z.enum(["adjustment", "count", "damage", "initial", "return"]),
      note: optStr(300),
      current: int,
    })
    .safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  const change = d.mode === "count" ? d.value - d.current : d.value;
  if (change === 0) return { ok: false, message: "Ingen endring." };
  return staffAction<ActionState>({ action: "stock.adjusted", entityType: "variant" }, async ({ supabase }) => {
    const { data, error } = await supabase.rpc("adjust_stock", { p_variant_id: d.variant_id, p_change: change, p_reason: d.mode === "count" ? "count" : d.reason, p_note: d.note });
    if (error) {
      const msg = /no_oversell|stock_on_hand/.test(error.message) ? "Beholdningen kan ikke bli lavere enn reservert antall eller under 0." : error.message;
      return { result: { ok: false, message: msg } };
    }
    refreshCatalog("/admin/lager");
    return { result: { ok: true, message: `Ny beholdning: ${data}` }, entityId: d.variant_id, details: { change, reason: d.reason } };
  });
}

export async function setMinStock(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z.object({ variant_id: uuid, min_stock: int.refine((v) => v >= 0), reorder_quantity: optInt }).safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  return staffAction<ActionState>({ action: "stock.min_updated", entityType: "variant" }, async ({ supabase }) => {
    const { error } = await supabase
      .from("product_variants")
      .update({ min_stock: parsed.data.min_stock, reorder_quantity: parsed.data.reorder_quantity })
      .eq("id", parsed.data.variant_id);
    revalidatePath("/admin/lager");
    return { result: error ? dbError("Kunne ikke lagre", error) : { ok: true, message: "Lagret." }, entityId: parsed.data.variant_id };
  });
}

/** «Foreslå ny bestilling»: oppretter utkast til innkjøpsordre per leverandør fra innkjøpsforslagene. */
export async function createPurchaseOrdersFromSuggestions(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const selected = formData.getAll("variant").map(String).filter((v) => uuid.safeParse(v).success);
  if (!selected.length) return { ok: false, message: "Velg minst én variant." };
  return staffAction<ActionState>({ action: "purchase_order.created_from_suggestions", entityType: "purchase_order" }, async ({ supabase, userId }) => {
    const { data: suggestions, error } = await supabase.rpc("reorder_suggestions", { p_history_days: 90, p_safety_days: 14 });
    if (error) return { result: dbError("Kunne ikke hente forslag", error) };
    const rows = (suggestions as { variant_id: string; supplier_id: string | null; suggested_quantity: number }[]).filter(
      (s) => selected.includes(s.variant_id) && s.suggested_quantity > 0,
    );
    const missingSupplier = rows.filter((r) => !r.supplier_id).length;
    const bySupplier = new Map<string, typeof rows>();
    rows.filter((r) => r.supplier_id).forEach((r) => bySupplier.set(r.supplier_id!, [...(bySupplier.get(r.supplier_id!) ?? []), r]));
    let created = 0;
    for (const [supplierId, items] of bySupplier) {
      const { data: supplier } = await supabase.from("suppliers").select("currency, lead_time_days").eq("id", supplierId).single();
      const { data: po } = await supabase
        .from("purchase_orders")
        .insert({ supplier_id: supplierId, currency: supplier?.currency ?? "NOK", created_by: userId, notes: "Opprettet fra innkjøpsforslag" })
        .select("id")
        .single();
      if (!po) continue;
      const { data: prices } = await supabase
        .from("supplier_products")
        .select("variant_id, purchase_price")
        .eq("supplier_id", supplierId)
        .in("variant_id", items.map((i) => i.variant_id));
      const priceMap = new Map((prices ?? []).map((p) => [p.variant_id, Number(p.purchase_price)]));
      await supabase.from("purchase_order_items").insert(
        items.map((i) => ({ purchase_order_id: po.id, variant_id: i.variant_id, quantity: i.suggested_quantity, unit_price: priceMap.get(i.variant_id) ?? 0 })),
      );
      created++;
    }
    revalidatePath("/admin/innkjop");
    return {
      result: {
        ok: created > 0,
        message: `Opprettet ${created} utkast til innkjøpsordre.${missingSupplier ? ` ${missingSupplier} varianter mangler leverandør og ble hoppet over.` : ""}`,
      },
      details: { created, missingSupplier },
    };
  });
}
