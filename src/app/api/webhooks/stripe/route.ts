import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { integrations } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/payments/stripe";
import { markOrderPaid, releaseOrder } from "@/lib/orders";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * Stripe webhook. Signaturen verifiseres mot STRIPE_WEBHOOK_SECRET på rå body.
 * Hendelser behandles idempotent (payment_events har hendelses-ID som primærnøkkel).
 */
export async function POST(request: Request) {
  if (!integrations.stripe() || !integrations.supabaseAdmin()) {
    return NextResponse.json({ error: "Ikke konfigurert" }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Mangler signatur" }, { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Ugyldig signatur" }, { status: 400 });
  }

  const admin = createAdminClient();
  const orderIdFrom = (obj: { metadata?: Stripe.Metadata | null; client_reference_id?: string | null }) =>
    obj.metadata?.order_id ?? obj.client_reference_id ?? null;

  // Idempotens: registrer hendelsen først; finnes den allerede er den behandlet.
  const relatedOrder =
    event.type.startsWith("checkout.session") ? orderIdFrom(event.data.object as Stripe.Checkout.Session) : null;
  const { error: dupErr } = await admin
    .from("payment_events")
    .insert({ id: event.id, provider: "stripe", type: event.type, order_id: relatedOrder, payload: { id: event.id, type: event.type } });
  if (dupErr) {
    if (dupErr.code === "23505") return NextResponse.json({ received: true, duplicate: true });
    console.error("Kunne ikke lagre payment_event", dupErr);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = orderIdFrom(session);
        if (orderId && session.payment_status === "paid") {
          const result = await markOrderPaid({
            orderId,
            provider: "stripe",
            reference: session.id,
            paymentIntent: typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null),
            amountOre: session.amount_total ?? 0,
          });
          await audit({ action: "payment.confirmed", entityType: "order", entityId: orderId, details: { provider: "stripe", result } });
        }
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const orderId = orderIdFrom(event.data.object as Stripe.Checkout.Session);
        if (orderId) await releaseOrder(orderId, event.type === "checkout.session.expired" ? "Betalingsøkten utløp" : "Betalingen feilet");
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const orderId = charge.metadata?.order_id;
        const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        const full = charge.amount_refunded >= charge.amount;
        const query = admin.from("orders").update({ payment_status: full ? "refunded" : "partially_refunded", ...(full ? { status: "refunded" } : {}) });
        if (orderId) await query.eq("id", orderId);
        else if (pi) await query.eq("payment_intent_id", pi);
        await audit({ action: "payment.refunded", entityType: "order", entityId: orderId ?? pi ?? null, details: { amount_refunded: charge.amount_refunded } });
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("Feil ved behandling av Stripe-hendelse", event.type, err);
    // Fjern idempotensmarkøren slik at Stripe kan prøve igjen
    await admin.from("payment_events").delete().eq("id", event.id);
    return NextResponse.json({ error: "Behandling feilet" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
