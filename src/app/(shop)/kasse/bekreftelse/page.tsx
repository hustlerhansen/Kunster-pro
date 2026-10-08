import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClearCart } from "@/components/shop/cart/clear-cart";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { integrations } from "@/lib/env";
import { formatPrice } from "@/lib/money";
import { markOrderPaid } from "@/lib/orders";
import { getStripe } from "@/lib/payments/stripe";
import { getVippsPayment } from "@/lib/payments/vipps";

export const metadata: Metadata = { title: "Ordrebekreftelse", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ConfirmationPage({ searchParams }: PageProps<"/kasse/bekreftelse">) {
  const sp = await searchParams;
  const orderId = typeof sp.ordre === "string" ? sp.ordre : "";
  if (!/^[0-9a-f-]{36}$/i.test(orderId) || !integrations.supabaseAdmin()) notFound();

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, order_number, user_id, status, payment_status, payment_method, payment_provider, payment_reference, total_ore, email, customer_name")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) notFound();

  // Tilgang: eier av ordren eller samme nettleser som la inn ordren
  const user = await getCurrentUser();
  const jar = await cookies();
  if (order.user_id ? order.user_id !== user?.id && jar.get("kp_order")?.value !== order.id : jar.get("kp_order")?.value !== order.id) notFound();

  let status = order.payment_status as string;
  // Fallback hvis webhook er forsinket: spør betalingsleverandøren direkte (aldri basert på URL alene)
  if (status === "pending") {
    try {
      if (order.payment_provider === "stripe" && integrations.stripe() && order.payment_reference) {
        const session = await getStripe().checkout.sessions.retrieve(order.payment_reference);
        if (session.payment_status === "paid" && session.metadata?.order_id === order.id) {
          await markOrderPaid({
            orderId: order.id,
            provider: "stripe",
            reference: session.id,
            paymentIntent: typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null),
            amountOre: session.amount_total ?? 0,
          });
          status = "paid";
        }
      } else if (order.payment_provider === "vipps" && integrations.vipps() && order.payment_reference) {
        const p = await getVippsPayment(order.payment_reference);
        if (p.state === "AUTHORIZED") {
          await markOrderPaid({ orderId: order.id, provider: "vipps", reference: order.payment_reference, paymentIntent: null, amountOre: p.aggregate.authorizedAmount.value });
          status = "paid";
        }
      }
    } catch (err) {
      console.error("Kunne ikke verifisere betaling", err);
    }
  }

  const success = status === "paid" || status === "invoiced";
  const failed = status === "failed" || order.status === "cancelled";
  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-xl rounded-lg border bg-white p-8 text-center">
        {success ? (
          <CheckCircle2 className="mx-auto size-14 text-success" />
        ) : failed ? (
          <XCircle className="mx-auto size-14 text-destructive" />
        ) : (
          <Clock className="mx-auto size-14 text-warning" />
        )}
        <h1 className="mt-4 text-3xl font-semibold">
          {success ? "Takk for bestillingen!" : failed ? "Betalingen ble ikke fullført" : "Vi venter på bekreftelse av betalingen"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          Ordrenummer <strong className="text-foreground">#{order.order_number}</strong> · {formatPrice(order.total_ore)}
        </p>
        <p className="mt-4 text-sm">
          {success
            ? `Ordrebekreftelse er sendt til ${order.email}. Du får beskjed når pakken er sendt.`
            : failed
              ? "Ordren er kansellert og reserverte varer er frigitt. Ingen beløp er trukket."
              : "Dette tar vanligvis bare noen sekunder. Oppdater siden om litt. Du får e-post når betalingen er bekreftet."}
        </p>
        {!failed && <ClearCart orderNumber={order.order_number} totalOre={order.total_ore} />}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {order.user_id && (
            <Button asChild>
              <Link href={`/konto/bestillinger/${order.id}`}>Se bestillingen</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href={failed ? "/handlekurv" : "/produkter"}>{failed ? "Tilbake til handlekurven" : "Fortsett å handle"}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
