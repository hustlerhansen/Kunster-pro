"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { integrations, isSupabaseConfigured, siteUrl } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPricingContext, priceCart } from "@/lib/data/cart";
import { getPaymentAvailability, releaseOrder, sendOrderConfirmation } from "@/lib/orders";
import { createStripeCheckout } from "@/lib/payments/stripe";
import { createVippsPayment } from "@/lib/payments/vipps";
import { rateLimitByIp } from "@/lib/rate-limit";
import { addressSchema, phoneSchema } from "@/lib/validation";
import { exVat } from "@/lib/money";
import { audit } from "@/lib/audit";

const checkoutSchema = z.object({
  lines: z.array(z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(99) })).min(1).max(100),
  discountCode: z.string().max(40).optional().nullable(),
  shippingCode: z.string().min(1, "Velg fraktmetode").max(40),
  paymentMethod: z.enum(["card", "vipps", "invoice"]),
  email: z.string().trim().toLowerCase().email("Ugyldig e-postadresse").max(200),
  phone: phoneSchema,
  shipping: addressSchema,
  billingSame: z.boolean(),
  billing: addressSchema.optional().nullable(),
  note: z.string().trim().max(1000).optional().nullable(),
  purchaseReference: z.string().trim().max(100).optional().nullable(),
  acceptTerms: z.literal(true, { message: "Du må godta kjøpsvilkårene" }),
  marketingConsent: z.boolean().default(false),
});

export type CheckoutResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string>; repriced?: boolean };

const STOCK_ERROR = /INSUFFICIENT_STOCK|VARIANT_UNAVAILABLE|PRICE_MISMATCH|SUBTOTAL_MISMATCH|TOTAL_MISMATCH/;

/**
 * Oppretter ordre og starter betaling.
 * - Alle priser, rabatter og frakt beregnes på nytt på serveren.
 * - Lager reserveres atomisk i databasen (ingen oversalg).
 * - Ordren markeres IKKE som betalt her – kun når betalingsleverandøren bekrefter via webhook.
 */
export async function createCheckout(raw: unknown): Promise<CheckoutResult> {
  if (!isSupabaseConfigured() || !integrations.supabaseAdmin()) {
    return { ok: false, message: "Bestilling er ikke aktivert ennå: databasen er ikke koblet til (demomodus)." };
  }
  if (!(await rateLimitByIp("checkout", 10, 600))) {
    return { ok: false, message: "For mange forsøk. Vent litt og prøv igjen." };
  }
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[i.path.join(".")] ??= i.message;
    return { ok: false, message: "Kontroller feltene som er markert.", fieldErrors: fe };
  }
  const d = parsed.data;
  const ctx = await getPricingContext();
  const availability = await getPaymentAvailability(ctx);
  if (!availability[d.paymentMethod]) {
    return { ok: false, message: d.paymentMethod === "invoice" ? availability.invoiceReason ?? "Faktura er ikke tilgjengelig." : "Valgt betalingsmetode er ikke tilgjengelig." };
  }

  const totals = await priceCart({ lines: d.lines, discountCode: d.discountCode, shippingCode: d.shippingCode, email: d.email, ctx });
  if (totals.has_issues) return { ok: false, message: "Noen varer er ikke lenger tilgjengelige i ønsket antall. Handlekurven er oppdatert.", repriced: true };
  if (!totals.shipping || totals.shipping.code !== d.shippingCode) return { ok: false, message: "Velg en gyldig fraktmetode.", repriced: true };
  if (d.discountCode && !totals.code?.valid) return { ok: false, message: totals.code?.message ?? "Ugyldig rabattkode.", repriced: true };
  if (d.paymentMethod === "invoice" && availability.creditAvailableOre !== null && totals.total_ore > availability.creditAvailableOre) {
    return { ok: false, message: "Ordren overstiger tilgjengelig kreditt på handlekontoen." };
  }

  const admin = createAdminClient();
  const payload = {
    user_id: ctx.userId,
    company_id: ctx.companyId,
    email: ctx.email ?? d.email,
    phone: d.phone,
    customer_name: d.shipping.full_name,
    payment_method: d.paymentMethod,
    payment_provider: d.paymentMethod === "card" ? "stripe" : d.paymentMethod === "vipps" ? "vipps" : "internal",
    subtotal_ore: totals.subtotal_ore,
    discount_ore: totals.code_discount_ore,
    shipping_ore: totals.shipping_ore,
    total_ore: totals.total_ore,
    vat_ore: totals.vat_ore,
    discount_code: totals.code?.valid ? totals.code.code : null,
    shipping_method_code: totals.shipping.code,
    shipping_method_name: totals.shipping.name,
    shipping_address: d.shipping,
    billing_address: d.billingSame ? d.shipping : d.billing,
    customer_note: d.note,
    purchase_reference: d.purchaseReference,
    marketing_consent: d.marketingConsent,
    reservation_minutes: 35,
    items: totals.lines.map((l) => ({
      variant_id: l.variant_id,
      quantity: l.quantity,
      unit_price_ore: l.unit_price_ore,
      discount_ore: l.volume_discount_ore,
    })),
  };

  const { data: created, error } = await admin.rpc("create_order", { payload });
  if (error || !created?.[0]) {
    if (error && STOCK_ERROR.test(error.message)) {
      return { ok: false, message: "Lagerstatus eller pris er endret mens du handlet. Handlekurven er oppdatert – kontroller og prøv igjen.", repriced: true };
    }
    console.error("create_order feilet", error);
    return { ok: false, message: "Kunne ikke opprette ordren. Prøv igjen eller kontakt kundeservice." };
  }
  const { order_id: orderId, order_number: orderNumber } = created[0] as { order_id: string; order_number: number };

  // Lar gjestekunder se sin egen bekreftelsesside (httpOnly-cookie)
  const jar = await cookies();
  jar.set("kp_order", orderId, { httpOnly: true, sameSite: "lax", secure: siteUrl.startsWith("https"), path: "/", maxAge: 60 * 60 * 24 });

  if (d.marketingConsent && !ctx.userId) {
    await admin.from("newsletter_subscribers").upsert(
      {
        email: d.email,
        status: "pending",
        consent_text: "Samtykke til nyhetsbrev og tilbud gitt i kassen.",
        consent_source: "kasse",
      },
      { onConflict: "email", ignoreDuplicates: true },
    );
  }

  const confirmUrl = `${siteUrl}/kasse/bekreftelse?ordre=${orderId}`;
  try {
    if (d.paymentMethod === "card") {
      const session = await createStripeCheckout({
        orderId,
        orderNumber,
        email: payload.email,
        lines: totals.lines.map((l) => ({ name: `${l.quantity} × ${l.product_name}${l.variant_name ? ` (${l.variant_name})` : ""}`, amountOre: l.line_total_ore })),
        shipping: totals.shipping_ore > 0 ? { name: totals.shipping.name, amountOre: totals.shipping_ore } : null,
        discountOre: totals.code_discount_ore,
        successUrl: `${confirmUrl}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${siteUrl}/kasse?avbrutt=1`,
      });
      await admin.from("orders").update({ payment_reference: session.id }).eq("id", orderId);
      return { ok: true, redirectUrl: session.url! };
    }

    if (d.paymentMethod === "vipps") {
      const reference = `kp-${orderNumber}-${orderId.slice(0, 8)}`;
      const payment = await createVippsPayment({
        reference,
        amountOre: totals.total_ore,
        returnUrl: confirmUrl,
        description: `Kunstner Pro ordre ${orderNumber}`,
        phone: d.phone,
      });
      await admin.from("orders").update({ payment_reference: reference }).eq("id", orderId);
      return { ok: true, redirectUrl: payment.redirectUrl };
    }

    // Faktura (godkjent handlekonto): kreditt kontrolleres og låses atomisk i databasen
    const { error: invErr } = await admin.rpc("place_invoice_order", { p_order_id: orderId });
    if (invErr) {
      await releaseOrder(orderId, "Fakturakjøp avvist");
      return {
        ok: false,
        message: /CREDIT_LIMIT/.test(invErr.message) ? "Ordren overstiger tilgjengelig kreditt." : "Fakturakjøp kunne ikke gjennomføres. Kontakt kundeservice.",
      };
    }
    await sendOrderConfirmation(orderId);
    await audit({ action: "order.invoice_placed", actorId: ctx.userId, entityType: "order", entityId: orderId, details: { total_ore: totals.total_ore, ex_vat_ore: exVat(totals.total_ore) } });
    return { ok: true, redirectUrl: confirmUrl };
  } catch (err) {
    console.error("Betaling kunne ikke startes", err);
    await releaseOrder(orderId, "Betaling kunne ikke startes");
    return { ok: false, message: "Betalingen kunne ikke startes. Ingen beløp er trukket. Prøv igjen." };
  }
}
