export type ProductType = "oil_paint" | "brush" | "canvas" | "medium" | "set" | "accessory";
export type ProductStatus = "draft" | "active" | "archived";

export interface Category {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  long_description: string | null;
  image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
  is_active?: boolean;
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  website: string | null;
  is_house_brand: boolean;
}

export interface ProductImage {
  id?: string;
  url: string;
  alt: string;
  sort_order?: number;
  is_placeholder: boolean;
}

/** Spesifikasjonsverdier. Kun dokumenterte egenskaper skal registreres. */
export type SpecValues = Record<string, string | number | null | undefined>;

export interface Variant {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  options: SpecValues;
  price_ore: number;
  vat_rate: number;
  weight_g: number | null;
  color_hex: string | null;
  stock_on_hand?: number;
  stock_reserved?: number;
  stock_available: number;
  min_stock: number;
  is_active: boolean;
  sort_order: number;
  /** Laveste pris siste 30 dager før gjeldende prisreduksjon (lovlig førpris). */
  reference_price_ore?: number | null;
}

export interface BundleItem {
  variant_id: string;
  quantity: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  short_description: string | null;
  description: string | null;
  category_id: string;
  category?: Pick<Category, "id" | "slug" | "name"> | null;
  brand_id: string | null;
  brand?: Pick<Brand, "id" | "slug" | "name" | "is_house_brand"> | null;
  product_type: ProductType;
  specs: SpecValues;
  usage: string | null;
  status: ProductStatus;
  is_demo: boolean;
  featured: boolean;
  sort_order: number;
  delivery_note: string | null;
  related_product_ids: string[];
  seo_title: string | null;
  seo_description: string | null;
  images: ProductImage[];
  variants: Variant[];
  bundle_items?: BundleItem[];
  created_at?: string;
}

export interface ShippingMethod {
  id: string;
  code: string;
  name: string;
  description: string | null;
  carrier: "bring" | "postnord" | "helthjem" | "own" | "other";
  type: "home" | "pickup" | "business";
  price_ore: number;
  free_threshold_ore: number | null;
  delivery_estimate: string | null;
  max_weight_g: number | null;
  requires_business: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface VolumeDiscount {
  id: string;
  name: string;
  description: string | null;
  product_id: string | null;
  category_id: string | null;
  min_quantity: number;
  percent_off: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

export interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  type: "percent" | "fixed" | "free_shipping";
  value: number;
  min_order_ore: number;
  category_id: string | null;
  starts_at: string | null;
  ends_at: string | null;
  max_uses: number | null;
  uses_count: number;
  once_per_customer: boolean;
  is_active: boolean;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_image_url: string | null;
  author_name: string | null;
  reading_minutes: number | null;
  related_product_ids: string[];
  related_category_slugs: string[];
  seo_title: string | null;
  seo_description: string | null;
  status: "draft" | "published";
  published_at: string | null;
  updated_at?: string;
}

export interface BannerItem {
  icon: "truck" | "gift" | "star" | "card" | "headset" | "map" | "shield";
  text: string;
  href?: string | null;
}

export interface StoreSettings {
  store: {
    name: string;
    tagline: string;
    main_message: string;
    support_email: string | null;
    support_phone: string | null;
    support_hours: string | null;
  };
  /** Leveringsløfter vises KUN når de er dokumentert og aktivert av administrator. */
  delivery: {
    show_delivery_time: boolean;
    delivery_time_text: string | null;
    dispatch_text: string | null;
    free_shipping_threshold_ore: number | null;
  };
  banner: { items: BannerItem[] };
  payments: {
    card_enabled: boolean;
    vipps_enabled: boolean;
    invoice_enabled: boolean;
  };
  /** Juridiske opplysninger. NULL = ikke registrert – vises tydelig som manglende. */
  company: {
    legal_name: string | null;
    org_number: string | null;
    vat_registered: boolean;
    address: string | null;
    email: string | null;
    phone: string | null;
  };
  hero: {
    image_url: string | null;
    image_alt: string | null;
  };
}

export interface CartLineInput {
  variantId: string;
  quantity: number;
}

export interface Address {
  full_name: string;
  company_name?: string | null;
  line1: string;
  line2?: string | null;
  postal_code: string;
  city: string;
  country: string;
  phone?: string | null;
}
