import { ActionForm, Select, TextArea, TextInput } from "./form-controls";
import { saveArticle } from "@/app/admin/_actions/content";
import type { Article } from "@/lib/types";

export function ArticleForm({ a }: { a?: Article }) {
  return (
    <ActionForm action={saveArticle} submitLabel={a ? "Lagre artikkel" : "Opprett artikkel"}>
      {a && <input type="hidden" name="id" value={a.id} />}
      <div className="grid gap-3 md:grid-cols-2">
        <TextInput label="Tittel *" name="title" defaultValue={a?.title} required />
        <TextInput label="Slug" name="slug" defaultValue={a?.slug} />
        <TextInput label="Forfatter" name="author_name" defaultValue={a?.author_name ?? "Kunstner Pro"} />
        <TextInput label="Forsidebilde (URL)" name="cover_image_url" defaultValue={a?.cover_image_url ?? ""} />
        <TextInput label="SEO-tittel" name="seo_title" defaultValue={a?.seo_title ?? ""} maxLength={70} />
        <TextInput label="SEO-beskrivelse" name="seo_description" defaultValue={a?.seo_description ?? ""} maxLength={170} />
        <TextInput label="Relaterte produkter (ID-er, kommaseparert)" name="related_products" defaultValue={a?.related_product_ids.join(", ") ?? ""} />
        <TextInput label="Relaterte kategorier (slug, kommaseparert)" name="related_category_slugs" defaultValue={a?.related_category_slugs.join(", ") ?? ""} />
        <TextInput label="Lesetid (min, tom = beregnes)" name="reading_minutes" type="number" defaultValue={a?.reading_minutes ?? ""} />
        <Select label="Status" name="status" defaultValue={a?.status ?? "draft"} options={[{ value: "draft", label: "Utkast" }, { value: "published", label: "Publisert" }]} />
      </div>
      <TextArea label="Ingress" name="excerpt" defaultValue={a?.excerpt ?? ""} rows={2} />
      <TextArea label="Innhold (markdown)" name="body" defaultValue={a?.body ?? ""} rows={20} className="font-mono" />
    </ActionForm>
  );
}
