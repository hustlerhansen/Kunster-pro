import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReorderButton } from "@/components/shop/reorder-button";
import { ReturnRequestForm } from "@/components/shop/return-request-form";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/money";
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, SHIPMENT_STATUS } from "@/lib/order-status";
import { formatDate } from "@/lib/utils";
import type { Address } from "@/lib/types";

export default async function OrderDetailPage({ params }: PageProps<"/konto/bestillinger/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*), order_events(id, event_type, message, created_at), shipments(*)")
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();
  const items = order.order_items as { id: string; product_name: string; variant_name: string | null; sku: string; quantity: number; unit_price_ore: number; discount_ore: number; line_total_ore: number }[];
  const events = (order.order_events as { id: number; message: string; created_at: string }[]).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const shipments = order.shipments as { id: string; carrier: string; tracking_number: string | null; tracking_url: string | null; status: string; shipped_at: string | null }[];
  const addr = order.shipping_address as Address;
  const canReturn = ["paid", "processing", "shipped", "delivered"].includes(order.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/konto/bestillinger" className="text-sm text-muted-foreground hover:underline">
            ← Alle bestillinger
          </Link>
          <h2 className="mt-1 text-2xl font-semibold">Ordre #{order.order_number}</h2>
          <p className="text-sm text-muted-foreground">Bestilt {formatDate(order.created_at, true)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={ORDER_STATUS[order.status]?.variant}>{ORDER_STATUS[order.status]?.label}</Badge>
          <Badge variant={PAYMENT_STATUS[order.payment_status]?.variant}>{PAYMENT_STATUS[order.payment_status]?.label}</Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <ReorderButton orderId={order.id} />
        {order.payment_status === "paid" || order.payment_status === "invoiced" ? (
          <a href={`/konto/fakturaer/${order.id}`} className="inline-flex h-10 items-center rounded-md border bg-white px-4 text-sm font-medium hover:bg-secondary">
            Kvittering
          </a>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Varer</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 py-3">
                <span>
                  {i.quantity} × {i.product_name}
                  {i.variant_name && <span className="text-muted-foreground"> – {i.variant_name}</span>}
                  {i.discount_ore > 0 && <span className="block text-xs text-success">Mengderabatt −{formatPrice(i.discount_ore)}</span>}
                </span>
                <span className="font-medium whitespace-nowrap">{formatPrice(i.line_total_ore)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t pt-4 text-sm">
            <Row label="Varer" value={formatPrice(order.subtotal_ore)} />
            {order.discount_ore > 0 && <Row label={`Rabatt${order.discount_code ? ` (${order.discount_code})` : ""}`} value={`−${formatPrice(order.discount_ore)}`} />}
            <Row label={`Frakt (${order.shipping_method_name ?? ""})`} value={order.shipping_ore ? formatPrice(order.shipping_ore) : "Gratis"} />
            <Row label="Totalt" value={formatPrice(order.total_ore)} bold />
            <Row label="Herav MVA" value={formatPrice(order.vat_ore)} />
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Levering</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              {addr.full_name}
              <br />
              {addr.line1}
              {addr.line2 && (
                <>
                  <br />
                  {addr.line2}
                </>
              )}
              <br />
              {addr.postal_code} {addr.city}
            </p>
            <p className="text-muted-foreground">Betaling: {PAYMENT_METHOD[order.payment_method] ?? order.payment_method}</p>
            {shipments.map((s) => (
              <div key={s.id} className="rounded-md border p-3">
                <p className="font-medium">
                  {s.carrier} – {SHIPMENT_STATUS[s.status] ?? s.status}
                </p>
                {s.tracking_number && <p>Sporingsnummer: {s.tracking_number}</p>}
                {s.tracking_url && (
                  <a href={s.tracking_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">
                    Spor pakken <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ordrehistorikk</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 border-l-2 border-gold/50 pl-4 text-sm">
              {events.map((e) => (
                <li key={e.id}>
                  <p className="font-medium">{e.message}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(e.created_at, true)}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {canReturn && (
        <Card>
          <CardHeader>
            <CardTitle>Angrerett eller reklamasjon</CardTitle>
          </CardHeader>
          <CardContent>
            <ReturnRequestForm orderId={order.id} items={items.map((i) => ({ id: i.id, name: `${i.product_name}${i.variant_name ? ` – ${i.variant_name}` : ""}`, quantity: i.quantity }))} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-semibold" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
