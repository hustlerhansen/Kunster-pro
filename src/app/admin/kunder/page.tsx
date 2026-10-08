import Link from "next/link";
import Form from "next/form";
import { PageHeader, Empty } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Kunder" };

export default async function AdminCustomers({ searchParams }: PageProps<"/admin/kunder">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.replace(/[%_,()]/g, "").trim() : "";
  const supabase = await createClient();
  let query = supabase.from("profiles").select("id, email, full_name, phone, role, customer_type, is_blocked, marketing_consent, created_at, company:companies(name)").order("created_at", { ascending: false }).limit(300);
  if (q) query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);
  if (sp.type === "business") query = query.eq("customer_type", "business");
  const { data } = await query;
  const customers = (data ?? []) as unknown as { id: string; email: string; full_name: string | null; phone: string | null; role: string; customer_type: string; is_blocked: boolean; marketing_consent: boolean; created_at: string; company: { name: string } | null }[];
  return (
    <div>
      <PageHeader title="Kunder" />
      <Form action="/admin/kunder" className="mb-4 flex flex-wrap gap-2">
        <Input name="q" defaultValue={q} placeholder="Navn eller e-post" className="max-w-xs" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="type" value="business" defaultChecked={sp.type === "business"} /> Kun bedriftskunder
        </label>
        <Button variant="outline">Søk</Button>
      </Form>
      <div className="rounded-lg border bg-white">
        {customers.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kunde</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Markedsføring</TableHead>
                <TableHead>Registrert</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/admin/kunder/${c.id}`} className="font-medium hover:underline">
                      {c.full_name ?? "(uten navn)"}
                    </Link>
                    <span className="block text-xs text-muted-foreground">{c.email}</span>
                  </TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell>{c.customer_type === "business" ? <Badge variant="info">{c.company?.name ?? "Bedrift"}</Badge> : "Privat"}</TableCell>
                  <TableCell>
                    {c.role !== "customer" && <Badge variant="gold">{c.role}</Badge>} {c.is_blocked && <Badge variant="destructive">Sperret</Badge>}
                  </TableCell>
                  <TableCell>{c.marketing_consent ? "Ja" : "Nei"}</TableCell>
                  <TableCell>{formatDate(c.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Empty>Ingen kunder funnet.</Empty>
        )}
      </div>
    </div>
  );
}
