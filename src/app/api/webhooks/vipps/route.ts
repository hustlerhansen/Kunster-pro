import { NextResponse } from "next/server";
import { integrations } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVippsPayment, verifyVippsWebhook } from "@/lib/payments/vipps";
import { markOrderPaid, releaseOrder } from "@/lib/orders";

export const runtime = "nodejs";

/** Vipps ePayment webhook (forberedt). Signatur verifiseres, og status hentes alltid fra Vipps API. */
export async function POST(request: Request) {
  if (!integrations.vipps() || !integrations.supabaseAdmin()) return NextResponse.json({ error: "Ikke aktivert" }, { status: 503 });
  const body = await request.text();
  const url = new URL(request.url);
  const ok = verifyVippsWebhook({
    body,
    pathAndQuery: url.pathname + url.search,
    host: request.headers.get("host") ?? url.host,
    date: request.headers.get("x-ms-date"),
    contentSha256: request.headers.get("x-ms-content-sha256"),
    authorization: request.headers.get("authorization"),
  });
  if (!ok) return NextResponse.json({ error: "Ugyldig signatur" }, { status: 401 });

  const event = JSON.parse(body) as { reference?: string; name?: string; pspReference?: string };
  if (!event.reference) return NextResponse.json({ received: true });
  const admin = createAdminClient();
  const eventId = `vipps:${event.pspReference ?? event.reference}:${event.name}`;
  const { error: dup } = await admin.from("payment_events").insert({ id: eventId, provider: "vipps", type: event.name ?? "unknown" });
  if (dup?.code === "23505") return NextResponse.json({ received: true, duplicate: true });

  const { data: order } = await admin.from("orders").select("id, total_ore").eq("payment_reference", event.reference).maybeSingle();
  if (!order) return NextResponse.json({ received: true });

  // Stol aldri på innholdet alene – hent faktisk status fra Vipps
  const payment = await getVippsPayment(event.reference);
  if (payment.state === "AUTHORIZED") {
    await markOrderPaid({ orderId: order.id, provider: "vipps", reference: event.reference, paymentIntent: null, amountOre: payment.aggregate.authorizedAmount.value });
  } else if (["ABORTED", "EXPIRED", "TERMINATED"].includes(payment.state)) {
    await releaseOrder(order.id, `Vipps-betaling ${payment.state.toLowerCase()}`);
  }
  return NextResponse.json({ received: true });
}
