import { PageHeader, Panel } from "@/components/admin/ui";
import { ActionForm, Check, TextArea, TextInput } from "@/components/admin/form-controls";
import { createClient } from "@/lib/supabase/server";
import { saveCategory } from "../_actions/products";

export const metadata = { title: "Kategorier" };

interface Cat { id: string; name: string; slug: string; tagline: string | null; description: string | null; long_description: string | null; image_url: string | null; seo_title: string | null; seo_description: string | null; sort_order: number; is_active: boolean }

function CategoryFields({ c }: { c?: Cat }) {
  return (
    <>
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="grid gap-3 md:grid-cols-3">
        <TextInput label="Navn" name="name" defaultValue={c?.name} required />
        <TextInput label="Slug (URL)" name="slug" defaultValue={c?.slug} />
        <TextInput label="Sortering" name="sort_order" type="number" defaultValue={c?.sort_order ?? 0} />
        <TextInput label="Kort tekst" name="tagline" defaultValue={c?.tagline ?? ""} />
        <TextInput label="Bilde-URL" name="image_url" defaultValue={c?.image_url ?? ""} />
        <TextInput label="SEO-tittel" name="seo_title" defaultValue={c?.seo_title ?? ""} maxLength={70} />
      </div>
      <TextInput label="SEO-beskrivelse" name="seo_description" defaultValue={c?.seo_description ?? ""} maxLength={170} />
      <TextArea label="Ingress" name="description" defaultValue={c?.description ?? ""} rows={2} />
      <TextArea label="Kategoritekst for SEO (markdown)" name="long_description" defaultValue={c?.long_description ?? ""} rows={6} />
      <Check label="Aktiv" name="is_active" defaultChecked={c?.is_active ?? true} />
    </>
  );
}

export default async function AdminCategories() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("sort_order");
  return (
    <div className="space-y-4">
      <PageHeader title="Kategorier" description="Hold sortimentet oversiktlig – fem hovedkategorier anbefales." />
      {(data as Cat[] | null)?.map((c) => (
        <details key={c.id} className="rounded-lg border bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
            {c.name} <span className="text-muted-foreground">/{c.slug}</span> {!c.is_active && "(inaktiv)"}
          </summary>
          <div className="border-t p-4">
            <ActionForm action={saveCategory}>
              <CategoryFields c={c} />
            </ActionForm>
          </div>
        </details>
      ))}
      <Panel title="Ny kategori">
        <ActionForm action={saveCategory} submitLabel="Opprett kategori">
          <CategoryFields />
        </ActionForm>
      </Panel>
    </div>
  );
}
