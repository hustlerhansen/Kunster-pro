import { describe, expect, it } from "vitest";
import { computeCart, type PricingVariant } from "@/lib/pricing/cart";
import type { DiscountCode, ShippingMethod, VolumeDiscount } from "@/lib/types";

const v = (id: string, price: number, stock = 50, extra: Partial<PricingVariant> = {}): PricingVariant => ({
  id,
  product_id: `p-${id}`,
  category_id: "cat-a",
  product_name: `Produkt ${id}`,
  product_slug: id,
  variant_name: "Std",
  sku: `SKU-${id}`,
  price_ore: price,
  vat_rate: 25,
  stock_available: stock,
  weight_g: 100,
  image_url: null,
  is_available: true,
  ...extra,
});

const shipping: ShippingMethod[] = [
  { id: "s1", code: "pickup", name: "Hentested", description: null, carrier: "bring", type: "pickup", price_ore: 7900, free_threshold_ore: 99900, delivery_estimate: null, max_weight_g: null, requires_business: false, is_active: true, sort_order: 1 },
  { id: "s2", code: "biz", name: "Bedrift", description: null, carrier: "bring", type: "business", price_ore: 9900, free_threshold_ore: null, delivery_estimate: null, max_weight_g: null, requires_business: true, is_active: true, sort_order: 2 },
];

const code = (over: Partial<DiscountCode>): DiscountCode => ({
  id: "c", code: "TEST", description: null, type: "percent", value: 10, min_order_ore: 0, category_id: null,
  starts_at: null, ends_at: null, max_uses: null, uses_count: 0, once_per_customer: false, is_active: true, ...over,
});

describe("handlekurv", () => {
  const variants = new Map([["a", v("a", 10000)], ["b", v("b", 25000, 2)]]);

  it("beregner delsum, frakt og MVA", () => {
    const r = computeCart({ lines: [{ variantId: "a", quantity: 2 }], variants, volumeDiscounts: [], shippingMethods: shipping });
    expect(r.subtotal_ore).toBe(20000);
    expect(r.shipping_ore).toBe(7900);
    expect(r.total_ore).toBe(27900);
    expect(r.vat_ore).toBe(4000 + 1580);
    expect(r.amount_to_free_shipping_ore).toBe(79900);
  });

  it("gir fri frakt over terskelen", () => {
    const r = computeCart({ lines: [{ variantId: "a", quantity: 10 }], variants, volumeDiscounts: [], shippingMethods: shipping });
    expect(r.shipping_ore).toBe(0);
    expect(r.shipping?.is_free).toBe(true);
  });

  it("skjuler bedriftslevering for privatkunder", () => {
    const r = computeCart({ lines: [{ variantId: "a", quantity: 1 }], variants, volumeDiscounts: [], shippingMethods: shipping });
    expect(r.shipping_options.map((o) => o.code)).toEqual(["pickup"]);
    const b = computeCart({ lines: [{ variantId: "a", quantity: 1 }], variants, volumeDiscounts: [], shippingMethods: shipping, isBusiness: true });
    expect(b.shipping_options.map((o) => o.code)).toEqual(["pickup", "biz"]);
  });

  it("markerer for lite lager og utelater linjen fra totalen", () => {
    const r = computeCart({ lines: [{ variantId: "b", quantity: 3 }], variants, volumeDiscounts: [], shippingMethods: shipping });
    expect(r.lines[0].issue).toBe("insufficient_stock");
    expect(r.subtotal_ore).toBe(0);
    expect(r.has_issues).toBe(true);
    expect(r.shipping).toBeNull();
  });

  it("slår sammen duplikater og ignorerer ugyldige antall", () => {
    const r = computeCart({
      lines: [{ variantId: "a", quantity: 1 }, { variantId: "a", quantity: 2 }, { variantId: "a", quantity: -4 }, { variantId: "x", quantity: 1 }],
      variants, volumeDiscounts: [], shippingMethods: shipping,
    });
    expect(r.lines).toHaveLength(1);
    expect(r.lines[0].quantity).toBe(3);
  });

  it("gir mengderabatt når minsteantall er nådd", () => {
    const rule: VolumeDiscount = { id: "r", name: "Kjøp 5", description: null, product_id: "p-a", category_id: null, min_quantity: 5, percent_off: 10, starts_at: null, ends_at: null, is_active: true };
    const under = computeCart({ lines: [{ variantId: "a", quantity: 4 }], variants, volumeDiscounts: [rule], shippingMethods: shipping });
    expect(under.volume_discount_ore).toBe(0);
    const over = computeCart({ lines: [{ variantId: "a", quantity: 5 }], variants, volumeDiscounts: [rule], shippingMethods: shipping });
    expect(over.volume_discount_ore).toBe(5000);
    expect(over.subtotal_ore).toBe(45000);
  });

  it("bruker prosent-rabattkode og fordeler MVA", () => {
    const r = computeCart({
      lines: [{ variantId: "a", quantity: 2 }], variants, volumeDiscounts: [], shippingMethods: shipping,
      discountCode: { raw: "test", code: code({}) },
    });
    expect(r.code?.valid).toBe(true);
    expect(r.code_discount_ore).toBe(2000);
    expect(r.total_ore).toBe(18000 + 7900);
    expect(r.vat_ore).toBe(3600 + 1580);
  });

  it("fast rabatt kan ikke overstige varebeløpet", () => {
    const r = computeCart({
      lines: [{ variantId: "a", quantity: 1 }], variants, volumeDiscounts: [], shippingMethods: shipping,
      discountCode: { raw: "x", code: code({ type: "fixed", value: 50000 }) },
    });
    expect(r.code_discount_ore).toBe(10000);
    expect(r.total_ore).toBe(7900);
  });

  it("avviser kode under minstebeløp, utløpt og oppbrukt", () => {
    const base = { lines: [{ variantId: "a", quantity: 1 }], variants, volumeDiscounts: [], shippingMethods: shipping };
    expect(computeCart({ ...base, discountCode: { raw: "x", code: code({ min_order_ore: 50000 }) } }).code?.valid).toBe(false);
    expect(computeCart({ ...base, discountCode: { raw: "x", code: code({ ends_at: "2000-01-01T00:00:00Z" }) } }).code?.valid).toBe(false);
    expect(computeCart({ ...base, discountCode: { raw: "x", code: code({ max_uses: 3, uses_count: 3 }) } }).code?.valid).toBe(false);
    expect(computeCart({ ...base, discountCode: { raw: "x", code: null } }).code?.valid).toBe(false);
  });

  it("fri frakt-kode", () => {
    const r = computeCart({
      lines: [{ variantId: "a", quantity: 1 }], variants, volumeDiscounts: [], shippingMethods: shipping,
      discountCode: { raw: "x", code: code({ type: "free_shipping", value: 0 }) },
    });
    expect(r.shipping_ore).toBe(0);
    expect(r.total_ore).toBe(10000);
  });
});
