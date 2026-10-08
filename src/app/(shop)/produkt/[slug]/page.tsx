import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, PackageCheck, RotateCcw, Truck } from "lucide-react";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { JsonLd } from "@/components/shop/json-ld";
import { Markdown } from "@/components/shop/markdown";
import { ProductGrid } from "@/components/shop/product-card";
import { ProductImage } from "@/components/shop/product-image";
import { PurchasePanel } from "@/components/shop/product/purchase-panel";
import { Badge } from "@/components/ui/badge";
import {
  getAllProducts,
  getBundleContents,
  getBundleValue,
  getProductBySlug,
  getRelatedProducts,
  getSettings,
  getVolumeDiscounts,
} from "@/lib/data/catalog";
import { formatPrice } from "@/lib/money";
import { buildSpecRows, DOCUMENTED_ONLY, SPEC_DEFS } from "@/lib/specs";
import { absoluteUrl } from "@/lib/utils";

export const revalidate = 300;

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/produkt/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const title = product.seo_title ?? `${product.name}${product.subtitle ? ` – ${product.subtitle}` : ""}`;
  const description = product.seo_description ?? product.short_description ?? undefined;
  const image = product.images[0]?.url;
  return {
    title,
    description,
    alternates: { canonical: `/produkt/${product.slug}` },
    openGraph: { title, description, url: `/produkt/${product.slug}`, images: image ? [{ url: image }] : undefined },
  };
}

export default async function ProductPage({ params }: PageProps<"/produkt/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, settings, bundleValue, bundleContents, volume] = await Promise.all([
    getRelatedProducts(product, 5),
    getSettings(),
    getBundleValue(product),
    getBundleContents(product),
    getVolumeDiscounts(),
  ]);
  const firstVariant = product.variants[0];
  const singleVariant = product.variants.length === 1 ? firstVariant : undefined;
  const specRows = buildSpecRows(product.product_type, product.specs, singleVariant?.options ?? {}, product.usage);
  const undocumented = (DOCUMENTED_ONLY[product.product_type] ?? []).filter((k) => !product.specs[k]);
  const setPrice = firstVariant?.price_ore ?? 0;
  const savings = bundleValue ? bundleValue - setPrice : null;
  const volumeRules = volume.filter((v) => v.product_id === product.id || v.category_id === product.category_id);
  const deliveryText =
    product.delivery_note ??
    (settings.delivery.show_delivery_time && settings.delivery.delivery_time_text
      ? settings.delivery.delivery_time_text
      : "Leveringstid avhenger av fraktmetode og adresse. Fraktalternativer og pris vises i kassen.");
  const images = product.images.length ? product.images : [{ url: "", alt: product.name, is_placeholder: true }];
  const prices = product.variants.map((v) => v.price_ore);

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[...(product.category ? [{ label: product.category.name, href: `/${product.category.slug}` }] : []), { label: product.name }]}
      />

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14 [&>*]:min-w-0">
        {/* Bilder */}
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-lg border border-border bg-[#F6F4EF]">
            <ProductImage src={images[0].url} alt={images[0].alt} priority className="aspect-square" sizes="(min-width:1024px) 50vw, 100vw" />
            {images[0].is_placeholder && (
              <span className="absolute bottom-3 left-3 rounded bg-white/90 px-2 py-1 text-[0.7rem] text-muted-foreground">Illustrasjon – ikke produktfoto</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.slice(1, 6).map((img, i) => (
                <ProductImage key={i} src={img.url} alt={img.alt} className="aspect-square rounded-md border bg-[#F6F4EF]" sizes="20vw" />
              ))}
            </div>
          )}
        </div>

        {/* Kjøpsboks */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.brand && <span className="text-xs font-semibold tracking-[0.2em] text-gold-dark uppercase">{product.brand.name}</span>}
            {product.is_demo && <Badge variant="warning">DEMO</Badge>}
          </div>
          <h1 className="mt-2 text-3xl leading-tight font-semibold sm:text-4xl">{product.name}</h1>
          {product.subtitle && <p className="mt-1 text-lg text-muted-foreground">{product.subtitle}</p>}
          {product.short_description && <p className="mt-4 text-base text-foreground/85">{product.short_description}</p>}

          {savings && savings > 0 && (
            <div className="mt-5 rounded-lg border border-gold/50 bg-gold-light/40 p-4 text-sm">
              <p className="font-semibold">Du sparer {formatPrice(savings)} sammenlignet med enkeltkjøp</p>
              <p className="text-muted-foreground">Innholdet koster {formatPrice(bundleValue!)} kjøpt enkeltvis til dagens priser.</p>
            </div>
          )}
          {volumeRules.map((r) => (
            <div key={r.id} className="mt-5 rounded-lg border border-gold/50 bg-gold-light/40 p-4 text-sm">
              <p className="font-semibold">{r.name}</p>
              {r.description && <p className="text-muted-foreground">{r.description}</p>}
            </div>
          ))}

          <div className="mt-6">
            <PurchasePanel product={product} />
          </div>

          <ul className="mt-8 space-y-3 border-t border-border pt-6 text-sm">
            <li className="flex gap-3">
              <Truck className="size-5 shrink-0" strokeWidth={1.5} />
              <span>
                <strong>Leveringstid:</strong> {deliveryText}{" "}
                <Link href="/frakt-og-levering" className="underline">
                  Frakt og levering
                </Link>
              </span>
            </li>
            {settings.delivery.free_shipping_threshold_ore && (
              <li className="flex gap-3">
                <PackageCheck className="size-5 shrink-0" strokeWidth={1.5} />
                <span>Fri frakt ved kjøp over {formatPrice(settings.delivery.free_shipping_threshold_ore)}</span>
              </li>
            )}
            <li className="flex gap-3">
              <RotateCcw className="size-5 shrink-0" strokeWidth={1.5} />
              <span>
                14 dagers <Link href="/angrerett" className="underline">angrerett</Link>
              </span>
            </li>
            <li className="flex gap-3">
              <Building2 className="size-5 shrink-0" strokeWidth={1.5} />
              <span>
                Bedriftskunde? Avtalepriser vises i handlekurven. <Link href="/bedrift" className="underline">Les mer</Link>
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Beskrivelse og spesifikasjoner */}
      <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <section aria-labelledby="beskrivelse">
          <h2 id="beskrivelse" className="mb-4 text-2xl font-semibold">
            Produktbeskrivelse
          </h2>
          {product.description ? <Markdown>{product.description}</Markdown> : <p className="text-muted-foreground">Beskrivelse kommer.</p>}

          {bundleContents.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-3 text-xl font-semibold">Settet inneholder</h3>
              <ul className="divide-y rounded-lg border bg-white">
                {bundleContents.map((c) => (
                  <li key={c.variant.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                    <Link href={`/produkt/${c.product.slug}`} className="hover:underline">
                      {c.quantity} × {c.product.name} <span className="text-muted-foreground">({c.variant.name})</span>
                    </Link>
                    <span className="whitespace-nowrap text-muted-foreground">{formatPrice(c.variant.price_ore * c.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section aria-labelledby="spesifikasjoner">
          <h2 id="spesifikasjoner" className="mb-4 text-2xl font-semibold">
            Spesifikasjoner
          </h2>
          <table className="w-full overflow-hidden rounded-lg border bg-white text-sm">
            <tbody>
              {specRows.map((row) => (
                <tr key={row.key} className="border-b last:border-0">
                  <th scope="row" className="w-2/5 bg-secondary/50 px-4 py-2.5 text-left font-medium">
                    {row.label}
                  </th>
                  <td className="px-4 py-2.5">{row.value}</td>
                </tr>
              ))}
              {product.variants.length > 1 && (
                <tr className="border-b last:border-0">
                  <th scope="row" className="bg-secondary/50 px-4 py-2.5 text-left font-medium">
                    Varianter
                  </th>
                  <td className="px-4 py-2.5">{product.variants.map((v) => v.name).join(", ")}</td>
                </tr>
              )}
              {undocumented.map((k) => (
                <tr key={k} className="border-b last:border-0">
                  <th scope="row" className="bg-secondary/50 px-4 py-2.5 text-left font-medium">
                    {SPEC_DEFS[k]?.label ?? k}
                  </th>
                  <td className="px-4 py-2.5 text-muted-foreground">Ikke dokumentert av produsent</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="relaterte">
          <h2 id="relaterte" className="mb-6 text-2xl font-semibold sm:text-3xl">
            Relaterte produkter
          </h2>
          <ProductGrid products={related} />
        </section>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.short_description ?? product.description ?? undefined,
          sku: singleVariant?.sku,
          image: product.images.map((i) => absoluteUrl(i.url)),
          brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
          category: product.category?.name,
          offers:
            product.variants.length > 1
              ? {
                  "@type": "AggregateOffer",
                  priceCurrency: "NOK",
                  lowPrice: (Math.min(...prices) / 100).toFixed(2),
                  highPrice: (Math.max(...prices) / 100).toFixed(2),
                  offerCount: product.variants.length,
                  availability: product.variants.some((v) => v.stock_available > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                }
              : {
                  "@type": "Offer",
                  priceCurrency: "NOK",
                  price: ((firstVariant?.price_ore ?? 0) / 100).toFixed(2),
                  availability: (firstVariant?.stock_available ?? 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                  url: absoluteUrl(`/produkt/${product.slug}`),
                  itemCondition: "https://schema.org/NewCondition",
                },
        }}
      />
    </div>
  );
}
