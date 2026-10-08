import Link from "next/link";
import { PageHeader, Empty } from "@/components/admin/ui";
import { ActionForm, TextInput } from "@/components/admin/form-controls";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/money";
import { INVOICE_STATUS } from "@/lib/order-status";
import { formatDate } from "@/lib/utils";
import { registerInvoicePayment } from "../_actions/credit";

export const metadata = { title: "Fakturaer" };

export default async function AdminInvoices() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("*, company:companies(name, org_number), order:orders(id, order_number), invoice_payments(amount_ore, paid_at, reference)")
    .order("issued_at", { ascending: false })
    .limit(300);
  const invoices = (data ?? []) as unknown as {
    id: string; invoice_number: number; amount_ore: number; issued_at: string; due_at: string; status: string;
    company: { name: string; org_number: string } | null; order: { id: string; order_number: number } | null; invoice_payments: { amount_ore: number; paid_at: string; reference: string | null }[];
  }[];
  return (
    <div>
      <PageHeader title="Fakturaer" description="Fakturaer for kjøp på handlekonto. Registrer innbetalinger manuelt eller via fremtidig bankintegrasjon." />
      {!invoices.length && <Empty>Ingen fakturaer.</Empty>}
      <div className="space-y-3">
        {invoices.map((i) => {
          const paid = i.invoice_payments.reduce((s, p) => s + p.amount_ore, 0);
          return (
            <div key={i.id} className="rounded-lg border bg-white p-4 text-sm">
              <div className="flex flex-wrap items-center gap-4">
                <strong>Faktura #{i.invoice_number}</strong>
                <span>{i.company?.name} ({i.company?.org_number})</span>
                {i.order && <Link href={`/admin/ordrer/${i.order.id}`} className="underline">Ordre #{i.order.order_number}</Link>}
                <span>Utstedt {formatDate(i.issued_at)}</span>
                <span>Forfall {formatDate(i.due_at)}</span>
                <Badge variant={INVOICE_STATUS[i.status]?.variant}>{INVOICE_STATUS[i.status]?.label}</Badge>
                <span className="ml-auto font-semibold">
                  {formatPrice(i.amount_ore)} {paid > 0 && <span className="font-normal text-muted-foreground">(betalt {formatPrice(paid)})</span>}
                </span>
              </div>
              {["open", "overdue"].includes(i.status) && (
                <ActionForm action={registerInvoicePayment} submitLabel="Registrer innbetaling" className="mt-3 flex flex-wrap items-end gap-3 space-y-0">
                  <input type="hidden" name="invoice_id" value={i.id} />
                  <TextInput label="Beløp (kr)" name="amount" defaultValue={String((i.amount_ore - paid) / 100)} />
                  <TextInput label="Referanse" name="reference" placeholder="Bankref./KID" />
                </ActionForm>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
