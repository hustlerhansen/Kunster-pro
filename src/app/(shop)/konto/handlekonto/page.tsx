import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompany } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { APPLICATION_STATUS, CREDIT_STATUS, INVOICE_STATUS } from "@/lib/order-status";
import { formatDate } from "@/lib/utils";

export default async function AccountCreditPage() {
  const supabase = await createClient();
  const company = await getCurrentCompany();
  const [{ data: applications }, { data: overview }, { data: invoices }] = await Promise.all([
    supabase.from("credit_applications").select("id, company_name, status, requested_limit_ore, decision_note, created_at").order("created_at", { ascending: false }),
    company ? supabase.from("credit_account_overview").select("*").eq("company_id", company.id).maybeSingle() : Promise.resolve({ data: null }),
    company
      ? supabase.from("invoices").select("id, invoice_number, amount_ore, due_at, status, issued_at, invoice_payments(amount_ore, paid_at, reference)").eq("company_id", company.id).order("issued_at", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
  ]);
  const payments = (invoices ?? []).flatMap((i) =>
    ((i.invoice_payments ?? []) as { amount_ore: number; paid_at: string; reference: string | null }[]).map((p) => ({ ...p, invoice_number: i.invoice_number })),
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Handlekonto</h2>

      {company && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{company.name}</CardTitle>
            <span className="text-sm text-muted-foreground">Org.nr. {company.org_number}</span>
          </CardHeader>
          <CardContent>
            {overview ? (
              <div className="grid gap-4 sm:grid-cols-4">
                <Metric label="Kredittstatus" value={<Badge variant={CREDIT_STATUS[overview.status]?.variant}>{CREDIT_STATUS[overview.status]?.label}</Badge>} />
                <Metric label="Kredittramme" value={formatPrice(overview.credit_limit_ore)} />
                <Metric label="Tilgjengelig kreditt" value={formatPrice(overview.available_ore)} />
                <Metric label="Utestående saldo" value={formatPrice(overview.outstanding_ore)} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Bedriften er registrert, men har ikke aktiv kreditt. Kjøp betales med kort.</p>
            )}
            {overview && <p className="mt-3 text-xs text-muted-foreground">Betalingsfrist: {overview.payment_terms_days} dager.</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Søknader</CardTitle>
        </CardHeader>
        <CardContent>
          {applications?.length ? (
            <ul className="divide-y text-sm">
              {applications.map((a) => (
                <li key={a.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{a.company_name}</span>
                    <span className="text-muted-foreground">{formatDate(a.created_at)}</span>
                    <span>Ønsket ramme: {formatPrice(a.requested_limit_ore)}</span>
                    <Badge variant={APPLICATION_STATUS[a.status]?.variant}>{APPLICATION_STATUS[a.status]?.label}</Badge>
                  </div>
                  {a.decision_note && <p className="mt-1 text-muted-foreground">{a.decision_note}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-3 text-sm">
              <p>Du har ikke søkt om handlekonto.</p>
              <Button asChild>
                <Link href="/handlekonto">Søk om handlekonto</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {company && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Fakturaoversikt</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices?.length ? (
                <ul className="divide-y text-sm">
                  {invoices.map((i) => (
                    <li key={i.id} className="flex items-center justify-between gap-2 py-2">
                      <span>#{i.invoice_number}</span>
                      <span className="text-muted-foreground">forfall {formatDate(i.due_at)}</span>
                      <Badge variant={INVOICE_STATUS[i.status]?.variant}>{INVOICE_STATUS[i.status]?.label}</Badge>
                      <span>{formatPrice(i.amount_ore)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Ingen fakturaer.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Betalingshistorikk</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length ? (
                <ul className="divide-y text-sm">
                  {payments.map((p, i) => (
                    <li key={i} className="flex justify-between gap-2 py-2">
                      <span>Faktura #{p.invoice_number}</span>
                      <span className="text-muted-foreground">{formatDate(p.paid_at)}</span>
                      <span>{formatPrice(p.amount_ore)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Ingen registrerte innbetalinger.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
