import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Panel } from "@/components/admin/ui";
import { ActionForm, Select, TextArea, TextInput } from "@/components/admin/form-controls";
import { Alert } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/server";
import { formatPriceExact } from "@/lib/money";
import { addPurchaseOrderItem, receivePurchaseOrder, removePurchaseOrderItem, updatePurchaseOrder } from "../../_actions/supply";

export const metadata = { title: "Innkjøpsordre" };
const PO_STATUS: Record<string, string> = { draft: "Utkast", sent: "Sendt", confirmed: "Bekreftet", shipped: "Under transport", received: "Mottatt", cancelled: "Kansellert" };

export default async function PurchaseOrderDetail({ params }: PageProps<"/admin/innkjop/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: po } = await supabase
    .from("purchase_orders")
    .select("*, supplier:suppliers(id, name, currency), items:purchase_order_items(*, variant:product_variants(sku, name, product:products!product_variants_product_id_fkey(name)))")
    .eq("id", id)
    .maybeSingle();
  if (!po) notFound();
  const supplier = po.supplier as { id: string; name: string; currency: string };
  const { data: supplierProducts } = await supabase
    .from("supplier_products")
    .select("variant_id, purchase_price, variant:product_variants(sku, name, product:products!product_variants_product_id_fkey(name))")
    .eq("supplier_id", supplier.id);
  const items = po.items as { id: string; quantity: number; unit_price: number; received_quantity: number; variant: { sku: string; name: string; product: { name: string } } }[];
  const goodsValue = items.reduce((s, i) => s + i.quantity * Number(i.unit_price), 0);
  const goodsNokOre = Math.round(goodsValue * Number(po.exchange_rate) * 100);
  const extras = po.freight_cost_ore + po.duty_cost_ore + po.other_cost_ore;
  const receivable = ["sent", "confirmed", "shipped"].includes(po.status);

  return (
    <div className="space-y-6">
      <PageHeader title={`Innkjøpsordre IO-${po.po_number}`} description={<>Leverandør: <Link href={`/admin/suppliers/${supplier.id}`} className="underline">{supplier.name}</Link> · Status: {PO_STATUS[po.status]}</>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Panel title="Linjer">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="pb-2">Variant</th>
                <th className="pb-2 text-right">Antall</th>
                <th className="pb-2 text-right">Stykkpris ({po.currency})</th>
                <th className="pb-2 text-right">Sum</th>
                <th className="pb-2 text-right">Mottatt</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((i) => (
                <tr key={i.id}>
                  <td className="py-2">
                    {i.variant.product.name} – {i.variant.name} <span className="text-xs text-muted-foreground">{i.variant.sku}</span>
                  </td>
                  <td className="py-2 text-right">{i.quantity}</td>
                  <td className="py-2 text-right">{Number(i.unit_price).toLocaleString("nb-NO")}</td>
                  <td className="py-2 text-right">{(i.quantity * Number(i.unit_price)).toLocaleString("nb-NO", { maximumFractionDigits: 2 })}</td>
                  <td className="py-2 text-right">{i.received_quantity}</td>
                  <td className="py-2 text-right">
                    {po.status === "draft" && (
                      <form action={removePurchaseOrderItem}>
                        <input type="hidden" name="id" value={i.id} />
                        <input type="hidden" name="purchase_order_id" value={po.id} />
                        <button className="text-xs text-destructive underline">Fjern</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="mt-4 ml-auto max-w-sm space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between"><dt>Vareverdi</dt><dd>{goodsValue.toLocaleString("nb-NO", { maximumFractionDigits: 2 })} {po.currency}</dd></div>
            <div className="flex justify-between"><dt>Vareverdi i NOK (kurs {Number(po.exchange_rate)})</dt><dd>{formatPriceExact(goodsNokOre)}</dd></div>
            <div className="flex justify-between"><dt>Frakt + toll + andre</dt><dd>{formatPriceExact(extras)}</dd></div>
            <div className="flex justify-between font-semibold"><dt>Total innkjøpskost (landed)</dt><dd>{formatPriceExact(goodsNokOre + extras)}</dd></div>
          </dl>

          {po.status === "draft" && (
            <ActionForm action={addPurchaseOrderItem} submitLabel="Legg til linje" className="mt-6 border-t pt-4">
              <input type="hidden" name="purchase_order_id" value={po.id} />
              <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
                <Select
                  label="Variant (fra leverandørens produkter)"
                  name="variant_id"
                  options={((supplierProducts ?? []) as unknown as { variant_id: string; purchase_price: number; variant: { sku: string; name: string; product: { name: string } } }[]).map((s) => ({
                    value: s.variant_id,
                    label: `${s.variant.sku} – ${s.variant.product.name} ${s.variant.name} (${Number(s.purchase_price)} ${supplier.currency})`,
                  }))}
                />
                <TextInput label="Antall" name="quantity" type="number" required />
                <TextInput label={`Stykkpris (${po.currency})`} name="unit_price" required />
              </div>
            </ActionForm>
          )}

          {receivable && (
            <div className="mt-6 border-t pt-4">
              <h3 className="mb-2 text-sm font-semibold">Varemottak</h3>
              <ActionForm action={receivePurchaseOrder} submitLabel="Registrer mottak">
                <input type="hidden" name="purchase_order_id" value={po.id} />
                {items
                  .filter((i) => i.received_quantity < i.quantity)
                  .map((i) => (
                    <TextInput key={i.id} label={`${i.variant.sku} (gjenstår ${i.quantity - i.received_quantity})`} name={`recv_${i.id}`} type="number" min={0} max={i.quantity - i.received_quantity} defaultValue={i.quantity - i.received_quantity} />
                  ))}
                <p className="text-xs text-muted-foreground">Mottak øker lagerbeholdningen og oppdaterer kostprofilen (siste innkjøpskost inkl. fordelte kostnader). Husk å registrere frakt, toll og valutakurs før mottak.</p>
              </ActionForm>
            </div>
          )}
          {po.status === "draft" && <Alert variant="info" className="mt-4">Sett status til «Sendt» når ordren er sendt til leverandør. Varemottak er mulig fra status Sendt.</Alert>}
        </Panel>

        <Panel title="Detaljer og kostnader">
          <ActionForm action={updatePurchaseOrder}>
            <input type="hidden" name="id" value={po.id} />
            <Select label="Status" name="status" defaultValue={po.status === "received" ? "shipped" : po.status} options={Object.entries(PO_STATUS).filter(([k]) => k !== "received").map(([value, label]) => ({ value, label }))} />
            <div className="grid grid-cols-2 gap-3">
              <TextInput label="Valuta" name="currency" defaultValue={po.currency} maxLength={3} />
              <TextInput label="Valutakurs (NOK)" name="exchange_rate" defaultValue={String(po.exchange_rate)} />
              <TextInput label="Frakt (kr)" name="freight" defaultValue={String(po.freight_cost_ore / 100)} />
              <TextInput label="Toll/avgifter (kr)" name="duty" defaultValue={String(po.duty_cost_ore / 100)} hint="Ikke fradragsberettiget import-MVA" />
              <TextInput label="Andre kostnader (kr)" name="other" defaultValue={String(po.other_cost_ore / 100)} />
              <TextInput label="Forventet levering" name="expected_at" type="date" defaultValue={po.expected_at ?? ""} />
            </div>
            <TextArea label="Notater" name="notes" defaultValue={po.notes ?? ""} rows={3} />
          </ActionForm>
        </Panel>
      </div>
    </div>
  );
}
