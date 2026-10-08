import Link from "next/link";
import { PageHeader, Panel, StatCard, Empty } from "@/components/admin/ui";
import { ActionForm, Select, TextInput } from "@/components/admin/form-controls";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/money";
import { adjustStock, createPurchaseOrdersFromSuggestions, setMinStock } from "../_actions/supply";

export const metadata = { title: "Lager" };

interface Suggestion {
  variant_id: string; sku: string; product_name: string; variant_name: string; stock_available: number; min_stock: number; incoming: number;
  avg_daily_sales: number; lead_time_days: number; supplier_id: string | null; supplier_name: string | null; suggested_quantity: number;
}

export default async function AdminInventory() {
  const supabase = await createClient();
  const [{ data: variants }, { data: suggestions }, { data: movements }] = await Promise.all([
    supabase.from("variant_profitability").select("variant_id, sku, product_name, variant_name, stock_on_hand, landed_cost_ore, stock_value_ore, is_demo").order("product_name"),
    supabase.rpc("reorder_suggestions", { p_history_days: 90, p_safety_days: 14 }),
    supabase.from("inventory_movements").select("id, quantity_change, reason, note, created_at, variant:product_variants(sku)").order("created_at", { ascending: false }).limit(25),
  ]);
  const { data: stock } = await supabase.from("product_variants").select("id, stock_on_hand, stock_reserved, stock_available, min_stock, reorder_quantity");
  const stockMap = new Map((stock ?? []).map((s) => [s.id, s]));
  const rows = (variants ?? []) as { variant_id: string; sku: string; product_name: string; variant_name: string; stock_on_hand: number; landed_cost_ore: number | null; stock_value_ore: number; is_demo: boolean }[];
  const totalValue = rows.reduce((s, r) => s + Number(r.stock_value_ore ?? 0), 0);
  const sugg = (suggestions ?? []) as Suggestion[];
  const missingCost = rows.filter((r) => r.landed_cost_ore === null).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Lager" description="Beholdning, reservert (ubetalte ordre i kassen) og tilgjengelig. Alle endringer logges som lagerbevegelser." />
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Lagerverdi (landed cost)" value={formatPrice(totalValue)} hint={missingCost ? `${missingCost} varianter mangler kostpris` : undefined} />
        <StatCard label="Varianter" value={rows.length} />
        <StatCard label="Under minimum" value={sugg.filter((s) => s.stock_available <= s.min_stock).length} tone="warning" />
        <StatCard label="Innkjøpsforslag" value={sugg.filter((s) => s.suggested_quantity > 0).length} />
      </div>

      <Panel title="Foreslå ny bestilling">
        <p className="mb-3 text-sm text-muted-foreground">
          Forslag = gj.snittlig daglig salg (90 dager) × (leverandørens leveringstid + 14 dagers buffer) + minimumsbeholdning − tilgjengelig − innkommende. Avrundes opp til
          leverandørens minimumsantall.
        </p>
        {sugg.length === 0 ? (
          <Empty>Ingen varer trenger påfyll nå.</Empty>
        ) : (
          <ActionForm action={createPurchaseOrdersFromSuggestions} submitLabel="Opprett utkast til innkjøpsordre for valgte">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="pb-2" />
                  <th className="pb-2">Variant</th>
                  <th className="pb-2 text-right">Tilgj.</th>
                  <th className="pb-2 text-right">Min.</th>
                  <th className="pb-2 text-right">Innkommende</th>
                  <th className="pb-2 text-right">Salg/dag</th>
                  <th className="pb-2">Leverandør</th>
                  <th className="pb-2 text-right">Forslag</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sugg.map((s) => (
                  <tr key={s.variant_id}>
                    <td className="py-2">
                      <input type="checkbox" name="variant" value={s.variant_id} defaultChecked={s.suggested_quantity > 0 && Boolean(s.supplier_id)} disabled={!s.supplier_id} aria-label={`Velg ${s.sku}`} />
                    </td>
                    <td className="py-2">
                      {s.product_name} – {s.variant_name} <span className="text-xs text-muted-foreground">{s.sku}</span>
                    </td>
                    <td className={`py-2 text-right ${s.stock_available <= 0 ? "text-destructive" : ""}`}>{s.stock_available}</td>
                    <td className="py-2 text-right">{s.min_stock}</td>
                    <td className="py-2 text-right">{s.incoming}</td>
                    <td className="py-2 text-right">{Number(s.avg_daily_sales).toFixed(2)}</td>
                    <td className="py-2">{s.supplier_name ?? <Badge variant="warning">Mangler leverandør</Badge>} {s.supplier_name && <span className="text-xs text-muted-foreground">({s.lead_time_days} d)</span>}</td>
                    <td className="py-2 text-right font-semibold">{s.suggested_quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ActionForm>
        )}
      </Panel>

      <Panel title="Beholdning og justering">
        <div className="divide-y">
          {rows.map((r) => {
            const s = stockMap.get(r.variant_id);
            return (
              <details key={r.variant_id} className="py-2">
                <summary className="flex cursor-pointer flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                  <span className="min-w-64 font-medium">
                    {r.product_name} – {r.variant_name}
                  </span>
                  <span className="text-xs text-muted-foreground">{r.sku}</span>
                  {r.is_demo && <Badge variant="warning">DEMO</Badge>}
                  <span>Beholdning {s?.stock_on_hand}</span>
                  <span>Reservert {s?.stock_reserved}</span>
                  <span className={(s?.stock_available ?? 0) <= (s?.min_stock ?? 0) ? "font-semibold text-warning" : ""}>Tilgjengelig {s?.stock_available}</span>
                  <span className="text-muted-foreground">Min. {s?.min_stock}</span>
                  <span className="text-muted-foreground">Verdi {formatPrice(Number(r.stock_value_ore))}</span>
                </summary>
                <div className="mt-3 grid gap-4 lg:grid-cols-2">
                  <ActionForm action={adjustStock} submitLabel="Juster beholdning">
                    <input type="hidden" name="variant_id" value={r.variant_id} />
                    <input type="hidden" name="current" value={s?.stock_on_hand ?? 0} />
                    <div className="grid grid-cols-3 gap-3">
                      <Select label="Type" name="mode" options={[{ value: "delta", label: "Endring (+/−)" }, { value: "count", label: "Varetelling (ny beholdning)" }]} />
                      <TextInput label="Antall" name="value" type="number" required />
                      <Select label="Årsak" name="reason" options={[{ value: "adjustment", label: "Justering" }, { value: "damage", label: "Skadet/svinn" }, { value: "initial", label: "Startbeholdning" }, { value: "return", label: "Retur" }]} />
                    </div>
                    <TextInput label="Notat" name="note" />
                  </ActionForm>
                  <ActionForm action={setMinStock} submitLabel="Lagre minimum">
                    <input type="hidden" name="variant_id" value={r.variant_id} />
                    <div className="grid grid-cols-2 gap-3">
                      <TextInput label="Minimumsbeholdning" name="min_stock" type="number" defaultValue={s?.min_stock ?? 0} />
                      <TextInput label="Standard bestillingsantall" name="reorder_quantity" type="number" defaultValue={s?.reorder_quantity ?? ""} />
                    </div>
                  </ActionForm>
                </div>
              </details>
            );
          })}
        </div>
      </Panel>

      <Panel title="Siste lagerbevegelser">
        <ul className="divide-y text-sm">
          {((movements ?? []) as unknown as { id: number; quantity_change: number; reason: string; note: string | null; created_at: string; variant: { sku: string } | null }[]).map((m) => (
            <li key={m.id} className="flex flex-wrap gap-4 py-1.5">
              <span className="w-40 text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("nb-NO")}</span>
              <span className="w-48">{m.variant?.sku}</span>
              <span className={m.quantity_change < 0 ? "text-destructive" : "text-success"}>{m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}</span>
              <span>{m.reason}</span>
              {m.note && <span className="text-muted-foreground">{m.note}</span>}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs">
          Se også <Link href="/admin/innkjop" className="underline">innkjøpsordrer</Link>.
        </p>
      </Panel>
    </div>
  );
}
