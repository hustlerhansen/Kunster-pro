import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { JsonLd } from "@/components/shop/json-ld";
import { Markdown } from "@/components/shop/markdown";
import { ProductGrid } from "@/components/shop/product-card";
import { getArticleBySlug, getArticles, getCategories, getProducts } from "@/lib/data/catalog";
import { absoluteUrl, formatDate } from "@/lib/utils";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getArticles()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/kunstnerguide/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticleBySlug(slug);
  if (!a) return {};
  return {
    title: a.seo_title ?? a.title,
    description: a.seo_description ?? a.excerpt ?? undefined,
    alternates: { canonical: `/kunstnerguide/${a.slug}` },
    openGraph: { type: "article", title: a.seo_title ?? a.title, description: a.seo_description ?? a.excerpt ?? undefined, publishedTime: a.published_at ?? undefined },
  };
}

export default async function ArticlePage({ params }: PageProps<"/kunstnerguide/[slug]">) {
  const { slug } = await params;
  const a = await getArticleBySlug(slug);
  if (!a) notFound();
  const [related, categories, others] = await Promise.all([getProducts({ ids: a.related_product_ids }), getCategories(), getArticles()]);
  const cats = categories.filter((c) => a.related_category_slugs.includes(c.slug));
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Kunstnerguide", href: "/kunstnerguide" }, { label: a.title }]} />
      <article className="mx-auto mt-8 max-w-3xl">
        <h1 className="text-4xl leading-tight font-semibold sm:text-5xl">{a.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {a.author_name} {a.published_at && `· ${formatDate(a.published_at)}`} {a.reading_minutes && `· ${a.reading_minutes} min lesetid`}
        </p>
        {a.excerpt && <p className="mt-6 font-serif text-xl text-foreground/85">{a.excerpt}</p>}
        <div className="mt-8">
          <Markdown>{a.body}</Markdown>
        </div>
        {cats.length > 0 && (
          <p className="mt-10 rounded-lg border bg-white p-4 text-sm">
            Se utvalget:{" "}
            {cats.map((c, i) => (
              <span key={c.id}>
                {i > 0 && ", "}
                <Link href={`/${c.slug}`} className="font-medium underline">
                  {c.name}
                </Link>
              </span>
            ))}
          </p>
        )}
      </article>
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-semibold">Produkter nevnt i artikkelen</h2>
          <ProductGrid products={related} />
        </section>
      )}
      <section className="mx-auto mt-16 max-w-3xl border-t pt-8">
        <h2 className="mb-4 text-xl font-semibold">Flere guider</h2>
        <ul className="space-y-2">
          {others.filter((o) => o.id !== a.id).slice(0, 5).map((o) => (
            <li key={o.id}>
              <Link href={`/kunstnerguide/${o.slug}`} className="underline underline-offset-4">
                {o.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: a.title,
          description: a.excerpt,
          datePublished: a.published_at,
          dateModified: a.updated_at ?? a.published_at,
          author: { "@type": "Organization", name: a.author_name ?? "Kunstner Pro" },
          publisher: { "@type": "Organization", name: "Kunstner Pro" },
          mainEntityOfPage: absoluteUrl(`/kunstnerguide/${a.slug}`),
          image: a.cover_image_url ? absoluteUrl(a.cover_image_url) : undefined,
        }}
      />
    </div>
  );
}
