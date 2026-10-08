import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/money";
import { ORDER_STATUS } from "@/lib/order-status";
import { formatDate } from "@/lib/utils";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, total_ore, created_at, order_items(quantity)")
    .order("created_at", { ascending: false })
    .limit(200);
  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold">Ordrehistorikk</h2>
      {orders?.length ? (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordre</TableHead>
                <TableHead>Dato</TableHead>
                <TableHead>Varer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Sum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link href={`/konto/bestillinger/${o.id}`} className="font-medium underline-offset-4 hover:underline">
                      #{o.order_number}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(o.created_at)}</TableCell>
                  <TableCell>{(o.order_items as { quantity: number }[]).reduce((s, i) => s + i.quantity, 0)}</TableCell>
                  <TableCell>
                    <Badge variant={ORDER_STATUS[o.status]?.variant}>{ORDER_STATUS[o.status]?.label ?? o.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatPrice(o.total_ore)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-muted-foreground">Ingen bestillinger ennå.</p>
      )}
    </div>
  );
}
