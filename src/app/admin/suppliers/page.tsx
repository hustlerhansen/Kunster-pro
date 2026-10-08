import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader, Panel, Empty, DemoBadge } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/form-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { importSuppliersCsv } from "../_actions/supply";

export const metadata = { title: "Leverandører" };
const REGION: Record<string, string> = { NO: "Norge", EU: "Europa", CN: "Kina", OTHER: "Annet" };

export default async function AdminSuppliers() {
  const supabase = await createClient();
  const { data } = await supabase.from("suppliers").select("*, supplier_products(count)").order("name");
  return (
    <div className="space-y-6">
      <PageHeader
        title="Leverandørregister"
        description="Leverandører fra Norge, Europa og Kina. Data registreres manuelt eller via CSV – ingen automatisk innhenting (scraping) fra plattformer."
        actions={
          <Button asChild>
            <Link href="/admin/suppliers/ny">
              <Plus /> Ny leverandør
            </Link>
          </Button>
        }
      />
      <div className="rounded-lg border bg-white">
        {data?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leverandør</TableHead>
                <TableHead>Kontakt</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Valuta</TableHead>
                <TableHead>Leveringstid</TableHead>
                <TableHead>Produkter</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link href={`/admin/suppliers/${s.id}`} className="font-medium hover:underline">
                      {s.name}
                    </Link>{" "}
                    <DemoBadge show={s.is_demo} /> {!s.is_active && <span className="text-xs text-muted-foreground">(inaktiv)</span>}
                  </TableCell>
                  <TableCell>
                    {s.contact_name}
                    <span className="block text-xs text-muted-foreground">{s.email}</span>
                  </TableCell>
                  <TableCell>
                    {REGION[s.region]} ({s.country})
                  </TableCell>
                  <TableCell>{s.currency}</TableCell>
                  <TableCell>{s.lead_time_days ? `${s.lead_time_days} dager` : "–"}</TableCell>
                  <TableCell>{(s.supplier_products as { count: number }[])[0]?.count ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Empty>Ingen leverandører registrert.</Empty>
        )}
      </div>
      <Panel title="Importer leverandører fra CSV">
        <p className="mb-3 text-xs text-muted-foreground">
          Kolonner (overskriftsrad): <code>navn;kontaktperson;epost;telefon;nettsted;land;region;valuta;leveringstid</code>. Region: NO, EU, CN eller OTHER.
        </p>
        <ActionForm action={importSuppliersCsv} submitLabel="Importer">
          <Input type="file" name="file" accept=".csv,text/csv" required />
        </ActionForm>
      </Panel>
    </div>
  );
}
