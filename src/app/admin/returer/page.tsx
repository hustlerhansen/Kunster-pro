import Link from "next/link";
import { PageHeader, Empty } from "@/components/admin/ui";
import { ActionForm, Check, Select, TextInput } from "@/components/admin/form-controls";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { RETURN_STATUS } from "@/lib/order-status";
import { formatDate } from "@/lib/utils";
import { updateReturn } from "../_actions/orders";

export const metadata = { title: "Returer" };

export default async function AdminReturns() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("returns")
    .select("*, order:orders(id, order_number, customer_name, email, order_items(id, product_name, variant_name))")
    .order("created_at", { ascending: false })
    .limit(200);
  const returns = (data ?? []) as unknown as {
    id: string; return_number: number; type: string; status: string; reason: string; description: string | null; items: { order_item_id: string; quantity: number }[];
    refund_amount_ore: number | null; restock: boolean; admin_note: string | null; created_at: string;
    order: { id: string; order_number: number; customer_name: string; email: string; order_items: { id: string; product_name: string; variant_name: string | null }[] };
  }[];
  return (
    <div>
      <PageHeader title="Returer" description="Angrerett (14 dager) og reklamasjoner. Refusjon for kort gjøres fra ordren; registrer beløpet her." />
      {returns.length === 0 && <Empty>Ingen returer.</Empty>}
      <div className="space-y-4">
        {returns.map((r) => {
          const names = new Map(r.order.order_items.map((i) => [i.id, `${i.product_name}${i.variant_name ? ` – ${i.variant_name}` : ""}`]));
          return (
            <div key={r.id} className="rounded-lg border bg-white p-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <strong>Retur #{r.return_number}</strong>
                <Badge variant="outline">{r.type === "withdrawal" ? "Angrerett" : "Reklamasjon"}</Badge>
                <Badge variant={RETURN_STATUS[r.status]?.variant}>{RETURN_STATUS[r.status]?.label}</Badge>
                <Link href={`/admin/ordrer/${r.order.id}`} className="underline">Ordre #{r.order.order_number}</Link>
                <span>{r.order.customer_name} ({r.order.email})</span>
                <span className="text-muted-foreground">{formatDate(r.created_at, true)}</span>
                {r.restock && <Badge variant="success">Lagt på lager</Badge>}
              </div>
              <p className="mt-2 text-sm">
                <strong>Årsak:</strong> {r.reason}
                {r.description && <> – {r.description}</>}
              </p>
              <ul className="mt-1 text-sm text-muted-foreground">
                {r.items.map((i) => (
                  <li key={i.order_item_id}>
                    {i.quantity} × {names.get(i.order_item_id) ?? i.order_item_id}
                  </li>
                ))}
              </ul>
              <ActionForm action={updateReturn} submitLabel="Oppdater retur" className="mt-3">
                <input type="hidden" name="return_id" value={r.id} />
                <div className="grid gap-3 md:grid-cols-3">
                  <Select label="Status" name="status" defaultValue={r.status} options={Object.entries(RETURN_STATUS).map(([value, v]) => ({ value, label: v.label }))} />
                  <TextInput label="Refundert beløp (kr)" name="refund_amount" defaultValue={r.refund_amount_ore !== null ? String(r.refund_amount_ore / 100) : ""} />
                  <TextInput label="Internt notat" name="admin_note" defaultValue={r.admin_note ?? ""} />
                </div>
                {!r.restock && <Check label="Legg returnerte varer tilbake på lager (kun når varen er mottatt og salgbar)" name="restock" />}
              </ActionForm>
            </div>
          );
        })}
      </div>
    </div>
  );
}
