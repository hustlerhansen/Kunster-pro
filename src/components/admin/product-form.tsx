"use client";

import { useState } from "react";
import { ActionForm, Check, Select, TextArea, TextInput } from "./form-controls";
import { saveProduct } from "@/app/admin/_actions/products";
import { PRODUCT_TYPE_LABELS, SPEC_DEFS, SPECS_BY_TYPE, DOCUMENTED_ONLY } from "@/lib/specs";
import type { ProductType } from "@/lib/types";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  subtitle: string | null;
  short_description: string | null;
  description: string | null;
  usage: string | null;
  category_id: string;
  brand_id: string | null;
  product_type: ProductType;
  status: string;
  featured: boolean;
  is_demo: boolean;
  sort_order: number;
  delivery_note: string | null;
  seo_title: string | null;
  seo_description: string | null;
  specs: Record<string, string | number>;
  related_product_ids: string[];
}

export function ProductForm({
  product,
  categories,
  brands,
}: {
  product?: ProductRow;
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
}) {
  const [type, setType] = useState<ProductType>(product?.product_type ?? "oil_paint");
  const documented = DOCUMENTED_ONLY[type] ?? [];
  return (
    <ActionForm action={saveProduct} submitLabel={product ? "Lagre produkt" : "Opprett produkt"}>
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="Produktnavn *" name="name" defaultValue={product?.name} required />
        <TextInput label="URL-slug" name="slug" defaultValue={product?.slug} hint="Genereres fra navnet hvis tom." />
        <TextInput label="Undertittel" name="subtitle" defaultValue={product?.subtitle ?? ""} />
        <Select
          label="Produkttype *"
          name="product_type"
          value={type}
          onChange={(e) => setType(e.target.value as ProductType)}
          options={Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <Select label="Kategori *" name="category_id" defaultValue={product?.category_id} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
        <Select label="Merke" name="brand_id" defaultValue={product?.brand_id ?? ""} options={[{ value: "", label: "– Ingen –" }, ...brands.map((b) => ({ value: b.id, label: b.name }))]} />
        <Select
          label="Status"
          name="status"
          defaultValue={product?.status ?? "draft"}
          options={[
            { value: "draft", label: "Utkast (ikke synlig)" },
            { value: "active", label: "Aktiv (synlig i butikken)" },
            { value: "archived", label: "Arkivert" },
          ]}
        />
        <TextInput label="Sortering" name="sort_order" type="number" defaultValue={product?.sort_order ?? 0} />
      </div>
      <TextArea label="Kort beskrivelse" name="short_description" defaultValue={product?.short_description ?? ""} rows={2} />
      <TextArea label="Produktbeskrivelse (markdown)" name="description" defaultValue={product?.description ?? ""} rows={7} />
      <TextInput label="Bruksområde" name="usage" defaultValue={product?.usage ?? ""} />

      <fieldset className="rounded-md border p-4">
        <legend className="px-1 text-sm font-semibold">Spesifikasjoner – {PRODUCT_TYPE_LABELS[type]}</legend>
        <p className="mb-3 text-xs text-muted-foreground">
          Fyll kun ut dokumenterte egenskaper. {documented.length > 0 && `Pigment, dekkevne og lysekthet vises som «Ikke dokumentert» når feltene er tomme.`} Variantspesifikke verdier (f.eks. volum
          eller mål) registreres på varianten.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {SPECS_BY_TYPE[type].map((key) => (
            <TextInput
              key={key}
              label={`${SPEC_DEFS[key].label}${SPEC_DEFS[key].unit ? ` (${SPEC_DEFS[key].unit})` : ""}`}
              name={`spec_${key}`}
              defaultValue={product?.specs?.[key] !== undefined ? String(product.specs[key]) : ""}
            />
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="Leveringsinformasjon (overstyrer standard)" name="delivery_note" defaultValue={product?.delivery_note ?? ""} hint="F.eks. «Bestillingsvare – sendes når varen er mottatt». Ikke oppgi udokumenterte leveringstider." />
        <TextInput label="Relaterte produkter (ID-er, kommaseparert)" name="related" defaultValue={product?.related_product_ids?.join(", ") ?? ""} />
        <TextInput label="SEO-tittel (maks 70)" name="seo_title" defaultValue={product?.seo_title ?? ""} maxLength={70} />
        <TextInput label="SEO-beskrivelse (maks 170)" name="seo_description" defaultValue={product?.seo_description ?? ""} maxLength={170} />
      </div>
      <div className="flex flex-wrap gap-6">
        <Check label="Vis som populært produkt på forsiden" name="featured" defaultChecked={product?.featured} />
        <Check label="DEMO – fiktivt produkt/pris" name="is_demo" defaultChecked={product?.is_demo} hint="Merkes tydelig i admin og på produktsiden." />
      </div>
    </ActionForm>
  );
}
