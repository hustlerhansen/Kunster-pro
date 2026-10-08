import Form from "next/form";
import { PageHeader, Panel, StatCard, Empty } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/money";
import { formatPercent, profit } from "@/lib/pricing/profit";

export const metadata = { title: "Lønnsomhet" };

interface ReportRow {
  product_id: string; product_name: string; units_sold: number; revenue_ex_vat_ore: number; cogs_ore: number; gross_profit_ore: number;
  variable_costs_ore: number; contribution_ore: number; contribution_ratio: number | null;
}
interface VariantRow {
  variant_id: string; sku: string; product_name: string; variant_name: string; is_demo: boolean; price_ore: number; vat_rate: number;
  price_ex_vat_ore: number; landed_cost_ore: number | null; variable_cost_ore: number;
}

export default async function AdminProfitability({ searchParams }: PageProps<"/admin/lonnsomhet">) {
  const sp = await searchParams;
  const today = new Date();
  const from = typeof sp.fra === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.fra) ? sp.fra : new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const to = typeof sp.til === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.til) ? sp.til : new Date(today.getTime() + 86400000).toISOString().slice(0, 10);
  const supabase = await createClient();
  const [{ data: report, error }, { data: variants }] = await Promise.all([
    supabase.rpc("profitability_report", { p_from: from, p_to: to }),
    supabase.from("variant_profitability").select("*"),
  ]);
  const rows = (report ?? []) as ReportRow[];
  const sum = (k: keyof ReportRow) => rows.reduce((s, r) => s + Number(r[k] ?? 0), 0);
  const revenue = sum("revenue_ex_vat_ore");
  const contribution = sum("contribution_ore");

  const potential = ((variants ?? []) as VariantRow[])
    .map((v) => ({
      ...v,
      calc: v.landed_cost_ore !== null ? profit({ priceInclVatOre: v.price_ore, vatRate: Number(v.vat_rate), landedCostOre: v.landed_cost_ore, packagingPerUnitOre: 0 }) : null,
      db: v.landed_cost_ore !== null ? v.price_ex_vat_ore - v.variable_cost_ore - v.landed_cost_ore : null,
    }))
    .sort((a, b) => (b.db ?? -Infinity) - (a.db ?? -Infinity));

  return (
    <div className="space-y-6">
      <PageHeader title="Innkjøp og lønnsomhet" description="Bruttofortjeneste = salgsinntekt ekskl. MVA − varekostnad (landed cost). Dekningsbidrag = salgsinntekt ekskl. MVA − variable kostnader. Dekningsgrad = DB / salgsinntekt ekskl. MVA." />
      <Form action="/admin/lonnsomhet" className="flex flex-wrap items-end gap-2">
        <label className="text-sm">
          Fra <Input type="date" name="fra" defaultValue={from} />
        </label>
        <label className="text-sm">
          Til <Input type="date" name="til" defaultValue={to} />
        </label>
        <Button variant="outline">Oppdater</Button>
      </Form>
      {error && <Alert variant="destructive">{error.message}</Alert>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Salgsinntekt ekskl. MVA" value={formatPrice(revenue)} />
        <StatCard label="Varekostnad (COGS)" value={formatPrice(sum("cogs_ore"))} />
        <StatCard label="Bruttofortjeneste" value={formatPrice(sum("gross_profit_ore"))} hint={`Margin ${formatPercent(revenue ? sum("gross_profit_ore") / revenue : null)}`} />
        <StatCard label="Dekningsbidrag" value={formatPrice(contribution)} />
        <StatCard label="Dekningsgrad" value={formatPercent(revenue ? contribution / revenue : null)} />
      </div>
      <p className="text-xs text-muted-foreground">Frakt som kunden betaler er ikke inkludert i produktrapporten. Kostnad per solgt enhet er låst på salgstidspunktet.</p>

      <Panel title="Solgte produkter – høyest dekningsbidrag først">
        {rows.length === 0 ? (
          <Empty>Ingen betalte ordre i perioden.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="pb-2">Produkt</th>
                <th className="pb-2 text-right">Solgt</th>
                <th className="pb-2 text-right">Inntekt ekskl. MVA</th>
                <th className="pb-2 text-right">Varekost</th>
                <th className="pb-2 text-right">Bruttofortj.</th>
                <th className="pb-2 text-right">DB</th>
                <th className="pb-2 text-right">DG</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.product_id}>
                  <td className="py-2">
                    {r.product_name} {Number(r.cogs_ore) === 0 && <Badge variant="warning">Mangler kostpris</Badge>}
                  </td>
                  <td className="py-2 text-right">{r.units_sold}</td>
                  <td className="py-2 text-right">{formatPrice(Number(r.revenue_ex_vat_ore))}</td>
                  <td className="py-2 text-right">{formatPrice(Number(r.cogs_ore))}</td>
                  <td className="py-2 text-right">{formatPrice(Number(r.gross_profit_ore))}</td>
                  <td className="py-2 text-right font-semibold">{formatPrice(Number(r.contribution_ore))}</td>
                  <td className="py-2 text-right">{formatPercent(r.contribution_ratio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title="Produkter med høyest dekningsbidrag per enhet (gjeldende pris og kost)">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr>
              <th className="pb-2">Variant</th>
              <th className="pb-2 text-right">Pris inkl. MVA</th>
              <th className="pb-2 text-right">Ekskl. MVA</th>
              <th className="pb-2 text-right">Landed cost</th>
              <th className="pb-2 text-right">DB/enhet</th>
              <th className="pb-2 text-right">DG</th>
              <th className="pb-2 text-right">Påslag</th>
              <th className="pb-2 text-right">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {potential.map((v) => (
              <tr key={v.variant_id}>
                <td className="py-2">
                  {v.product_name} – {v.variant_name} {v.is_demo && <Badge variant="warning">DEMO</Badge>}
                </td>
                <td className="py-2 text-right">{formatPrice(v.price_ore)}</td>
                <td className="py-2 text-right">{formatPrice(v.price_ex_vat_ore)}</td>
                <td className="py-2 text-right">{v.landed_cost_ore !== null ? formatPrice(v.landed_cost_ore) : <span className="text-warning">Mangler</span>}</td>
                <td className="py-2 text-right font-semibold">{v.db !== null ? formatPrice(v.db) : "–"}</td>
                <td className="py-2 text-right">{v.db !== null && v.price_ex_vat_ore ? formatPercent(v.db / v.price_ex_vat_ore) : "–"}</td>
                <td className="py-2 text-right">{formatPercent(v.calc?.markup ?? null)}</td>
                <td className="py-2 text-right">{formatPercent(v.calc?.grossMargin ?? null)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
