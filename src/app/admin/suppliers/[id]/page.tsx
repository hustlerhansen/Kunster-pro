import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Panel, Empty } from "@/components/admin/ui";
import { SupplierForm, type SupplierRow } from "@/components/admin/supplier-form";
import { ActionForm, Check, Select, TextInput } from "@/components/admin/form-controls";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { createPurchaseOrder, importSupplierProductsCsv, saveSupplierProduct } from "../../_actions/supply";

export const metadata = { title: "Leverandør" };

export default async function SupplierDetail({ params }: PageProps<"/admin/suppliers/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: supplier }, { data: products }, { data: variants }, { data: pos }] = await Promise.all([
    supabase.from("suppliers").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("supplier_products")
      .select("*, variant:product_variants(sku, name, product:products(name)), history:supplier_price_history(purchase_price, currency, recorded_at)")
      .eq("supplier_id", id),
    supabase.from("product_variants").select("id, sku, name, product:products(name)").order("sku"),
    supabase.from("purchase_orders").select("id, po_number, status, expected_at, created_at").eq("supplier_id", id).order("created_at", { ascending: false }).limit(20),
  ]);
  if (!supplier) notFound();
  const rows = (products ?? []) as unknown as {
    id: string; variant_id: string; supplier_sku: string | null; purchase_price: number; currency: string; min_order_quantity: number; is_preferred: boolean;
    variant: { sku: string; name: string; product: { name: string } }; history: { purchase_price: number; currency: string; recorded_at: string }[];
  }[];
  return (
    <div className="space-y-6">
      <PageHeader
        title={supplier.name}
        description={supplier.is_demo ? <Badge variant="warning">DEMO-leverandør</Badge> : undefined}
        actions={
          <ActionForm action={createPurchaseOrder} submitLabel="+ Ny innkjøpsordre">
            <input type="hidden" name="supplier_id" value={supplier.id} />
          </ActionForm>
        }
      />
      <Panel title="Leverandørinformasjon">
        <SupplierForm s={supplier as SupplierRow} />
      </Panel>
      <Panel title={`Produkter og innkjøpspriser (${rows.length})`}>
        {rows.length === 0 && <Empty>Ingen produkter knyttet til leverandøren.</Empty>}
        <div className="divide-y">
          {rows.map((r) => (
            <details key={r.id} className="py-2">
              <summary className="flex cursor-pointer flex-wrap gap-x-5 text-sm">
                <span className="min-w-64 font-medium">
                  {r.variant.product.name} – {r.variant.name}
                </span>
                <span className="text-muted-foreground">{r.variant.sku}</span>
                <span>
                  {Number(r.purchase_price).toLocaleString("nb-NO")} {r.currency}
                </span>
                <span>MOQ {r.min_order_quantity}</span>
                {r.is_preferred && <Badge variant="gold">Foretrukket</Badge>}
              </summary>
              <div className="mt-2 grid gap-4 lg:grid-cols-2">
                <ActionForm action={saveSupplierProduct}>
                  <input type="hidden" name="supplier_id" value={supplier.id} />
                  <input type="hidden" name="variant_id" value={r.variant_id} />
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <TextInput label="Lev. varenr." name="supplier_sku" defaultValue={r.supplier_sku ?? ""} />
                    <TextInput label="Innkjøpspris" name="purchase_price" defaultValue={String(r.purchase_price)} />
                    <TextInput label="Valuta" name="currency" defaultValue={r.currency} maxLength={3} />
                    <TextInput label="Min. antall" name="min_order_quantity" type="number" defaultValue={r.min_order_quantity} />
                  </div>
                  <Check label="Foretrukket leverandør for varianten" name="is_preferred" defaultChecked={r.is_preferred} />
                </ActionForm>
                <div className="text-sm">
                  <p className="font-medium">Historiske innkjøpspriser</p>
                  <ul className="mt-1 text-muted-foreground">
                    {r.history
                      .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
                      .map((h, i) => (
                        <li key={i}>
                          {formatDate(h.recorded_at)}: {Number(h.purchase_price).toLocaleString("nb-NO")} {h.currency}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </details>
          ))}
        </div>
      </Panel>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Knytt variant til leverandør">
          <ActionForm action={saveSupplierProduct} submitLabel="Legg til">
            <input type="hidden" name="supplier_id" value={supplier.id} />
            <Select label="Variant" name="variant_id" options={((variants ?? []) as unknown as { id: string; sku: string; name: string; product: { name: string } }[]).map((v) => ({ value: v.id, label: `${v.sku} – ${v.product.name} ${v.name}` }))} />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <TextInput label="Lev. varenr." name="supplier_sku" />
              <TextInput label="Innkjøpspris" name="purchase_price" required />
              <TextInput label="Valuta" name="currency" defaultValue={supplier.currency} maxLength={3} />
              <TextInput label="Min. antall" name="min_order_quantity" type="number" defaultValue="1" />
            </div>
            <Check label="Foretrukket leverandør" name="is_preferred" />
          </ActionForm>
        </Panel>
        <Panel title="Importer innkjøpspriser (CSV)">
          <p className="mb-3 text-xs text-muted-foreground">
            Kolonner: <code>sku;leverandor_sku;innkjopspris;valuta;minimum</code>. SKU må finnes i katalogen.
          </p>
          <ActionForm action={importSupplierProductsCsv} submitLabel="Importer">
            <input type="hidden" name="supplier_id" value={supplier.id} />
            <Input type="file" name="file" accept=".csv,text/csv" required />
          </ActionForm>
        </Panel>
      </div>
      <Panel title="Innkjøpsordrer">
        <ul className="divide-y text-sm">
          {pos?.map((p) => (
            <li key={p.id} className="flex gap-4 py-2">
              <Link href={`/admin/innkjop/${p.id}`} className="underline">IO-{p.po_number}</Link>
              <span>{p.status}</span>
              <span className="text-muted-foreground">{p.expected_at ? `Forventet ${formatDate(p.expected_at)}` : ""}</span>
            </li>
          ))}
          {!pos?.length && <li className="text-muted-foreground">Ingen innkjøpsordrer.</li>}
        </ul>
      </Panel>
    </div>
  );
}
