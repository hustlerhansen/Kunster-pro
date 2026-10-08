import "server-only";
import { integrations, isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEMO_PRODUCTS } from "@/lib/demo/catalog";
import { getShippingMethods, getVolumeDiscounts } from "@/lib/data/catalog";
import { computeCart, type CartTotals, type PricingVariant } from "@/lib/pricing/cart";
import { getCurrentCompany, getCurrentProfile } from "@/lib/auth";
import type { CartLineInput, DiscountCode } from "@/lib/types";

export interface CustomerPricingContext {
  userId: string | null;
  email: string | null;
  companyId: string | null;
  priceGroupId: string | null;
  isBusiness: boolean;
}

export async function getPricingContext(): Promise<CustomerPricingContext> {
  const profile = await getCurrentProfile().catch(() => null);
  const company = profile?.company_id ? await getCurrentCompany().catch(() => null) : null;
  const activeCompany = company && company.status === "active" ? company : null;
  return {
    userId: profile?.id ?? null,
    email: profile?.email ?? null,
    companyId: activeCompany?.id ?? null,
    priceGroupId: activeCompany?.price_group_id ?? null,
    isBusiness: Boolean(activeCompany),
  };
}

/** Henter FERSKE priser og lagertall (ikke cachet) for prising av handlekurv/kasse. */
export async function loadPricingVariants(
  variantIds: string[],
  priceGroupId: string | null,
): Promise<Map<string, PricingVariant>> {
  const ids = [...new Set(variantIds)].filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 100);
  const map = new Map<string, PricingVariant>();
  if (ids.length === 0) return map;

  if (!isSupabaseConfigured()) {
    for (const p of DEMO_PRODUCTS) {
      for (const v of p.variants) {
        if (!ids.includes(v.id)) continue;
        map.set(v.id, {
          id: v.id,
          product_id: p.id,
          category_id: p.category_id,
          product_name: p.name,
          product_slug: p.slug,
          variant_name: v.name,
          sku: v.sku,
          price_ore: v.price_ore,
          vat_rate: v.vat_rate,
          stock_available: v.stock_available,
          weight_g: v.weight_g,
          image_url: p.images[0]?.url ?? null,
          is_available: p.status === "active" && v.is_active,
        });
      }
    }
    return map;
  }

  const { data, error } = await createPublicClient()
    .from("product_variants")
    .select(
      "id, sku, name, price_ore, vat_rate, stock_available, weight_g, is_active, product:products!inner(id, slug, name, status, category_id, images:product_images(url, sort_order))",
    )
    .in("id", ids);
  if (error) throw new Error(`Kunne ikke hente priser: ${error.message}`);

  // Bedriftspriser (prisgruppe) – hentes med service role etter at kundens tilhørighet er verifisert
  let groupPrices = new Map<string, number>();
  let groupDiscount = 0;
  if (priceGroupId && integrations.supabaseAdmin()) {
    const admin = createAdminClient();
    const [{ data: group }, { data: prices }] = await Promise.all([
      admin.from("price_groups").select("discount_percent, is_active").eq("id", priceGroupId).maybeSingle(),
      admin.from("price_group_prices").select("variant_id, price_ore").eq("price_group_id", priceGroupId).in("variant_id", ids),
    ]);
    if (group?.is_active) {
      groupDiscount = Number(group.discount_percent) || 0;
      groupPrices = new Map((prices ?? []).map((p) => [p.variant_id as string, p.price_ore as number]));
    }
  }

  for (const row of (data ?? []) as unknown as {
    id: string;
    sku: string;
    name: string;
    price_ore: number;
    vat_rate: number;
    stock_available: number;
    weight_g: number | null;
    is_active: boolean;
    product: { id: string; slug: string; name: string; status: string; category_id: string; images: { url: string; sort_order: number }[] };
  }[]) {
    const images = [...(row.product.images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    const price = groupPrices.get(row.id) ?? Math.round((row.price_ore * (100 - groupDiscount)) / 100);
    map.set(row.id, {
      id: row.id,
      product_id: row.product.id,
      category_id: row.product.category_id,
      product_name: row.product.name,
      product_slug: row.product.slug,
      variant_name: row.name,
      sku: row.sku,
      price_ore: price,
      vat_rate: Number(row.vat_rate),
      stock_available: row.stock_available,
      weight_g: row.weight_g,
      image_url: images[0]?.url ?? null,
      is_available: row.is_active && row.product.status === "active",
    });
  }
  return map;
}

/** Demo-rabattkode – finnes KUN i demomodus (uten database). */
const DEMO_CODES: DiscountCode[] = [
  {
    id: "demo-code",
    code: "DEMO10",
    description: "Demo: 10 % rabatt (kun i demomodus)",
    type: "percent",
    value: 10,
    min_order_ore: 0,
    category_id: null,
    starts_at: null,
    ends_at: null,
    max_uses: null,
    uses_count: 0,
    once_per_customer: false,
    is_active: true,
  },
];

export async function lookupDiscountCode(raw: string, ctx: CustomerPricingContext, email?: string | null): Promise<DiscountCode | null> {
  const code = raw.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) return null;
  if (!isSupabaseConfigured()) return DEMO_CODES.find((c) => c.code === code) ?? null;
  if (!integrations.supabaseAdmin()) return null;

  const admin = createAdminClient();
  const { data } = await admin.from("discount_codes").select("*").ilike("code", code).maybeSingle();
  if (!data) return null;
  const dc = data as DiscountCode;

  if (dc.once_per_customer) {
    const who = ctx.userId ? { col: "user_id", val: ctx.userId } : email ? { col: "email", val: email } : null;
    if (who) {
      const { count } = await admin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq(who.col, who.val)
        .ilike("discount_code", dc.code)
        .in("payment_status", ["paid", "invoiced"]);
      if ((count ?? 0) > 0) return { ...dc, is_active: false, description: "Rabattkoden er allerede brukt." };
    }
  }
  return dc;
}

export async function priceCart(input: {
  lines: CartLineInput[];
  discountCode?: string | null;
  shippingCode?: string | null;
  email?: string | null;
  ctx?: CustomerPricingContext;
}): Promise<CartTotals> {
  const ctx = input.ctx ?? (await getPricingContext());
  const lines = input.lines.slice(0, 100);
  const [variants, volumeDiscounts, shippingMethods] = await Promise.all([
    loadPricingVariants(lines.map((l) => l.variantId), ctx.priceGroupId),
    getVolumeDiscounts(),
    getShippingMethods(),
  ]);
  const code = input.discountCode?.trim()
    ? { raw: input.discountCode.trim(), code: await lookupDiscountCode(input.discountCode, ctx, input.email) }
    : null;
  return computeCart({
    lines,
    variants,
    volumeDiscounts,
    shippingMethods,
    shippingCode: input.shippingCode,
    discountCode: code,
    isBusiness: ctx.isBusiness,
  });
}
