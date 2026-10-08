import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { PageHeader, Panel, DemoBadge } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { CostForm, ImageUploadForm, VariantForm, type CostRow, type VariantRow } from "@/components/admin/variant-forms";
import { ProductImage } from "@/components/shop/product-image";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data/catalog";
import { formatPrice } from "@/lib/money";
import { deleteOrArchiveProduct, deleteProductImage, deleteVariant, makePrimaryImage } from "../../_actions/products";

export const metadata = { title: "Rediger produkt" };

export default async function EditProduct({ params, searchParams }: PageProps<"/admin/produkter/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: product }, { data: categories }, { data: brands }, { data: suppliers }, settings] = await Promise.all([
    supabase.from("products").select("*, images:product_images(*), variants:product_variants(*, cost:variant_costs(*))").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("suppliers").select("id, name, currency").eq("is_active", true).order("name"),
    getSettings(),
  ]);
  if (!product) notFound();
  const variants = ((product.variants ?? []) as (VariantRow & { cost: CostRow | CostRow[] | null })[]).sort((a, b) => a.sort_order - b.sort_order);
  const images = ((product.images ?? []) as { id: string; url: string; alt: string; sort_order: number; is_placeholder: boolean }[]).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        description={
          <span className="flex items-center gap-2">
            <DemoBadge show={product.is_demo} />
            <Badge variant={product.status === "active" ? "success" : "warning"}>{product.status}</Badge>
            {product.status === "active" && (
              <Link href={`/produkt/${product.slug}`} target="_blank" className="inline-flex items-center gap-1 underline">
                Vis i butikken <ExternalLink className="size-3" />
              </Link>
            )}
          </span>
        }
        actions={
          <form action={deleteOrArchiveProduct}>
            <input type="hidden" name="id" value={product.id} />
            <Button variant="outline" size="sm" className="text-destructive">
              Slett / arkiver
            </Button>
          </form>
        }
      />
      {sp.ny && <Alert variant="success">Produktet er opprettet. Legg til varianter (med pris) og bilder før du setter status til Aktiv.</Alert>}
      {variants.length === 0 && <Alert variant="warning">Produktet har ingen varianter og kan ikke kjøpes. Legg til minst én variant.</Alert>}

      <Panel title="Produktinformasjon">
        <ProductForm product={product} categories={categories ?? []} brands={brands ?? []} />
      </Panel>

      <Panel title={`Varianter og priser (${variants.length})`}>
        <div className="space-y-4">
          {variants.map((v) => (
            <details key={v.id} className="rounded-md border">
              <summary className="flex cursor-pointer flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 text-sm">
                <span className="font-medium">{v.name}</span>
                <span className="text-muted-foreground">{v.sku}</span>
                <span>{formatPrice(v.price_ore)}</span>
                <span>
                  Lager {v.stock_on_hand} · reservert {v.stock_reserved} · tilgj. <strong>{v.stock_available}</strong>
                </span>
                {!v.is_active && <Badge variant="secondary">Inaktiv</Badge>}
              </summary>
              <div className="space-y-6 border-t p-4">
                <VariantForm productId={product.id} variant={v} />
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    Innkjøp og lønnsomhet {(Array.isArray(v.cost) ? v.cost[0] : v.cost)?.is_demo && <Badge variant="warning">DEMO-kost</Badge>}
                  </h3>
                  <CostForm productId={product.id} variant={v} cost={Array.isArray(v.cost) ? (v.cost[0] ?? null) : v.cost} suppliers={suppliers ?? []} vatRegistered={settings.company.vat_registered} />
                </div>
                <form action={deleteVariant}>
                  <input type="hidden" name="id" value={v.id} />
                  <input type="hidden" name="product_id" value={product.id} />
                  <Button variant="ghost" size="sm" className="text-destructive">
                    Slett variant (deaktiveres hvis den er solgt)
                  </Button>
                </form>
              </div>
            </details>
          ))}
          <details className="rounded-md border border-dashed" open={variants.length === 0}>
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">+ Ny variant</summary>
            <div className="border-t p-4">
              <VariantForm productId={product.id} />
            </div>
          </details>
        </div>
      </Panel>

      <Panel title={`Bilder (${images.length})`}>
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {images.map((img, i) => (
            <div key={img.id} className="rounded-md border p-2">
              <ProductImage src={img.url} alt={img.alt} className="aspect-square bg-[#F6F4EF]" sizes="160px" />
              <p className="mt-1 truncate text-xs text-muted-foreground">{img.alt || "(mangler alt-tekst)"}</p>
              {img.is_placeholder && <Badge variant="warning" className="mt-1">Plassholder</Badge>}
              <div className="mt-2 flex gap-2 text-xs">
                {i > 0 && (
                  <form action={makePrimaryImage}>
                    <input type="hidden" name="id" value={img.id} />
                    <input type="hidden" name="product_id" value={product.id} />
                    <button className="underline">Hovedbilde</button>
                  </form>
                )}
                <form action={deleteProductImage}>
                  <input type="hidden" name="id" value={img.id} />
                  <input type="hidden" name="product_id" value={product.id} />
                  <button className="text-destructive underline">Slett</button>
                </form>
              </div>
            </div>
          ))}
        </div>
        <ImageUploadForm productId={product.id} />
      </Panel>
    </div>
  );
}
