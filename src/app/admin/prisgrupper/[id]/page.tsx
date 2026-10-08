import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/form-controls";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/money";
import { setPriceGroupPrice } from "../../_actions/credit";

export const metadata = { title: "Varepriser for prisgruppe" };

export default async function PriceGroupPrices({ params }: PageProps<"/admin/prisgrupper/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: group }, { data: variants }, { data: prices }] = await Promise.all([
    supabase.from("price_groups").select("*").eq("id", id).maybeSingle(),
    supabase.from("product_variants").select("id, sku, name, price_ore, product:products!product_variants_product_id_fkey!inner(name, status)").eq("is_active", true).neq("product.status", "archived").order("sku"),
    supabase.from("price_group_prices").select("variant_id, price_ore").eq("price_group_id", id),
  ]);
  if (!group) notFound();
  const map = new Map((prices ?? []).map((p) => [p.variant_id, p.price_ore]));
  return (
    <div>
      <PageHeader title={`Varepriser – ${group.name}`} description={`Tom pris = standardpris minus ${group.discount_percent} % gruppe-rabatt. Alle priser inkl. MVA.`} />
      <div className="divide-y rounded-lg border bg-white">
        {((variants ?? []) as unknown as { id: string; sku: string; name: string; price_ore: number; product: { name: string } }[]).map((v) => (
          <ActionForm key={v.id} action={setPriceGroupPrice} submitLabel="Lagre" className="flex flex-wrap items-center gap-3 space-y-0 px-4 py-2 text-sm">
            <input type="hidden" name="price_group_id" value={id} />
            <input type="hidden" name="variant_id" value={v.id} />
            <span className="min-w-72 flex-1">
              {v.product.name} – {v.name} <span className="text-xs text-muted-foreground">({v.sku})</span>
            </span>
            <span className="w-28 text-muted-foreground">Std. {formatPrice(v.price_ore)}</span>
            <Input name="price" defaultValue={map.has(v.id) ? String(map.get(v.id)! / 100) : ""} placeholder="Avtalepris kr" className="h-8 w-32" />
          </ActionForm>
        ))}
      </div>
    </div>
  );
}
