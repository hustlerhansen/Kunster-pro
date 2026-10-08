import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { PageHeader, Panel, StatCard, Empty } from "@/components/admin/ui";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { integrations } from "@/lib/env";
import { formatPrice } from "@/lib/money";
import { formatPercent } from "@/lib/pricing/profit";
import { expireStaleOrders } from "./_actions/orders";

interface Stats {
  revenue_today_ore: number;
  revenue_month_ore: number;
  orders_today: number;
  orders_month: number;
  avg_order_value_ore: number;
  revenue_month_ex_vat_ore: number;
  gross_profit_month_ore: number;
  pending_payment_orders: number;
  orders_to_ship: number;
  new_customers_month: number;
  unpaid_invoices_count: number;
  unpaid_invoices_ore: number;
  overdue_invoices_count: number;
  open_credit_applications: number;
  open_returns: number;
  best_sellers: { product_id: string; name: string; units: number; revenue_ore: number }[];
  low_stock: { id: string; sku: string; product_name: string; variant_name: string; stock_available: number; min_stock: number }[];
}

export default async function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data, error }, { count: demoCount }] = await Promise.all([
    supabase.rpc("admin_dashboard_stats"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_demo", true).neq("status", "archived"),
  ]);
  const s = data as Stats | null;
  const missing = [
    !integrations.supabaseAdmin() && "SUPABASE_SERVICE_ROLE_KEY",
    !integrations.stripe() && "Stripe (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)",
    !integrations.resend() && "Resend (RESEND_API_KEY, EMAIL_FROM)",
    !integrations.cron() && "CRON_SECRET",
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashbord" description="Nøkkeltall er basert på betalte/fakturerte ordre. Ingen tall er simulert." />
      {sp.feil === "krever-administrator" && <Alert variant="destructive">Denne funksjonen krever administratorrolle.</Alert>}
      {(demoCount ?? 0) > 0 && (
        <Alert variant="warning">
          <AlertTriangle />
          <div>
            {demoCount} aktive produkter er merket <strong>DEMO</strong> (fiktive produkter og priser). Erstatt eller arkiver dem før lansering.{" "}
            <Link href="/admin/produkter?demo=1" className="underline">Se demoprodukter</Link>
          </div>
        </Alert>
      )}
      {missing.length > 0 && (
        <Alert variant="info">
          <div>
            <strong>Integrasjoner som ikke er konfigurert:</strong> {missing.join(" · ")}. Se <code>docs/MILJOVARIABLER.md</code>.
          </div>
        </Alert>
      )}
      {error || !s ? (
        <Alert variant="destructive">Kunne ikke hente nøkkeltall: {error?.message}</Alert>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Omsetning i dag" value={formatPrice(s.revenue_today_ore)} hint={`${s.orders_today} ordre`} />
            <StatCard label="Omsetning denne måneden" value={formatPrice(s.revenue_month_ore)} hint={`inkl. MVA · ${formatPrice(s.revenue_month_ex_vat_ore)} ekskl.`} />
            <StatCard label="Antall ordre (måned)" value={s.orders_month} href="/admin/ordrer" />
            <StatCard label="Gj.snittlig ordreverdi" value={formatPrice(s.avg_order_value_ore)} hint="denne måneden" />
            <StatCard
              label="Bruttofortjeneste (måned)"
              value={formatPrice(s.gross_profit_month_ore)}
              hint={`Bruttomargin ${formatPercent(s.revenue_month_ex_vat_ore ? s.gross_profit_month_ore / s.revenue_month_ex_vat_ore : null)}`}
              href="/admin/lonnsomhet"
            />
            <StatCard label="Nye kunder (måned)" value={s.new_customers_month} href="/admin/kunder" />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <StatCard label="Ordre som skal sendes" value={s.orders_to_ship} href="/admin/ordrer?status=paid" tone={s.orders_to_ship ? "warning" : undefined} />
            <StatCard label="Venter på betaling" value={s.pending_payment_orders} href="/admin/ordrer?status=pending_payment" />
            <StatCard
              label="Ubetalte fakturaer"
              value={formatPrice(s.unpaid_invoices_ore)}
              hint={`${s.unpaid_invoices_count} stk${s.overdue_invoices_count ? ` · ${s.overdue_invoices_count} forfalt` : ""}`}
              href="/admin/fakturaer"
              tone={s.overdue_invoices_count ? "danger" : undefined}
            />
            <StatCard label="Kredittsøknader" value={s.open_credit_applications} href="/admin/handlekontoer" tone={s.open_credit_applications ? "warning" : undefined} />
            <StatCard label="Åpne returer" value={s.open_returns} href="/admin/returer" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Bestselgere siste 30 dager">
              {s.best_sellers.length ? (
                <ol className="divide-y text-sm">
                  {s.best_sellers.map((b, i) => (
                    <li key={b.product_id ?? i} className="flex justify-between gap-3 py-2">
                      <span>
                        {i + 1}. {b.name}
                      </span>
                      <span className="text-muted-foreground">
                        {b.units} stk · {formatPrice(b.revenue_ore)}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <Empty>Ingen salg registrert ennå.</Empty>
              )}
            </Panel>
            <Panel title="Lav lagerbeholdning" actions={<Link href="/admin/lager" className="text-xs underline">Innkjøpsforslag</Link>}>
              {s.low_stock.length ? (
                <ul className="divide-y text-sm">
                  {s.low_stock.map((v) => (
                    <li key={v.id} className="flex justify-between gap-3 py-2">
                      <span>
                        {v.product_name} – {v.variant_name} <span className="text-xs text-muted-foreground">({v.sku})</span>
                      </span>
                      <span className={v.stock_available <= 0 ? "font-semibold text-destructive" : "text-warning"}>
                        {v.stock_available} / min {v.min_stock}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>Ingen varer under minimumsbeholdning.</Empty>
              )}
            </Panel>
          </div>
          {s.pending_payment_orders > 0 && (
            <form action={expireStaleOrders}>
              <Button variant="outline" size="sm">
                Frigjør utløpte lagerreservasjoner nå
              </Button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
