import { PageHeader, Panel, Empty } from "@/components/admin/ui";
import { ActionForm, Check, Select, TextInput } from "@/components/admin/form-controls";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { integrations } from "@/lib/env";
import { formatPrice } from "@/lib/money";
import { APPLICATION_STATUS, CREDIT_STATUS } from "@/lib/order-status";
import { CUSTOMER_CATEGORY_LABELS } from "@/lib/validation";
import { formatDate } from "@/lib/utils";
import { reviewApplication, setCompanyPriceGroup, updateCreditAccount } from "../_actions/credit";

export const metadata = { title: "Handlekonto og kreditt" };

export default async function AdminCredit() {
  const supabase = await createClient();
  const [{ data: applications }, { data: accounts }, { data: companies }, { data: groups }] = await Promise.all([
    supabase.from("credit_applications").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("credit_account_overview").select("*").order("company_name"),
    supabase.from("companies").select("id, name, org_number, customer_category, status, price_group_id, created_at").order("name"),
    supabase.from("price_groups").select("id, name").order("name"),
  ]);
  const open = (applications ?? []).filter((a) => ["submitted", "under_review"].includes(a.status));
  const closed = (applications ?? []).filter((a) => !["submitted", "under_review"].includes(a.status));
  const invoiceFlag = integrations.businessInvoice();

  return (
    <div className="space-y-6">
      <PageHeader title="Handlekonto og kreditt" description="Søknader behandles manuelt. Systemet gir aldri automatisk kreditt, og forbrukere kan ikke få kreditt her." />
      <Alert variant={invoiceFlag ? "info" : "warning"}>
        {invoiceFlag ? (
          <>Fakturakjøp er teknisk tillatt (FEATURE_BUSINESS_INVOICE=true). Sørg for at juridiske og økonomiske rutiner (kredittvurdering, vilkår, purring, inkasso, bokføring) er på plass.</>
        ) : (
          <>
            <strong>Kreditt er deaktivert.</strong> Søknader kan godkjennes og bedriftskonto opprettes, men kredittkontoer kan ikke settes til «Aktiv» før
            FEATURE_BUSINESS_INVOICE=true er satt etter at juridiske, økonomiske og tekniske krav er avklart.
          </>
        )}
      </Alert>

      <Panel title={`Søknader til behandling (${open.length})`}>
        {open.length === 0 && <Empty>Ingen åpne søknader.</Empty>}
        <div className="space-y-4">
          {open.map((a) => (
            <div key={a.id} className="rounded-md border p-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <strong>{a.company_name}</strong>
                <span>Org.nr. {a.org_number}</span>
                <a href={`https://virksomhet.brreg.no/oppslag/enheter/${a.org_number}`} target="_blank" rel="noopener noreferrer" className="underline">
                  Slå opp i Brønnøysund
                </a>
                <Badge variant={APPLICATION_STATUS[a.status]?.variant}>{APPLICATION_STATUS[a.status]?.label}</Badge>
                <span className="text-muted-foreground">{formatDate(a.created_at, true)}</span>
              </div>
              <p className="mt-2 text-sm">
                {CUSTOMER_CATEGORY_LABELS[a.customer_category] ?? a.customer_category} · Kontakt: {a.contact_name}, {a.email}, {a.phone}
                <br />
                Ønsket ramme: <strong>{formatPrice(a.requested_limit_ore)}</strong>
                {a.expected_monthly_ore && <> · Forventet månedlig kjøp: {formatPrice(a.expected_monthly_ore)}</>}
                <br />
                Fakturaadresse: {a.billing_address?.line1}, {a.billing_address?.postal_code} {a.billing_address?.city}
              </p>
              {a.message && <p className="mt-1 rounded bg-secondary p-2 text-sm">«{a.message}»</p>}
              <ActionForm action={reviewApplication} submitLabel="Lagre beslutning" className="mt-4">
                <input type="hidden" name="application_id" value={a.id} />
                <div className="grid gap-3 md:grid-cols-4">
                  <Select label="Beslutning" name="decision" options={[{ value: "under_review", label: "Under behandling" }, { value: "approved", label: "Godkjenn" }, { value: "rejected", label: "Avslå" }]} />
                  <TextInput label="Kredittramme (kr)" name="credit_limit" defaultValue={String(a.requested_limit_ore / 100)} />
                  <TextInput label="Betalingsfrist (dager)" name="payment_terms_days" defaultValue="14" type="number" />
                  <TextInput label="Begrunnelse / notat" name="decision_note" />
                </div>
                <Check label="Jeg bekrefter at nødvendige kontroller er gjennomført (foretaksregister, kredittvurdering, vilkår)." name="checks_confirmed" />
                <Check label="Aktiver fakturakjøp nå" name="activate" hint={invoiceFlag ? "Ellers opprettes kontoen som «Venter på aktivering»." : "Ikke mulig før FEATURE_BUSINESS_INVOICE=true."} />
              </ActionForm>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Kredittkontoer">
        {!accounts?.length && <Empty>Ingen kredittkontoer.</Empty>}
        <div className="space-y-3">
          {accounts?.map((a) => (
            <details key={a.id} className="rounded-md border">
              <summary className="flex cursor-pointer flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3 text-sm">
                <strong>{a.company_name}</strong>
                <Badge variant={CREDIT_STATUS[a.status]?.variant}>{CREDIT_STATUS[a.status]?.label}</Badge>
                <span>Ramme {formatPrice(a.credit_limit_ore)}</span>
                <span>Utestående {formatPrice(a.outstanding_ore)}</span>
                <span>Tilgjengelig {formatPrice(a.available_ore)}</span>
                {a.overdue_ore > 0 && <span className="text-destructive">Forfalt {formatPrice(a.overdue_ore)}</span>}
              </summary>
              <div className="border-t p-4">
                <ActionForm action={updateCreditAccount}>
                  <input type="hidden" name="account_id" value={a.id} />
                  <div className="grid gap-3 md:grid-cols-4">
                    <Select label="Kredittstatus" name="status" defaultValue={a.status} options={Object.entries(CREDIT_STATUS).map(([value, v]) => ({ value, label: v.label }))} hint="«Sperret» stopper nye fakturakjøp." />
                    <TextInput label="Kredittramme (kr)" name="credit_limit" defaultValue={String(a.credit_limit_ore / 100)} />
                    <TextInput label="Betalingsfrist (dager)" name="payment_terms_days" type="number" defaultValue={a.payment_terms_days} />
                    <TextInput label="Notat" name="notes" />
                  </div>
                </ActionForm>
              </div>
            </details>
          ))}
        </div>
      </Panel>

      <Panel title="Bedriftskunder og prisgrupper">
        <div className="divide-y">
          {companies?.map((c) => (
            <ActionForm key={c.id} action={setCompanyPriceGroup} submitLabel="Lagre" className="flex flex-wrap items-end gap-3 space-y-0 py-3">
              <input type="hidden" name="company_id" value={c.id} />
              <div className="min-w-56 text-sm">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.org_number} · {CUSTOMER_CATEGORY_LABELS[c.customer_category]}
                </p>
              </div>
              <Select label="Prisgruppe" name="price_group_id" defaultValue={c.price_group_id ?? ""} options={[{ value: "", label: "Standardpriser" }, ...(groups ?? []).map((g) => ({ value: g.id, label: g.name }))]} />
              <Select label="Status" name="status" defaultValue={c.status} options={[{ value: "active", label: "Aktiv" }, { value: "blocked", label: "Sperret" }]} />
            </ActionForm>
          ))}
          {!companies?.length && <Empty>Ingen bedriftskunder.</Empty>}
        </div>
      </Panel>

      {closed.length > 0 && (
        <Panel title="Behandlede søknader">
          <ul className="divide-y text-sm">
            {closed.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-3 py-2">
                <span>
                  {a.company_name} ({a.org_number})
                </span>
                <Badge variant={APPLICATION_STATUS[a.status]?.variant}>{APPLICATION_STATUS[a.status]?.label}</Badge>
                <span className="text-muted-foreground">{a.reviewed_at ? formatDate(a.reviewed_at) : ""}</span>
                {a.decision_note && <span className="w-full text-muted-foreground">{a.decision_note}</span>}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
