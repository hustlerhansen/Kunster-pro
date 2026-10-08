import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { Markdown } from "@/components/shop/markdown";
import { ProductListing, parseSort } from "@/components/shop/product-listing";
import { JsonLd } from "@/components/shop/json-ld";
import { getBundleValue, getCategories, getCategoryBySlug, getProducts } from "@/lib/data/catalog";
import { absoluteUrl } from "@/lib/utils";

export const revalidate = 300;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ kategori: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[kategori]">): Promise<Metadata> {
  const { kategori } = await params;
  const category = await getCategoryBySlug(kategori);
  if (!category) return {};
  return {
    title: category.seo_title ?? category.name,
    description: category.seo_description ?? category.description ?? undefined,
    alternates: { canonical: `/${category.slug}` },
    openGraph: { title: category.seo_title ?? category.name, description: category.seo_description ?? undefined, url: `/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/[kategori]">) {
  const { kategori } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(kategori);
  if (!category) notFound();
  const sort = parseSort(sp.sort);
  const inStock = sp.lager === "1";
  const products = await getProducts({ categorySlug: category.slug, sort, inStockOnly: inStock });
  const savings: Record<string, number | null> = {};
  for (const p of products) {
    if (p.product_type === "set") {
      const value = await getBundleValue(p);
      savings[p.id] = value ? value - Math.min(...p.variants.map((v) => v.price_ore)) : null;
    }
  }

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: category.name }]} />
      <header className="mt-5 mb-8 max-w-3xl">
        <h1 className="text-4xl font-semibold sm:text-5xl">{category.name}</h1>
        {category.description && <p className="mt-3 text-lg text-muted-foreground">{category.description}</p>}
      </header>
      <ProductListing products={products} basePath={`/${category.slug}`} sort={sort} inStock={inStock} savings={savings} />
      {category.long_description && (
        <section className="mt-16 max-w-3xl border-t border-border pt-10">
          <Markdown>{category.long_description}</Markdown>
        </section>
      )}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: category.name,
          description: category.description,
          url: absoluteUrl(`/${category.slug}`),
          mainEntity: {
            "@type": "ItemList",
            itemListElement: products.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(`/produkt/${p.slug}`), name: p.name })),
          },
        }}
      />
    </div>
  );
}
