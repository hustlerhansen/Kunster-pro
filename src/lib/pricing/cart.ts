/**
 * Prismotor for handlekurv og kasse. Ren funksjon uten sideeffekter –
 * brukes både for visning og for server-side beregning ved ordreopprettelse.
 * Alle beløp i øre, inkl. MVA.
 */
import { exVat } from "@/lib/money";
import type { DiscountCode, ShippingMethod, VolumeDiscount } from "@/lib/types";

export interface PricingVariant {
  id: string;
  product_id: string;
  category_id: string;
  product_name: string;
  product_slug: string;
  variant_name: string;
  sku: string;
  /** Gjeldende pris for kunden (ev. bedriftspris), inkl. MVA */
  price_ore: number;
  vat_rate: number;
  stock_available: number;
  weight_g: number | null;
  image_url: string | null;
  is_available: boolean;
}

export type LineIssue = "unavailable" | "out_of_stock" | "insufficient_stock";

export interface PricedLine {
  variant_id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  variant_name: string;
  sku: string;
  image_url: string | null;
  quantity: number;
  max_quantity: number;
  unit_price_ore: number;
  vat_rate: number;
  line_subtotal_ore: number;
  volume_discount_ore: number;
  volume_discount_label: string | null;
  line_total_ore: number;
  issue: LineIssue | null;
}

export interface ShippingOption {
  code: string;
  name: string;
  description: string | null;
  type: ShippingMethod["type"];
  carrier: ShippingMethod["carrier"];
  price_ore: number;
  original_price_ore: number;
  is_free: boolean;
  delivery_estimate: string | null;
}

export interface CodeResult {
  code: string;
  valid: boolean;
  message: string;
  discount_ore: number;
  free_shipping: boolean;
}

export interface CartTotals {
  lines: PricedLine[];
  items_count: number;
  subtotal_before_discounts_ore: number;
  volume_discount_ore: number;
  /** Sum av linjer etter mengderabatt */
  subtotal_ore: number;
  code: CodeResult | null;
  code_discount_ore: number;
  shipping_options: ShippingOption[];
  shipping: ShippingOption | null;
  shipping_ore: number;
  total_ore: number;
  vat_ore: number;
  total_ex_vat_ore: number;
  free_shipping_threshold_ore: number | null;
  amount_to_free_shipping_ore: number | null;
  weight_g: number;
  has_issues: boolean;
}

export const MAX_LINE_QUANTITY = 99;

function isActiveInPeriod(item: { is_active: boolean; starts_at: string | null; ends_at: string | null }, now: Date) {
  if (!item.is_active) return false;
  if (item.starts_at && new Date(item.starts_at) > now) return false;
  if (item.ends_at && new Date(item.ends_at) <= now) return false;
  return true;
}

/** Finn beste mengderabatt for en linje. Antall telles per produkt eller per kategori. */
function volumeDiscountFor(
  variant: PricingVariant,
  qtyByProduct: Map<string, number>,
  qtyByCategory: Map<string, number>,
  rules: VolumeDiscount[],
  now: Date,
): VolumeDiscount | null {
  let best: VolumeDiscount | null = null;
  for (const rule of rules) {
    if (!isActiveInPeriod(rule, now)) continue;
    const qty = rule.product_id
      ? rule.product_id === variant.product_id
        ? qtyByProduct.get(variant.product_id) ?? 0
        : -1
      : rule.category_id === variant.category_id
        ? qtyByCategory.get(variant.category_id) ?? 0
        : -1;
    if (qty >= rule.min_quantity && (!best || rule.percent_off > best.percent_off)) best = rule;
  }
  return best;
}

export function evaluateDiscountCode(
  code: DiscountCode | null | undefined,
  rawCode: string,
  lines: PricedLine[],
  variants: Map<string, PricingVariant>,
  subtotal: number,
  now: Date,
): CodeResult {
  const base = { code: rawCode.toUpperCase(), discount_ore: 0, free_shipping: false };
  if (!code) return { ...base, valid: false, message: "Rabattkoden finnes ikke." };
  if (!isActiveInPeriod(code, now)) return { ...base, valid: false, message: "Rabattkoden er ikke aktiv." };
  if (code.max_uses !== null && code.uses_count >= code.max_uses)
    return { ...base, valid: false, message: "Rabattkoden er brukt opp." };
  if (subtotal < code.min_order_ore)
    return {
      ...base,
      valid: false,
      message: `Rabattkoden krever en ordre på minst ${Math.round(code.min_order_ore / 100)} kr.`,
    };
  const eligible = lines
    .filter((l) => !l.issue)
    .filter((l) => !code.category_id || variants.get(l.variant_id)?.category_id === code.category_id)
    .reduce((s, l) => s + l.line_total_ore, 0);
  if (eligible <= 0) return { ...base, valid: false, message: "Rabattkoden gjelder ikke varene i handlekurven." };

  if (code.type === "free_shipping") {
    return { ...base, code: code.code.toUpperCase(), valid: true, message: "Fri frakt er lagt til.", free_shipping: true };
  }
  const discount =
    code.type === "percent" ? Math.round((eligible * Math.min(code.value, 100)) / 100) : Math.min(code.value, eligible);
  return {
    ...base,
    code: code.code.toUpperCase(),
    valid: true,
    message: code.description || "Rabattkoden er lagt til.",
    discount_ore: discount,
  };
}

export function computeCart(input: {
  lines: { variantId: string; quantity: number }[];
  variants: Map<string, PricingVariant>;
  volumeDiscounts: VolumeDiscount[];
  shippingMethods: ShippingMethod[];
  shippingCode?: string | null;
  discountCode?: { raw: string; code: DiscountCode | null } | null;
  isBusiness?: boolean;
  now?: Date;
}): CartTotals {
  const now = input.now ?? new Date();

  // Slå sammen duplikate linjer og begrens antall
  const merged = new Map<string, number>();
  for (const l of input.lines) {
    const q = Math.floor(Number(l.quantity));
    if (!l.variantId || !Number.isFinite(q) || q <= 0) continue;
    merged.set(l.variantId, Math.min((merged.get(l.variantId) ?? 0) + q, MAX_LINE_QUANTITY));
  }

  const qtyByProduct = new Map<string, number>();
  const qtyByCategory = new Map<string, number>();
  for (const [variantId, qty] of merged) {
    const v = input.variants.get(variantId);
    if (!v || !v.is_available) continue;
    qtyByProduct.set(v.product_id, (qtyByProduct.get(v.product_id) ?? 0) + qty);
    qtyByCategory.set(v.category_id, (qtyByCategory.get(v.category_id) ?? 0) + qty);
  }

  const lines: PricedLine[] = [];
  for (const [variantId, qty] of merged) {
    const v = input.variants.get(variantId);
    if (!v) continue; // ukjent variant fjernes stille
    let issue: LineIssue | null = null;
    if (!v.is_available) issue = "unavailable";
    else if (v.stock_available <= 0) issue = "out_of_stock";
    else if (qty > v.stock_available) issue = "insufficient_stock";

    const rule = issue ? null : volumeDiscountFor(v, qtyByProduct, qtyByCategory, input.volumeDiscounts, now);
    const lineSubtotal = v.price_ore * qty;
    const volumeDiscount = rule ? Math.round((lineSubtotal * rule.percent_off) / 100) : 0;
    lines.push({
      variant_id: v.id,
      product_id: v.product_id,
      product_name: v.product_name,
      product_slug: v.product_slug,
      variant_name: v.variant_name,
      sku: v.sku,
      image_url: v.image_url,
      quantity: qty,
      max_quantity: Math.max(0, Math.min(v.stock_available, MAX_LINE_QUANTITY)),
      unit_price_ore: v.price_ore,
      vat_rate: v.vat_rate,
      line_subtotal_ore: lineSubtotal,
      volume_discount_ore: volumeDiscount,
      volume_discount_label: rule ? rule.name : null,
      line_total_ore: lineSubtotal - volumeDiscount,
      issue,
    });
  }

  const valid = lines.filter((l) => !l.issue);
  const subtotalBefore = valid.reduce((s, l) => s + l.line_subtotal_ore, 0);
  const volumeDiscountTotal = valid.reduce((s, l) => s + l.volume_discount_ore, 0);
  const subtotal = subtotalBefore - volumeDiscountTotal;

  const code = input.discountCode?.raw
    ? evaluateDiscountCode(input.discountCode.code, input.discountCode.raw, lines, input.variants, subtotal, now)
    : null;
  const codeDiscount = code?.valid ? Math.min(code.discount_ore, subtotal) : 0;
  const goodsTotal = subtotal - codeDiscount;

  const weight = valid.reduce((s, l) => s + (input.variants.get(l.variant_id)?.weight_g ?? 0) * l.quantity, 0);

  const shippingOptions: ShippingOption[] = input.shippingMethods
    .filter((m) => m.is_active)
    .filter((m) => !m.requires_business || input.isBusiness)
    .filter((m) => !m.max_weight_g || weight <= m.max_weight_g)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((m) => {
      const free = Boolean(code?.valid && code.free_shipping) || (m.free_threshold_ore !== null && goodsTotal >= m.free_threshold_ore);
      return {
        code: m.code,
        name: m.name,
        description: m.description,
        type: m.type,
        carrier: m.carrier,
        price_ore: free ? 0 : m.price_ore,
        original_price_ore: m.price_ore,
        is_free: free,
        delivery_estimate: m.delivery_estimate,
      };
    });

  const shipping =
    valid.length === 0
      ? null
      : shippingOptions.find((o) => o.code === input.shippingCode) ?? shippingOptions[0] ?? null;
  const shippingOre = shipping?.price_ore ?? 0;

  // MVA: fordel rabattkode proporsjonalt på linjene; frakt følger varenes MVA-sats (25 %)
  let vat = 0;
  let allocated = 0;
  valid.forEach((l, i) => {
    const share =
      i === valid.length - 1
        ? codeDiscount - allocated
        : subtotal > 0
          ? Math.round((codeDiscount * l.line_total_ore) / subtotal)
          : 0;
    allocated += share;
    const net = l.line_total_ore - share;
    vat += net - exVat(net, l.vat_rate);
  });
  const shippingVatRate = valid.length ? Math.max(...valid.map((l) => l.vat_rate)) : 25;
  vat += shippingOre - exVat(shippingOre, shippingVatRate);

  const total = goodsTotal + shippingOre;
  const thresholds = input.shippingMethods
    .filter((m) => m.is_active && m.free_threshold_ore !== null && !m.requires_business)
    .map((m) => m.free_threshold_ore as number);
  const freeThreshold = thresholds.length ? Math.min(...thresholds) : null;

  return {
    lines,
    items_count: valid.reduce((s, l) => s + l.quantity, 0),
    subtotal_before_discounts_ore: subtotalBefore,
    volume_discount_ore: volumeDiscountTotal,
    subtotal_ore: subtotal,
    code,
    code_discount_ore: codeDiscount,
    shipping_options: shippingOptions,
    shipping,
    shipping_ore: shippingOre,
    total_ore: total,
    vat_ore: vat,
    total_ex_vat_ore: total - vat,
    free_shipping_threshold_ore: freeThreshold,
    amount_to_free_shipping_ore: freeThreshold !== null ? Math.max(freeThreshold - goodsTotal, 0) : null,
    weight_g: weight,
    has_issues: lines.some((l) => l.issue !== null),
  };
}
