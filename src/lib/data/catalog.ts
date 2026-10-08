import "server-only";
import { unstable_cache } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import {
  DEFAULT_SETTINGS,
  DEMO_CATEGORIES,
  DEMO_PRODUCTS,
  DEMO_SHIPPING_METHODS,
  DEMO_VOLUME_DISCOUNTS,
} from "@/lib/demo/catalog";
import { DEMO_ARTICLES } from "@/lib/demo/articles";
import type { Article, Category, Product, ShippingMethod, StoreSettings, Variant, VolumeDiscount } from "@/lib/types";

export const CATALOG_TAG = "catalog";
const REVALIDATE_SECONDS = 300;

export const PRODUCT_SELECT = `
  id, slug, name, subtitle, short_description, description, category_id, brand_id, product_type, specs, usage,
  status, is_demo, featured, sort_order, delivery_note, related_product_ids, seo_title, seo_description, created_at,
  category:categories(id, slug, name),
  brand:brands(id, slug, name, is_house_brand),
  images:product_images(id, url, alt, sort_order, is_placeholder),
  variants:product_variants!product_variants_product_id_fkey(id, product_id, sku, name, options, price_ore, vat_rate, weight_g, color_hex, stock_on_hand, stock_reserved, stock_available, min_stock, is_active, sort_order),
  bundle_items:bundle_items(variant_id, quantity)
`;

type Row = Record<string, unknown>;

export function mapProduct(row: Row): Product {
  const images = ((row.images as Row[] | null) ?? [])
    .map((i) => ({
      id: i.id as string,
      url: i.url as string,
      alt: (i.alt as string) || (row.name as string),
      sort_order: (i.sort_order as number) ?? 0,
      is_placeholder: Boolean(i.is_placeholder),
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
  const variants = ((row.variants as Row[] | null) ?? [])
    .map((v) => ({ ...(v as unknown as Variant), reference_price_ore: null }))
    .filter((v) => v.is_active)
    .sort((a, b) => a.sort_order - b.sort_order || a.price_ore - b.price_ore);
  return {
    ...(row as unknown as Product),
    specs: (row.specs as Product["specs"]) ?? {},
    related_product_ids: (row.related_product_ids as string[]) ?? [],
    images,
    variants,
    bundle_items: (row.bundle_items as Product["bundle_items"]) ?? [],
  };
}

async function attachReferencePrices(products: Product[]): Promise<Product[]> {
  const ids = products.flatMap((p) => p.variants.map((v) => v.id));
  if (ids.length === 0) return products;
  const { data, error } = await createPublicClient().rpc("reference_prices", { p_variant_ids: ids });
  if (error || !data) return products;
  const map = new Map((data as { variant_id: string; reference_price_ore: number | null }[]).map((r) => [r.variant_id, r.reference_price_ore]));
  return products.map((p) => ({
    ...p,
    variants: p.variants.map((v) => ({ ...v, reference_price_ore: map.get(v.id) ?? null })),
  }));
}

// ---------------------------------------------------------------- Kategorier
const fetchCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const { data, error } = await createPublicClient()
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as Category[];
  },
  ["categories"],
  { tags: [CATALOG_TAG], revalidate: REVALIDATE_SECONDS },
);

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) return DEMO_CATEGORIES;
  return fetchCategories();
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

// ---------------------------------------------------------------- Produkter
const fetchAllProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const { data, error } = await createPublicClient()
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("status", "active")
      .order("sort_order");
    if (error) throw error;
    return attachReferencePrices(((data ?? []) as Row[]).map(mapProduct));
  },
  ["products-all"],
  { tags: [CATALOG_TAG], revalidate: REVALIDATE_SECONDS },
);

/**
 * Sortimentet er bevisst lite og kuratert (~20–200 produkter), så hele katalogen
 * hentes og caches samlet. Ved vesentlig større sortiment bør dette pagineres i databasen.
 */
export async function getAllProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return DEMO_PRODUCTS;
  return fetchAllProducts();
}

export type ProductSort = "popular" | "price-asc" | "price-desc" | "name" | "newest";

export function minPrice(p: Product): number {
  return p.variants.length ? Math.min(...p.variants.map((v) => v.price_ore)) : 0;
}

export function totalAvailable(p: Product): number {
  return p.variants.reduce((sum, v) => sum + Math.max(v.stock_available, 0), 0);
}

export async function getProducts(opts: {
  categorySlug?: string;
  featured?: boolean;
  ids?: string[];
  limit?: number;
  sort?: ProductSort;
  inStockOnly?: boolean;
} = {}): Promise<Product[]> {
  let products = await getAllProducts();
  if (opts.categorySlug) products = products.filter((p) => p.category?.slug === opts.categorySlug);
  if (opts.featured) products = products.filter((p) => p.featured);
  if (opts.ids) {
    const order = new Map(opts.ids.map((id, i) => [id, i]));
    products = products.filter((p) => order.has(p.id)).sort((a, b) => order.get(a.id)! - order.get(b.id)!);
  }
  if (opts.inStockOnly) products = products.filter((p) => totalAvailable(p) > 0);
  switch (opts.sort) {
    case "price-asc":
      products = [...products].sort((a, b) => minPrice(a) - minPrice(b));
      break;
    case "price-desc":
      products = [...products].sort((a, b) => minPrice(b) - minPrice(a));
      break;
    case "name":
      products = [...products].sort((a, b) => a.name.localeCompare(b.name, "nb"));
      break;
    case "newest":
      products = [...products].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
      break;
    case "popular":
      products = [...products].sort((a, b) => Number(b.featured) - Number(a.featured) || a.sort_order - b.sort_order);
      break;
  }
  return typeof opts.limit === "number" ? products.slice(0, opts.limit) : products;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getAllProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const all = await getAllProducts();
  const explicit = product.related_product_ids
    .map((id) => all.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));
  const sameCategory = all.filter(
    (p) => p.category_id === product.category_id && p.id !== product.id && !explicit.some((e) => e.id === p.id),
  );
  return [...explicit, ...sameCategory].slice(0, limit);
}

/** Produkter med reell prisreduksjon (førpris = laveste pris siste 30 dager). */
export async function getProductsOnSale(): Promise<Product[]> {
  const products = await getAllProducts();
  return products.filter((p) => p.variants.some((v) => (v.reference_price_ore ?? 0) > v.price_ore));
}

/** Verdien av settets innhold ved enkeltkjøp (for ærlig «du sparer»-visning). */
export async function getBundleValue(product: Product): Promise<number | null> {
  if (!product.bundle_items?.length) return null;
  const all = await getAllProducts();
  const variants = new Map(all.flatMap((p) => p.variants.map((v) => [v.id, v] as const)));
  let total = 0;
  for (const item of product.bundle_items) {
    const v = variants.get(item.variant_id);
    if (!v) return null;
    total += v.price_ore * item.quantity;
  }
  return total;
}

export async function getBundleContents(product: Product) {
  if (!product.bundle_items?.length) return [];
  const all = await getAllProducts();
  return product.bundle_items
    .map((item) => {
      const parent = all.find((p) => p.variants.some((v) => v.id === item.variant_id));
      const variant = parent?.variants.find((v) => v.id === item.variant_id);
      return parent && variant ? { product: parent, variant, quantity: item.quantity } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

function normalize(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim().slice(0, 100);
  if (q.length < 2) return [];
  if (isSupabaseConfigured()) {
    const { data, error } = await createPublicClient().rpc("search_products", { q, max_results: 40 });
    if (!error && data) {
      const ids = (data as { id: string }[]).map((r) => r.id);
      return getProducts({ ids });
    }
  }
  const terms = normalize(q).split(/\s+/).filter(Boolean);
  const products = await getAllProducts();
  return products
    .map((p) => {
      const hay = normalize(
        [p.name, p.subtitle, p.short_description, p.category?.name, p.brand?.name, ...p.variants.map((v) => `${v.name} ${v.sku}`), ...Object.values(p.specs)]
          .filter(Boolean)
          .join(" "),
      );
      const score = terms.reduce((s, t) => s + (hay.includes(t) ? (normalize(p.name).includes(t) ? 3 : 1) : -100), 0);
      return { p, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.p);
}

// ---------------------------------------------------------------- Frakt, kampanjer, innstillinger
const fetchShipping = unstable_cache(
  async (): Promise<ShippingMethod[]> => {
    const { data, error } = await createPublicClient()
      .from("shipping_methods")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as ShippingMethod[];
  },
  ["shipping-methods"],
  { tags: [CATALOG_TAG, "settings"], revalidate: REVALIDATE_SECONDS },
);

export async function getShippingMethods(): Promise<ShippingMethod[]> {
  if (!isSupabaseConfigured()) return DEMO_SHIPPING_METHODS;
  return fetchShipping();
}

const fetchVolumeDiscounts = unstable_cache(
  async (): Promise<VolumeDiscount[]> => {
    const { data, error } = await createPublicClient().from("volume_discounts").select("*");
    if (error) throw error;
    return (data ?? []) as VolumeDiscount[];
  },
  ["volume-discounts"],
  { tags: [CATALOG_TAG], revalidate: REVALIDATE_SECONDS },
);

export async function getVolumeDiscounts(): Promise<VolumeDiscount[]> {
  if (!isSupabaseConfigured()) return DEMO_VOLUME_DISCOUNTS;
  return fetchVolumeDiscounts();
}

const fetchSettings = unstable_cache(
  async (): Promise<Partial<StoreSettings>> => {
    const { data, error } = await createPublicClient().from("settings").select("key, value");
    if (error) throw error;
    return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  },
  ["settings"],
  { tags: ["settings"], revalidate: REVALIDATE_SECONDS },
);

export function mergeSettings(partial: Partial<StoreSettings>): StoreSettings {
  return {
    store: { ...DEFAULT_SETTINGS.store, ...(partial.store ?? {}) },
    delivery: { ...DEFAULT_SETTINGS.delivery, ...(partial.delivery ?? {}) },
    banner: partial.banner?.items?.length ? partial.banner : DEFAULT_SETTINGS.banner,
    payments: { ...DEFAULT_SETTINGS.payments, ...(partial.payments ?? {}) },
    company: { ...DEFAULT_SETTINGS.company, ...(partial.company ?? {}) },
    hero: { ...DEFAULT_SETTINGS.hero, ...(partial.hero ?? {}) },
  };
}

export async function getSettings(): Promise<StoreSettings> {
  if (!isSupabaseConfigured()) return DEFAULT_SETTINGS;
  try {
    return mergeSettings(await fetchSettings());
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// ---------------------------------------------------------------- Artikler
const fetchArticles = unstable_cache(
  async (): Promise<Article[]> => {
    const { data, error } = await createPublicClient()
      .from("articles")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Article[];
  },
  ["articles"],
  { tags: ["articles"], revalidate: REVALIDATE_SECONDS },
);

export async function getArticles(): Promise<Article[]> {
  if (!isSupabaseConfigured()) return DEMO_ARTICLES;
  return fetchArticles();
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const articles = await getArticles();
  return articles.find((a) => a.slug === slug) ?? null;
}
