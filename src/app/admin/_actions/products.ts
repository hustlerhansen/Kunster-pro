"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils";
import { SPEC_DEFS } from "@/lib/specs";
import type { ActionState } from "@/app/actions/types";
import { bool, dbError, fd, int, krToOre, num, optInt, optStr, refreshCatalog, staffAction, uuid, zodFail } from "./util";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Navn mangler").max(160),
  slug: z.string().trim().max(80).optional(),
  subtitle: optStr(160),
  short_description: optStr(400),
  description: optStr(10000),
  usage: optStr(300),
  category_id: uuid,
  brand_id: z.string().optional().transform((v) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : null)),
  product_type: z.enum(["oil_paint", "brush", "canvas", "medium", "set", "accessory"]),
  status: z.enum(["draft", "active", "archived"]),
  featured: bool,
  is_demo: bool,
  sort_order: optInt,
  delivery_note: optStr(300),
  seo_title: optStr(70),
  seo_description: optStr(170),
  related: z.string().optional(),
});

function specsFrom(form: Record<string, string>) {
  const specs: Record<string, string | number> = {};
  for (const key of Object.keys(SPEC_DEFS)) {
    const raw = form[`spec_${key}`]?.trim();
    if (!raw) continue;
    const unit = SPEC_DEFS[key].unit;
    const asNum = Number(raw.replace(",", "."));
    specs[key] = unit && !Number.isNaN(asNum) ? asNum : raw;
  }
  return specs;
}

export async function saveProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const form = fd(formData);
  const parsed = productSchema.safeParse(form);
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  const id = d.id && /^[0-9a-f-]{36}$/i.test(d.id) ? d.id : null;
  const row = {
    name: d.name,
    slug: slugify(d.slug || d.name),
    subtitle: d.subtitle,
    short_description: d.short_description,
    description: d.description,
    usage: d.usage,
    category_id: d.category_id,
    brand_id: d.brand_id,
    product_type: d.product_type,
    status: d.status,
    featured: d.featured,
    is_demo: d.is_demo,
    sort_order: d.sort_order ?? 0,
    delivery_note: d.delivery_note,
    seo_title: d.seo_title,
    seo_description: d.seo_description,
    specs: specsFrom(form),
    related_product_ids: (d.related ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^[0-9a-f-]{36}$/i.test(s)),
  };
  const res = await staffAction({ action: id ? "product.updated" : "product.created", entityType: "product" }, async ({ supabase }) => {
    const q = id
      ? await supabase.from("products").update(row).eq("id", id).select("id").single()
      : await supabase.from("products").insert(row).select("id").single();
    return { result: q, entityId: q.data?.id ?? id, details: { name: row.name, status: row.status } };
  });
  if (res.error) return dbError("Kunne ikke lagre produktet", res.error);
  refreshCatalog("/admin/produkter", `/produkt/${row.slug}`);
  if (!id) redirect(`/admin/produkter/${res.data.id}?ny=1`);
  return { ok: true, message: "Produktet er lagret." };
}

/** Sletting er kun lov hvis produktet aldri er solgt – ellers arkiveres det (bokføring/historikk). */
export async function deleteOrArchiveProduct(formData: FormData) {
  const id = String(formData.get("id"));
  if (!uuid.safeParse(id).success) return;
  await staffAction({ action: "product.deleted_or_archived", entityType: "product" }, async ({ supabase }) => {
    const { count } = await supabase.from("order_items").select("id", { count: "exact", head: true }).eq("product_id", id);
    if ((count ?? 0) > 0) {
      await supabase.from("products").update({ status: "archived" }).eq("id", id);
      return { result: null, entityId: id, details: { archived: true } };
    }
    await supabase.from("products").delete().eq("id", id);
    return { result: null, entityId: id, details: { deleted: true } };
  });
  refreshCatalog("/admin/produkter");
  redirect("/admin/produkter");
}

const variantSchema = z.object({
  id: z.string().optional(),
  product_id: uuid,
  name: z.string().trim().min(1, "Variantnavn mangler").max(80),
  sku: z.string().trim().min(2, "SKU mangler").max(60),
  price: krToOre,
  vat_rate: num.refine((v) => v >= 0 && v <= 100, "Ugyldig MVA"),
  weight_g: optInt,
  min_stock: int,
  reorder_quantity: optInt,
  color_hex: optStr(7),
  barcode: optStr(40),
  is_active: bool,
  sort_order: optInt,
  options: z.string().optional(),
});

function parseOptions(raw: string | undefined) {
  const out: Record<string, string | number> = {};
  for (const line of (raw ?? "").split("\n")) {
    const [k, ...rest] = line.split("=");
    const key = k?.trim();
    const value = rest.join("=").trim();
    if (!key || !value) continue;
    const n = Number(value.replace(",", "."));
    out[key] = SPEC_DEFS[key]?.unit && !Number.isNaN(n) ? n : value;
  }
  return out;
}

export async function saveVariant(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = variantSchema.safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  const id = d.id && /^[0-9a-f-]{36}$/i.test(d.id) ? d.id : null;
  const row = {
    product_id: d.product_id,
    name: d.name,
    sku: d.sku.toUpperCase(),
    price_ore: d.price,
    vat_rate: d.vat_rate,
    weight_g: d.weight_g,
    min_stock: d.min_stock,
    reorder_quantity: d.reorder_quantity,
    color_hex: d.color_hex && /^#[0-9A-Fa-f]{6}$/.test(d.color_hex) ? d.color_hex : null,
    barcode: d.barcode,
    is_active: d.is_active,
    sort_order: d.sort_order ?? 0,
    options: parseOptions(d.options),
  };
  const res = await staffAction({ action: id ? "variant.updated" : "variant.created", entityType: "variant" }, async ({ supabase }) => {
    const q = id ? await supabase.from("product_variants").update(row).eq("id", id) : await supabase.from("product_variants").insert(row);
    return { result: q, entityId: id, details: { sku: row.sku, price_ore: row.price_ore } };
  });
  if (res.error) return dbError("Kunne ikke lagre varianten", res.error);
  refreshCatalog(`/admin/produkter/${d.product_id}`);
  return { ok: true, message: id ? "Varianten er oppdatert." : "Varianten er lagt til." };
}

export async function deleteVariant(formData: FormData) {
  const id = String(formData.get("id"));
  const productId = String(formData.get("product_id"));
  if (!uuid.safeParse(id).success) return;
  await staffAction({ action: "variant.deleted_or_deactivated", entityType: "variant" }, async ({ supabase }) => {
    const { count } = await supabase.from("order_items").select("id", { count: "exact", head: true }).eq("variant_id", id);
    if ((count ?? 0) > 0) await supabase.from("product_variants").update({ is_active: false }).eq("id", id);
    else await supabase.from("product_variants").delete().eq("id", id);
    return { result: null, entityId: id };
  });
  refreshCatalog(`/admin/produkter/${productId}`);
}

const costSchema = z.object({
  variant_id: uuid,
  product_id: uuid,
  supplier_id: z.string().optional().transform((v) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : null)),
  purchase_price: num.refine((v) => v >= 0, "Ugyldig innkjøpspris"),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Valuta må være tre bokstaver"),
  exchange_rate: num.refine((v) => v > 0, "Valutakurs må være over 0"),
  freight: krToOre,
  duty: krToOre,
  other: krToOre,
  packaging: krToOre,
  payment_fee_percent: num.refine((v) => v >= 0 && v < 100, "Ugyldig gebyr"),
  notes: optStr(500),
});

/** Kostprofil (landed cost) per variant. Inngående MVA registreres ikke som kostnad. */
export async function saveVariantCost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = costSchema.safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  const res = await staffAction({ action: "variant_cost.updated", entityType: "variant" }, async ({ supabase }) => {
    const q = await supabase.from("variant_costs").upsert({
      variant_id: d.variant_id,
      supplier_id: d.supplier_id,
      purchase_price: d.purchase_price,
      currency: d.currency,
      exchange_rate: d.exchange_rate,
      freight_per_unit_ore: d.freight,
      duty_per_unit_ore: d.duty,
      other_per_unit_ore: d.other,
      packaging_per_unit_ore: d.packaging,
      payment_fee_percent: d.payment_fee_percent,
      notes: d.notes,
      is_demo: false,
    });
    return { result: q, entityId: d.variant_id, details: { purchase_price: d.purchase_price, currency: d.currency } };
  });
  if (res.error) return dbError("Kunne ikke lagre kostnader", res.error);
  revalidatePath(`/admin/produkter/${d.product_id}`);
  revalidatePath("/admin/lonnsomhet");
  return { ok: true, message: "Kostprofilen er lagret." };
}

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function addProductImage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const productId = String(formData.get("product_id"));
  if (!uuid.safeParse(productId).success) return { ok: false, message: "Ugyldig produkt" };
  const alt = String(formData.get("alt") ?? "").trim().slice(0, 200);
  const file = formData.get("file");
  const url = String(formData.get("url") ?? "").trim();

  const res = await staffAction<ActionState>({ action: "product.image_added", entityType: "product" }, async ({ supabase }) => {
    let publicUrl = url;
    if (file instanceof File && file.size > 0) {
      if (!ALLOWED_IMAGE.includes(file.type)) return { result: { ok: false, message: "Kun JPG, PNG, WebP eller AVIF er tillatt." } as ActionState };
      if (file.size > 5 * 1024 * 1024) return { result: { ok: false, message: "Bildet er større enn 5 MB." } as ActionState };
      const ext = file.type.split("/")[1].replace("jpeg", "jpg");
      const path = `products/${productId}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("media").upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) return { result: { ok: false, message: `Opplasting feilet: ${up.error.message}` } as ActionState };
      publicUrl = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
    } else if (!/^(https:\/\/|\/images\/)/.test(publicUrl)) {
      return { result: { ok: false, message: "Last opp et bilde eller oppgi en https-adresse." } as ActionState };
    }
    const { count } = await supabase.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", productId);
    const ins = await supabase.from("product_images").insert({ product_id: productId, url: publicUrl, alt, sort_order: count ?? 0, is_placeholder: false });
    if (ins.error) return { result: dbError("Kunne ikke lagre bildet", ins.error) };
    return { result: { ok: true, message: "Bildet er lagt til." } as ActionState, entityId: productId };
  });
  refreshCatalog(`/admin/produkter/${productId}`);
  return res;
}

export async function deleteProductImage(formData: FormData) {
  const id = String(formData.get("id"));
  const productId = String(formData.get("product_id"));
  if (!uuid.safeParse(id).success) return;
  await staffAction({ action: "product.image_deleted", entityType: "product" }, async ({ supabase }) => {
    const { data } = await supabase.from("product_images").select("url").eq("id", id).maybeSingle();
    await supabase.from("product_images").delete().eq("id", id);
    const marker = "/storage/v1/object/public/media/";
    if (data?.url?.includes(marker)) await supabase.storage.from("media").remove([data.url.split(marker)[1]]);
    return { result: null, entityId: productId };
  });
  refreshCatalog(`/admin/produkter/${productId}`);
}

export async function makePrimaryImage(formData: FormData) {
  const id = String(formData.get("id"));
  const productId = String(formData.get("product_id"));
  if (!uuid.safeParse(id).success || !uuid.safeParse(productId).success) return;
  await staffAction({ action: "product.image_reordered", entityType: "product" }, async ({ supabase }) => {
    const { data } = await supabase.from("product_images").select("id").eq("product_id", productId).order("sort_order");
    const ordered = [id, ...(data ?? []).map((r) => r.id).filter((x) => x !== id)];
    await Promise.all(ordered.map((imgId, i) => supabase.from("product_images").update({ sort_order: i }).eq("id", imgId)));
    return { result: null, entityId: productId };
  });
  refreshCatalog(`/admin/produkter/${productId}`);
}

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().max(60).optional(),
  tagline: optStr(120),
  description: optStr(600),
  long_description: optStr(10000),
  image_url: optStr(500),
  seo_title: optStr(70),
  seo_description: optStr(170),
  sort_order: optInt,
  is_active: bool,
});

export async function saveCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = categorySchema.safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  const { id, slug, sort_order, ...rest } = parsed.data;
  const row = { ...rest, slug: slugify(slug || rest.name), sort_order: sort_order ?? 0 };
  const validId = id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
  const res = await staffAction({ action: validId ? "category.updated" : "category.created", entityType: "category" }, async ({ supabase }) => {
    const q = validId ? await supabase.from("categories").update(row).eq("id", validId) : await supabase.from("categories").insert(row);
    return { result: q, entityId: validId, details: { name: row.name } };
  });
  if (res.error) return dbError("Kunne ikke lagre kategorien", res.error);
  refreshCatalog("/admin/kategorier", `/${row.slug}`);
  return { ok: true, message: "Kategorien er lagret." };
}
