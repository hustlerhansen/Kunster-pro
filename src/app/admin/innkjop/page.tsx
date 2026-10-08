import Link from "next/link";
import { PageHeader, Panel, Empty } from "@/components/admin/ui";
import { ActionForm, Select } from "@/components/admin/form-controls";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { createPurchaseOrder } from "../_actions/supply";

export const metadata = { title: "Innkjøpsordrer" };
const PO_STATUS: Record<string, string> = { draft: "Utkast", sent: "Sendt", confirmed: "Bekreftet", shipped: "Under transport", received: "Mottatt", cancelled: "Kansellert" };

export default async function AdminPurchaseOrders() {
  const supabase = await createClient();
  const [{ data: pos }, { data: suppliers }] = await Promise.all([
    supabase.from("purchase_orders").select("*, supplier:suppliers(name), purchase_order_items(quantity, unit_price, received_quantity)").order("created_at", { ascending: false }).limit(200),
    supabase.from("suppliers").select("id, name").eq("is_active", true).order("name"),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Innkjøpsordrer" description="Bestillingsstatus, forventet levering og varemottak. Ved mottak fordeles frakt, toll og andre kostnader på varene (landed cost)." />
      <Panel title="Ny innkjøpsordre">
        {suppliers?.length ? (
          <ActionForm action={createPurchaseOrder} submitLabel="Opprett utkast" className="flex items-end gap-3 space-y-0">
            <Select label="Leverandør" name="supplier_id" options={suppliers.map((s) => ({ value: s.id, label: s.name }))} />
          </ActionForm>
        ) : (
          <p className="text-sm">
            Registrer en <Link href="/admin/suppliers/ny" className="underline">leverandør</Link> først.
          </p>
        )}
      </Panel>
      <div className="rounded-lg border bg-white">
        {pos?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nr.</TableHead>
                <TableHead>Leverandør</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Linjer</TableHead>
                <TableHead>Verdi</TableHead>
                <TableHead>Forventet</TableHead>
                <TableHead>Opprettet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pos.map((p) => {
                const items = p.purchase_order_items as { quantity: number; unit_price: number; received_quantity: number }[];
                const value = items.reduce((s, i) => s + i.quantity * Number(i.unit_price), 0);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/admin/innkjop/${p.id}`} className="font-medium hover:underline">
                        IO-{p.po_number}
                      </Link>
                    </TableCell>
                    <TableCell>{(p.supplier as { name: string } | null)?.name}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "received" ? "success" : p.status === "cancelled" ? "secondary" : p.status === "draft" ? "outline" : "info"}>{PO_STATUS[p.status]}</Badge>
                    </TableCell>
                    <TableCell>{items.length}</TableCell>
                    <TableCell>
                      {value.toLocaleString("nb-NO", { maximumFractionDigits: 2 })} {p.currency}
                    </TableCell>
                    <TableCell>{p.expected_at ? formatDate(p.expected_at) : "–"}</TableCell>
                    <TableCell>{formatDate(p.created_at)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <Empty>Ingen innkjøpsordrer.</Empty>
        )}
      </div>
    </div>
  );
}
