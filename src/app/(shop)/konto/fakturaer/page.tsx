import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/money";
import { INVOICE_STATUS } from "@/lib/order-status";
import { formatDate } from "@/lib/utils";

export default async function InvoicesPage() {
  const supabase = await createClient();
  const [{ data: invoices }, { data: receipts }] = await Promise.all([
    supabase.from("invoices").select("id, invoice_number, order_id, amount_ore, issued_at, due_at, status, kid").order("issued_at", { ascending: false }),
    supabase.from("orders").select("id, order_number, total_ore, paid_at, created_at").eq("payment_status", "paid").order("created_at", { ascending: false }).limit(100),
  ]);
  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-2 text-2xl font-semibold">Fakturaer</h2>
        <p className="mb-4 text-sm text-muted-foreground">Fakturaer for kjøp på handlekonto.</p>
        {invoices?.length ? (
          <div className="rounded-lg border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faktura</TableHead>
                  <TableHead>Dato</TableHead>
                  <TableHead>Forfall</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Beløp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      {i.order_id ? (
                        <Link href={`/konto/fakturaer/${i.order_id}`} className="font-medium hover:underline">
                          #{i.invoice_number}
                        </Link>
                      ) : (
                        `#${i.invoice_number}`
                      )}
                    </TableCell>
                    <TableCell>{formatDate(i.issued_at)}</TableCell>
                    <TableCell>{formatDate(i.due_at)}</TableCell>
                    <TableCell>
                      <Badge variant={INVOICE_STATUS[i.status]?.variant}>{INVOICE_STATUS[i.status]?.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatPrice(i.amount_ore)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Ingen fakturaer.</p>
        )}
      </section>
      <section>
        <h2 className="mb-4 text-2xl font-semibold">Kvitteringer</h2>
        {receipts?.length ? (
          <ul className="divide-y rounded-lg border bg-white">
            {receipts.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <Link href={`/konto/fakturaer/${r.id}`} className="font-medium hover:underline">
                  Kvittering ordre #{r.order_number}
                </Link>
                <span className="text-muted-foreground">{formatDate(r.paid_at ?? r.created_at)}</span>
                <span>{formatPrice(r.total_ore)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Ingen kvitteringer ennå.</p>
        )}
      </section>
    </div>
  );
}
