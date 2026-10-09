import "server-only";
import Stripe from "stripe";
import { integrations } from "@/lib/env";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!integrations.stripe()) throw new Error("Stripe er ikke konfigurert (STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET).");
  // STRIPE_API_URL brukes kun i test (lokal etterligning av Stripe). Aldri satt i produksjon.
  const override = process.env.STRIPE_API_URL && process.env.VERCEL_ENV !== "production" ? new URL(process.env.STRIPE_API_URL) : null;
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY!, {
    appInfo: { name: "Kunstner Pro" },
    ...(override ? { protocol: (override.protocol === "https:" ? "https" : "http") as "http" | "https", host: override.hostname, port: override.port } : {}),
  });
  return client;
}

export interface CheckoutLine {
  name: string;
  amountOre: number;
}

/**
 * Oppretter Stripe Checkout-økt. Hver ordrelinje sendes med sin endelige linjesum
 * (etter mengderabatt), slik at totalen i Stripe alltid er identisk med ordren.
 * Ordrerabatt sendes som engangskupong.
 */
export async function createStripeCheckout(opts: {
  orderId: string;
  orderNumber: number;
  email: string;
  lines: CheckoutLine[];
  shipping: { name: string; amountOre: number } | null;
  discountOre: number;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = opts.lines.map((l) => ({
    quantity: 1,
    price_data: { currency: "nok", unit_amount: l.amountOre, product_data: { name: l.name.slice(0, 250) } },
  }));
  if (opts.shipping && opts.shipping.amountOre > 0) {
    line_items.push({
      quantity: 1,
      price_data: { currency: "nok", unit_amount: opts.shipping.amountOre, product_data: { name: `Frakt – ${opts.shipping.name}` } },
    });
  }
  let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
  if (opts.discountOre > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: opts.discountOre,
      currency: "nok",
      duration: "once",
      max_redemptions: 1,
      name: `Rabatt ordre ${opts.orderNumber}`,
    });
    discounts = [{ coupon: coupon.id }];
  }
  return stripe.checkout.sessions.create(
    {
      mode: "payment",
      locale: "nb",
      currency: "nok",
      customer_email: opts.email,
      client_reference_id: opts.orderId,
      metadata: { order_id: opts.orderId, order_number: String(opts.orderNumber) },
      payment_intent_data: { metadata: { order_id: opts.orderId, order_number: String(opts.orderNumber) } },
      line_items,
      discounts,
      success_url: opts.successUrl,
      cancel_url: opts.cancelUrl,
      // Stripe krever minst 30 min. Lagerreservasjonen i databasen varer litt lenger (35 min).
      expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    },
    { idempotencyKey: `checkout-${opts.orderId}` },
  );
}
