import { PageHeader, Panel } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Nytt produkt" };

export default async function NewProduct() {
  const supabase = await createClient();
  const [{ data: categories }, { data: brands }] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("brands").select("id, name").order("name"),
  ]);
  return (
    <div>
      <PageHeader title="Nytt produkt" description="Etter at produktet er opprettet kan du legge til varianter, bilder og kostnader." />
      <Panel>
        <ProductForm categories={categories ?? []} brands={brands ?? []} />
      </Panel>
    </div>
  );
}
