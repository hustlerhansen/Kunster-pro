import Link from "next/link";
import Form from "next/form";
import { PageHeader, Empty } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/money";
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from "@/lib/order-status";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Ordrer" };

export default async function AdminOrders({ searchParams }: PageProps<"/admin/ordrer">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, order_number, customer_name, email, status, payment_status, payment_method, total_ore, created_at, company_id")
    .order("created_at", { ascending: false })
    .limit(300);
  if (status === "paid") query = query.in("status", ["paid", "processing"]);
  else if (status) query = query.eq("status", status);
  if (q) {
    const safe = q.replace(/[%_,()]/g, "");
    query = /^\d+$/.test(safe) ? query.eq("order_number", Number(safe)) : query.or(`email.ilike.%${safe}%,customer_name.ilike.%${safe}%`);
  }
  const { data: orders } = await query;
  return (
    <div>
      <PageHeader title="Ordrer" description="Ordre markeres som betalt kun når betalingsleverandøren har bekreftet betalingen." />
      <Form action="/admin/ordrer" className="mb-4 flex flex-wrap gap-2">
        <Input name="q" defaultValue={q} placeholder="Ordrenr., navn eller e-post" className="max-w-xs" />
        <select name="status" defaultValue={status} className="h-10 rounded-md border bg-white px-3 text-sm">
          <option value="">Alle</option>
          <option value="paid">Skal sendes (betalt/behandles)</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <Button variant="outline">Filtrer</Button>
      </Form>
      <div className="rounded-lg border bg-white">
        {orders?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordre</TableHead>
                <TableHead>Dato</TableHead>
                <TableHead>Kunde</TableHead>
                <TableHead>Betaling</TableHead>
                <TableHead>Betalingsstatus</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Sum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link href={`/admin/ordrer/${o.id}`} className="font-medium hover:underline">
                      #{o.order_number}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(o.created_at, true)}</TableCell>
                  <TableCell>
                    {o.customer_name}
                    {o.company_id && <Badge variant="outline" className="ml-1">B2B</Badge>}
                    <span className="block text-xs text-muted-foreground">{o.email}</span>
                  </TableCell>
                  <TableCell>{PAYMENT_METHOD[o.payment_method]}</TableCell>
                  <TableCell>
                    <Badge variant={PAYMENT_STATUS[o.payment_status]?.variant}>{PAYMENT_STATUS[o.payment_status]?.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ORDER_STATUS[o.status]?.variant}>{ORDER_STATUS[o.status]?.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatPrice(o.total_ore)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Empty>Ingen ordre funnet.</Empty>
        )}
      </div>
    </div>
  );
}
