import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Panel } from "@/components/admin/ui";
import { ActionForm, Check, Select, TextInput } from "@/components/admin/form-controls";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatPriceExact } from "@/lib/money";
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, SHIPMENT_STATUS } from "@/lib/order-status";
import { formatDate } from "@/lib/utils";
import { addOrderNote, addShipment, refundOrder, updateOrderStatus, updateShipmentStatus } from "../../_actions/orders";
import type { Address } from "@/lib/types";

export const metadata = { title: "Ordre" };

export default async function AdminOrderDetail({ params }: PageProps<"/admin/ordrer/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*, cost:order_item_costs(*)), order_events(*), shipments(*), invoices(id, invoice_number, status, due_at), company:companies(id, name, org_number)")
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();
  const items = order.order_items as { id: string; product_name: string; variant_name: string | null; sku: string; quantity: number; unit_price_ore: number; discount_ore: number; line_total_ore: number; vat_rate: number; cost: { unit_cost_ore: number } | { unit_cost_ore: number }[] | null }[];
  const events = (order.order_events as { id: number; event_type: string; message: string; visible_to_customer: boolean; created_at: string }[]).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const shipments = order.shipments as { id: string; carrier: string; tracking_number: string | null; tracking_url: string | null; status: string; shipped_at: string | null }[];
  const ship = order.shipping_address as Address;
  const bill = (order.billing_address ?? order.shipping_address) as Address;
  const company = order.company as { id: string; name: string; org_number: string } | null;
  const invoice = (order.invoices as { id: string; invoice_number: number; status: string; due_at: string }[])[0];
  const cogs = items.reduce((s, i) => s + (Array.isArray(i.cost) ? i.cost[0]?.unit_cost_ore ?? 0 : i.cost?.unit_cost_ore ?? 0) * i.quantity, 0);
  const revenueEx = order.total_ore - order.vat_ore;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Ordre #${order.order_number}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {formatDate(order.created_at, true)}
            <Badge variant={ORDER_STATUS[order.status]?.variant}>{ORDER_STATUS[order.status]?.label}</Badge>
            <Badge variant={PAYMENT_STATUS[order.payment_status]?.variant}>{PAYMENT_STATUS[order.payment_status]?.label}</Badge>
            {PAYMENT_METHOD[order.payment_method]}
          </span>
        }
        actions={<Link href="/admin/ordrer" className="text-sm underline">← Alle ordrer</Link>}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel title="Varer">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="pb-2">Produkt</th>
                  <th className="pb-2">SKU</th>
                  <th className="pb-2 text-right">Antall</th>
                  <th className="pb-2 text-right">Pris</th>
                  <th className="pb-2 text-right">Rabatt</th>
                  <th className="pb-2 text-right">Sum</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((i) => (
                  <tr key={i.id}>
                    <td className="py-2">
                      {i.product_name} {i.variant_name && <span className="text-muted-foreground">– {i.variant_name}</span>}
                    </td>
                    <td className="py-2">{i.sku}</td>
                    <td className="py-2 text-right">{i.quantity}</td>
                    <td className="py-2 text-right">{formatPrice(i.unit_price_ore)}</td>
                    <td className="py-2 text-right">{i.discount_ore ? `−${formatPrice(i.discount_ore)}` : ""}</td>
                    <td className="py-2 text-right">{formatPrice(i.line_total_ore)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-4 ml-auto max-w-sm space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between"><dt>Varer</dt><dd>{formatPriceExact(order.subtotal_ore)}</dd></div>
              {order.discount_ore > 0 && <div className="flex justify-between"><dt>Rabattkode {order.discount_code}</dt><dd>−{formatPriceExact(order.discount_ore)}</dd></div>}
              <div className="flex justify-between"><dt>Frakt ({order.shipping_method_name})</dt><dd>{formatPriceExact(order.shipping_ore)}</dd></div>
              <div className="flex justify-between font-semibold"><dt>Totalt</dt><dd>{formatPriceExact(order.total_ore)}</dd></div>
              <div className="flex justify-between text-muted-foreground"><dt>MVA</dt><dd>{formatPriceExact(order.vat_ore)}</dd></div>
              <div className="flex justify-between text-muted-foreground"><dt>Varekost (landed)</dt><dd>{formatPriceExact(cogs)}</dd></div>
              <div className="flex justify-between text-muted-foreground"><dt>Bruttofortjeneste (inkl. frakt)</dt><dd>{formatPriceExact(revenueEx - cogs)}</dd></div>
            </dl>
          </Panel>

          <Panel title="Forsendelse og sporing">
            {shipments.map((s) => (
              <div key={s.id} className="mb-4 rounded-md border p-3 text-sm">
                <p className="font-medium">
                  {s.carrier} · {SHIPMENT_STATUS[s.status]} {s.shipped_at && <span className="text-muted-foreground">· sendt {formatDate(s.shipped_at)}</span>}
                </p>
                {s.tracking_number && (
                  <p>
                    Sporingsnummer: {s.tracking_url ? <a href={s.tracking_url} target="_blank" rel="noopener noreferrer" className="underline">{s.tracking_number}</a> : s.tracking_number}
                  </p>
                )}
                <ActionForm action={updateShipmentStatus} submitLabel="Oppdater leveringsstatus" className="mt-3 flex flex-wrap items-end gap-3 space-y-0">
                  <input type="hidden" name="shipment_id" value={s.id} />
                  <input type="hidden" name="order_id" value={order.id} />
                  <Select label="Leveringsstatus" name="status" defaultValue={s.status} options={Object.entries(SHIPMENT_STATUS).filter(([k]) => k !== "created").map(([value, label]) => ({ value, label }))} />
                  <Check label="Varsle kunden" name="notify" defaultChecked />
                </ActionForm>
              </div>
            ))}
            {["paid", "processing", "shipped"].includes(order.status) ? (
              <ActionForm action={addShipment} submitLabel="Registrer forsendelse og varsle kunden">
                <input type="hidden" name="order_id" value={order.id} />
                <div className="grid gap-3 md:grid-cols-4">
                  <Select label="Transportør" name="carrier" options={[{ value: "bring", label: "Posten/Bring" }, { value: "postnord", label: "PostNord" }, { value: "helthjem", label: "Helthjem" }, { value: "other", label: "Annen" }]} />
                  <TextInput label="Tjeneste" name="service" placeholder="F.eks. Pakke i postkassen" />
                  <TextInput label="Sporingsnummer" name="tracking_number" />
                  <TextInput label="Sporings-URL (valgfri)" name="tracking_url" placeholder="Genereres automatisk" />
                </div>
              </ActionForm>
            ) : (
              <p className="text-sm text-muted-foreground">Forsendelse kan registreres når ordren er betalt eller fakturert.</p>
            )}
          </Panel>

          <Panel title="Hendelser">
            <ActionForm action={addOrderNote} submitLabel="Legg til notat" className="mb-4">
              <input type="hidden" name="order_id" value={order.id} />
              <TextInput label="Internt notat" name="message" />
              <Check label="Synlig for kunden" name="visible" />
            </ActionForm>
            <ol className="space-y-2 text-sm">
              {events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="w-36 shrink-0 text-xs text-muted-foreground">{formatDate(e.created_at, true)}</span>
                  <span>
                    {e.message} {!e.visible_to_customer && <Badge variant="outline">Intern</Badge>}
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Kunde">
            <div className="space-y-3 text-sm">
              <p>
                <strong>{order.customer_name}</strong>
                <br />
                {order.email}
                <br />
                {order.phone}
              </p>
              {order.user_id && <Link href={`/admin/kunder/${order.user_id}`} className="underline">Se kundeprofil</Link>}
              {company && <p>Bedrift: {company.name} ({company.org_number})</p>}
              {order.purchase_reference && <p>Kundens referanse: {order.purchase_reference}</p>}
              {order.customer_note && <p className="rounded bg-secondary p-2">«{order.customer_note}»</p>}
              <div>
                <p className="font-medium">Leveringsadresse</p>
                <p>
                  {ship.full_name}
                  {ship.company_name && `, ${ship.company_name}`}
                  <br />
                  {ship.line1}
                  {ship.line2 && `, ${ship.line2}`}
                  <br />
                  {ship.postal_code} {ship.city}
                </p>
              </div>
              <div>
                <p className="font-medium">Fakturaadresse</p>
                <p>
                  {bill.full_name}
                  <br />
                  {bill.line1}, {bill.postal_code} {bill.city}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Betalingsreferanse: {order.payment_reference ?? "–"}
                {order.payment_intent_id && <><br />Payment intent: {order.payment_intent_id}</>}
                {order.paid_at && <><br />Betalt: {formatDate(order.paid_at, true)}</>}
              </p>
              {invoice && (
                <p>
                  Faktura #{invoice.invoice_number} · forfall {formatDate(invoice.due_at)} · <Link href="/admin/fakturaer" className="underline">{invoice.status}</Link>
                </p>
              )}
            </div>
          </Panel>
          <Panel title="Ordrestatus">
            <ActionForm action={updateOrderStatus} submitLabel="Oppdater status">
              <input type="hidden" name="order_id" value={order.id} />
              <Select
                label="Ny status"
                name="status"
                options={[
                  { value: "processing", label: "Under behandling" },
                  { value: "shipped", label: "Sendt (uten sporing)" },
                  { value: "delivered", label: "Levert" },
                  { value: "cancelled", label: "Kanseller" },
                ]}
              />
              <TextInput label="Kommentar" name="note" />
              <Check label="Varsle kunden på e-post" name="notify" />
            </ActionForm>
          </Panel>
          {order.payment_provider === "stripe" && order.payment_status === "paid" && (
            <Panel title="Refusjon (kort)">
              <ActionForm action={refundOrder} submitLabel="Refunder via Stripe" submitVariant="destructive">
                <input type="hidden" name="order_id" value={order.id} />
                <TextInput label="Beløp i kr (tom = hele beløpet)" name="amount" inputMode="decimal" />
                <TextInput label="Årsak" name="reason" />
              </ActionForm>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
