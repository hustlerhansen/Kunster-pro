/**
 * Genererer supabase/seed.sql fra demodataene i src/lib/demo (én felles kilde).
 * Kjør: npm run db:seed:generate
 *
 * Alt som opprettes her er DEMO-data (is_demo = true) og skal erstattes før lansering.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEFAULT_SETTINGS,
  DEMO_BRAND,
  DEMO_CATEGORIES,
  DEMO_EXCHANGE_RATE_EUR,
  DEMO_PRODUCTS,
  DEMO_SHIPPING_METHODS,
  DEMO_SUPPLIER,
  DEMO_VARIANT_COSTS,
  DEMO_VOLUME_DISCOUNTS,
} from "../src/lib/demo/catalog";
import { DEMO_ARTICLES } from "../src/lib/demo/articles";

function lit(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (Array.isArray(v)) {
    if (v.length === 0) return "'{}'";
    // Array-literal ('{a,b}') lar Postgres tolke typen ut fra kolonnen (uuid[] / text[])
    return lit(`{${v.map((x) => `"${String(x).replace(/"/g, '\\"')}"`).join(",")}}`);
  }
  if (typeof v === "object") return `${lit(JSON.stringify(v))}::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

function insert(table: string, rows: Record<string, unknown>[], conflict = "id"): string {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const values = rows.map((r) => `  (${cols.map((c) => lit(r[c])).join(", ")})`).join(",\n");
  return `insert into public.${table} (${cols.join(", ")}) values\n${values}\non conflict (${conflict}) do nothing;\n\n`;
}

let sql = `-- =====================================================================
-- Kunstner Pro – DEMODATA (generert av scripts/generate-seed.ts)
-- Fiktive produkter, priser, lagertall og innkjøpskost. Merket is_demo = true.
-- Ingen anmeldelser, kunder eller salgsdata opprettes.
-- =====================================================================

`;

sql += insert(
  "settings",
  Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ key, value })),
  "key",
);

sql += insert("brands", [
  { id: DEMO_BRAND.id, slug: DEMO_BRAND.slug, name: DEMO_BRAND.name, description: DEMO_BRAND.description, is_house_brand: true },
]);

sql += insert(
  "categories",
  DEMO_CATEGORIES.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    description: c.description,
    long_description: c.long_description,
    image_url: c.image_url,
    seo_title: c.seo_title,
    seo_description: c.seo_description,
    sort_order: c.sort_order,
    is_active: true,
  })),
);

sql += insert(
  "products",
  DEMO_PRODUCTS.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    subtitle: p.subtitle,
    short_description: p.short_description,
    description: p.description,
    category_id: p.category_id,
    brand_id: p.brand_id,
    product_type: p.product_type,
    specs: p.specs,
    usage: p.usage,
    status: "active",
    is_demo: true,
    featured: p.featured,
    sort_order: p.sort_order,
    related_product_ids: p.related_product_ids,
  })),
);

sql += insert(
  "product_images",
  DEMO_PRODUCTS.flatMap((p) => p.images.map((img, i) => ({ product_id: p.id, url: img.url, alt: img.alt, sort_order: i, is_placeholder: true }))).map((r, i) => ({
    id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    ...r,
  })),
);

sql += insert(
  "product_variants",
  DEMO_PRODUCTS.flatMap((p) =>
    p.variants.map((v) => ({
      id: v.id,
      product_id: p.id,
      sku: v.sku,
      name: v.name,
      options: v.options,
      price_ore: v.price_ore,
      vat_rate: v.vat_rate,
      weight_g: v.weight_g,
      color_hex: v.color_hex,
      stock_on_hand: v.stock_on_hand ?? v.stock_available,
      min_stock: v.min_stock,
      sort_order: v.sort_order,
    })),
  ),
);

sql += insert(
  "bundle_items",
  DEMO_PRODUCTS.flatMap((p) => (p.bundle_items ?? []).map((b) => ({ bundle_product_id: p.id, variant_id: b.variant_id, quantity: b.quantity }))),
  "bundle_product_id, variant_id",
);

// Startbeholdning registreres som lagerbevegelse for sporbarhet
sql += `insert into public.inventory_movements (variant_id, quantity_change, reason, note)
select id, stock_on_hand, 'initial', 'DEMO startbeholdning'
from public.product_variants
where stock_on_hand > 0
  and not exists (select 1 from public.inventory_movements m where m.variant_id = product_variants.id);

`;

sql += insert("shipping_methods", DEMO_SHIPPING_METHODS.map((m) => ({ ...m })));

sql += insert(
  "volume_discounts",
  DEMO_VOLUME_DISCOUNTS.map((v) => ({ ...v })),
);

sql += insert("suppliers", [
  {
    id: DEMO_SUPPLIER.id,
    name: DEMO_SUPPLIER.name,
    country: DEMO_SUPPLIER.country,
    region: DEMO_SUPPLIER.region,
    currency: DEMO_SUPPLIER.currency,
    lead_time_days: DEMO_SUPPLIER.lead_time_days,
    notes: "DEMO – fiktiv leverandør for å vise innkjøps- og lønnsomhetsmodulene.",
    is_demo: true,
  },
]);

sql += insert(
  "supplier_products",
  DEMO_VARIANT_COSTS.map((c, i) => ({
    id: `00000000-0000-4000-9000-${String(i + 1).padStart(12, "0")}`,
    supplier_id: DEMO_SUPPLIER.id,
    variant_id: c.variant_id,
    purchase_price: c.purchase_price_eur,
    currency: "EUR",
    min_order_quantity: 6,
    is_preferred: true,
  })),
);

sql += insert(
  "variant_costs",
  DEMO_VARIANT_COSTS.map((c) => ({
    variant_id: c.variant_id,
    supplier_id: DEMO_SUPPLIER.id,
    purchase_price: c.purchase_price_eur,
    currency: "EUR",
    exchange_rate: DEMO_EXCHANGE_RATE_EUR,
    freight_per_unit_ore: 300,
    duty_per_unit_ore: 0,
    other_per_unit_ore: 50,
    packaging_per_unit_ore: 200,
    payment_fee_percent: 1.8,
    is_demo: true,
    notes: "DEMO-kostnader",
  })),
  "variant_id",
);

sql += insert(
  "articles",
  DEMO_ARTICLES.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    body: a.body,
    cover_image_url: a.cover_image_url,
    author_name: a.author_name,
    reading_minutes: a.reading_minutes,
    related_product_ids: a.related_product_ids,
    related_category_slugs: a.related_category_slugs,
    seo_title: a.seo_title,
    seo_description: a.seo_description,
    status: "published",
    published_at: a.published_at,
  })),
);

const out = join(process.cwd(), "supabase", "seed.sql");
writeFileSync(out, sql);
console.log(`Skrev ${out} (${DEMO_PRODUCTS.length} produkter, ${DEMO_ARTICLES.length} artikler)`);
