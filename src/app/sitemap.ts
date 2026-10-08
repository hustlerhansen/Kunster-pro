import type { MetadataRoute } from "next";
import { getAllProducts, getArticles, getCategories } from "@/lib/data/catalog";
import { siteUrl } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products, articles] = await Promise.all([getCategories(), getAllProducts(), getArticles()]);
  const staticPages = ["", "/produkter", "/tilbud", "/tilbehor", "/kunstnerguide", "/bedrift", "/handlekonto", "/kontakt", "/om-oss", "/frakt-og-levering", "/kjopsvilkar", "/angrerett", "/retur-og-reklamasjon", "/personvern", "/informasjonskapsler"];
  return [
    ...staticPages.map((p) => ({ url: `${siteUrl}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.5 })),
    ...categories.map((c) => ({ url: `${siteUrl}/${c.slug}`, changeFrequency: "daily" as const, priority: 0.9 })),
    ...products.map((p) => ({
      url: `${siteUrl}/produkt/${p.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
      images: p.images.filter((i) => !i.url.endsWith(".svg")).map((i) => (i.url.startsWith("http") ? i.url : `${siteUrl}${i.url}`)),
    })),
    ...articles.map((a) => ({ url: `${siteUrl}/kunstnerguide/${a.slug}`, lastModified: a.updated_at ?? a.published_at ?? undefined, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
