import Link from "next/link";
import Form from "next/form";
import { Plus } from "lucide-react";
import { PageHeader, DemoBadge, Empty } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/money";
import { PRODUCT_TYPE_LABELS } from "@/lib/specs";
import type { ProductType } from "@/lib/types";

export const metadata = { title: "Produkter" };

export default async function AdminProducts({ searchParams }: PageProps<"/admin/produkter">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("id, name, slug, status, is_demo, featured, product_type, category:categories(name), variants:product_variants(price_ore, stock_available, stock_on_hand, is_active)")
    .order("sort_order")
    .limit(500);
  if (q) query = query.ilike("name", `%${q.replace(/[%_]/g, "")}%`);
  if (status) query = query.eq("status", status);
  if (sp.demo === "1") query = query.eq("is_demo", true);
  const { data } = await query;
  const products = (data ?? []) as unknown as {
    id: string; name: string; slug: string; status: string; is_demo: boolean; featured: boolean; product_type: ProductType;
    category: { name: string } | null; variants: { price_ore: number; stock_available: number; stock_on_hand: number; is_active: boolean }[];
  }[];

  return (
    <div>
      <PageHeader
        title="Produkter"
        description="Opprett, rediger, arkiver produkter, varianter, bilder og kostnader."
        actions={
          <Button asChild>
            <Link href="/admin/produkter/ny">
              <Plus /> Nytt produkt
            </Link>
          </Button>
        }
      />
      <Form action="/admin/produkter" className="mb-4 flex flex-wrap gap-2">
        <Input name="q" defaultValue={q} placeholder="Søk produktnavn" className="max-w-xs" />
        <select name="status" defaultValue={status} className="h-10 rounded-md border bg-white px-3 text-sm">
          <option value="">Alle statuser</option>
          <option value="active">Aktiv</option>
          <option value="draft">Utkast</option>
          <option value="archived">Arkivert</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="demo" value="1" defaultChecked={sp.demo === "1"} /> Kun DEMO
        </label>
        <Button variant="outline">Filtrer</Button>
      </Form>
      <div className="rounded-lg border bg-white">
        {products.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produkt</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Pris</TableHead>
                <TableHead>Varianter</TableHead>
                <TableHead>Lager (tilgj.)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const prices = p.variants.map((v) => v.price_ore);
                const stock = p.variants.reduce((s, v) => s + v.stock_available, 0);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/admin/produkter/${p.id}`} className="font-medium hover:underline">
                        {p.name}
                      </Link>{" "}
                      <DemoBadge show={p.is_demo} />
                      {p.featured && <Badge variant="gold" className="ml-1">Populær</Badge>}
                    </TableCell>
                    <TableCell>{PRODUCT_TYPE_LABELS[p.product_type]}</TableCell>
                    <TableCell>{p.category?.name}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {prices.length ? (Math.min(...prices) === Math.max(...prices) ? formatPrice(prices[0]) : `${formatPrice(Math.min(...prices))} – ${formatPrice(Math.max(...prices))}`) : "–"}
                    </TableCell>
                    <TableCell>{p.variants.length}</TableCell>
                    <TableCell className={stock <= 0 ? "text-destructive" : ""}>{stock}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "active" ? "success" : p.status === "draft" ? "warning" : "secondary"}>
                        {p.status === "active" ? "Aktiv" : p.status === "draft" ? "Utkast" : "Arkivert"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <Empty>Ingen produkter funnet.</Empty>
        )}
      </div>
    </div>
  );
}
