-- =====================================================================
-- Kunstner Pro – databaseskjema
-- Alle beløp lagres i øre (integer). Utsalgspriser lagres inkl. MVA.
-- =====================================================================

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ---------------------------------------------------------------------
-- Felles hjelpefunksjon: updated_at
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Butikkinnstillinger (nøkkel/verdi). Leveringstid, banner, betaling osv.
-- ---------------------------------------------------------------------
create table public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

-- ---------------------------------------------------------------------
-- Prisgrupper (B2B)
-- ---------------------------------------------------------------------
create table public.price_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  -- Generell rabatt i prosent på alle produkter for gruppen (0–100)
  discount_percent numeric(5,2) not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Bedrifter / organisasjoner
-- ---------------------------------------------------------------------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org_number text not null unique check (org_number ~ '^[0-9]{9}$'),
  customer_category text not null default 'other'
    check (customer_category in ('artist','school','association','studio','course','retailer','other')),
  contact_name text,
  email citext,
  phone text,
  billing_address jsonb,
  delivery_address jsonb,
  price_group_id uuid references public.price_groups (id) on delete set null,
  status text not null default 'active' check (status in ('active','blocked')),
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Profiler (1:1 med auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email citext,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','staff','admin')),
  customer_type text not null default 'private' check (customer_type in ('private','business')),
  company_id uuid references public.companies (id) on delete set null,
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  is_blocked boolean not null default false,
  anonymized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_company_idx on public.profiles (company_id);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text,
  full_name text not null,
  company_name text,
  line1 text not null,
  line2 text,
  postal_code text not null check (postal_code ~ '^[0-9]{4}$'),
  city text not null,
  country text not null default 'NO',
  phone text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id);

-- ---------------------------------------------------------------------
-- Katalog
-- ---------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  tagline text,
  description text,
  -- Lengre SEO-/kategoritekst (markdown)
  long_description text,
  image_url text,
  seo_title text,
  seo_description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  description text,
  website text,
  logo_url text,
  is_house_brand boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  subtitle text,
  short_description text,
  description text,
  category_id uuid not null references public.categories (id) on delete restrict,
  brand_id uuid references public.brands (id) on delete set null,
  product_type text not null default 'accessory'
    check (product_type in ('oil_paint','brush','canvas','medium','set','accessory')),
  -- Type-spesifikke spesifikasjoner. Kun dokumenterte egenskaper skal fylles ut.
  specs jsonb not null default '{}'::jsonb,
  usage text,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  -- Fiktive demoprodukter merkes slik at de vises som DEMO i admin
  is_demo boolean not null default false,
  featured boolean not null default false,
  sort_order integer not null default 0,
  -- Overstyrer generell leveringstekst for produktet (f.eks. bestillingsvare)
  delivery_note text,
  related_product_ids uuid[] not null default '{}',
  seo_title text,
  seo_description text,
  search_vector tsvector generated always as (
    setweight(to_tsvector('norwegian', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('norwegian', coalesce(subtitle, '')), 'B') ||
    setweight(to_tsvector('norwegian', coalesce(short_description, '')), 'B') ||
    setweight(to_tsvector('norwegian', coalesce(description, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
create index products_status_idx on public.products (status);
create index products_search_idx on public.products using gin (search_vector);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  alt text not null default '',
  sort_order integer not null default 0,
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique,
  name text not null,
  -- F.eks. {"volum": "37 ml"} eller {"størrelse": "30 x 40 cm"}
  options jsonb not null default '{}'::jsonb,
  price_ore integer not null check (price_ore >= 0),
  vat_rate numeric(5,2) not null default 25 check (vat_rate >= 0 and vat_rate <= 100),
  weight_g integer check (weight_g is null or weight_g >= 0),
  color_hex text check (color_hex is null or color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  barcode text,
  stock_on_hand integer not null default 0 check (stock_on_hand >= 0),
  stock_reserved integer not null default 0 check (stock_reserved >= 0),
  stock_available integer generated always as (stock_on_hand - stock_reserved) stored,
  min_stock integer not null default 0 check (min_stock >= 0),
  reorder_quantity integer check (reorder_quantity is null or reorder_quantity > 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Databasegaranti mot oversalg: reservert kan aldri overstige fysisk beholdning
  constraint product_variants_no_oversell check (stock_reserved <= stock_on_hand)
);
create index product_variants_product_idx on public.product_variants (product_id);

-- Prishistorikk – brukes til å beregne lovlig førpris (laveste pris siste 30 dager)
create table public.price_history (
  id bigint generated always as identity primary key,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  price_ore integer not null,
  valid_from timestamptz not null default now()
);
create index price_history_variant_idx on public.price_history (variant_id, valid_from desc);

-- Produktpakker (malersett): hvilke varianter settet består av,
-- slik at besparelse mot enkeltkjøp kan beregnes ærlig.
create table public.bundle_items (
  bundle_product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  primary key (bundle_product_id, variant_id)
);

-- B2B-priser per prisgruppe (inkl. MVA, som øvrige priser)
create table public.price_group_prices (
  price_group_id uuid not null references public.price_groups (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  price_ore integer not null check (price_ore >= 0),
  primary key (price_group_id, variant_id)
);

create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ---------------------------------------------------------------------
-- Leverandører og innkjøp
-- ---------------------------------------------------------------------
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  email citext,
  phone text,
  website text,
  country text not null default 'NO',
  region text not null default 'NO' check (region in ('NO','EU','CN','OTHER')),
  currency text not null default 'NOK' check (currency ~ '^[A-Z]{3}$'),
  lead_time_days integer check (lead_time_days is null or lead_time_days >= 0),
  min_order_value numeric(14,2),
  payment_terms text,
  notes text,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.supplier_products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  supplier_sku text,
  purchase_price numeric(14,4) not null check (purchase_price >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  min_order_quantity integer not null default 1 check (min_order_quantity > 0),
  is_preferred boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (supplier_id, variant_id)
);

create table public.supplier_price_history (
  id bigint generated always as identity primary key,
  supplier_product_id uuid not null references public.supplier_products (id) on delete cascade,
  purchase_price numeric(14,4) not null,
  currency text not null,
  recorded_at timestamptz not null default now()
);

-- Kostnadsprofil per variant (landed cost). Kun synlig for administratorer.
-- Inngående MVA (fradragsberettiget) skal IKKE inngå her for MVA-registrert virksomhet.
create table public.variant_costs (
  variant_id uuid primary key references public.product_variants (id) on delete cascade,
  supplier_id uuid references public.suppliers (id) on delete set null,
  purchase_price numeric(14,4) not null default 0 check (purchase_price >= 0),
  currency text not null default 'NOK' check (currency ~ '^[A-Z]{3}$'),
  exchange_rate numeric(14,6) not null default 1 check (exchange_rate > 0),
  freight_per_unit_ore integer not null default 0 check (freight_per_unit_ore >= 0),
  duty_per_unit_ore integer not null default 0 check (duty_per_unit_ore >= 0),
  other_per_unit_ore integer not null default 0 check (other_per_unit_ore >= 0),
  -- Variable salgskostnader (emballasje o.l.) per enhet og betalingsgebyr i %
  packaging_per_unit_ore integer not null default 0 check (packaging_per_unit_ore >= 0),
  payment_fee_percent numeric(5,2) not null default 0 check (payment_fee_percent >= 0 and payment_fee_percent < 100),
  landed_cost_ore integer generated always as (
    round(purchase_price * exchange_rate * 100)::integer
    + freight_per_unit_ore + duty_per_unit_ore + other_per_unit_ore
  ) stored,
  is_demo boolean not null default false,
  notes text,
  updated_at timestamptz not null default now()
);

create sequence public.purchase_order_number_seq start 1001;

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number bigint not null unique default nextval('public.purchase_order_number_seq'),
  supplier_id uuid not null references public.suppliers (id) on delete restrict,
  status text not null default 'draft'
    check (status in ('draft','sent','confirmed','shipped','received','cancelled')),
  currency text not null default 'NOK' check (currency ~ '^[A-Z]{3}$'),
  exchange_rate numeric(14,6) not null default 1 check (exchange_rate > 0),
  freight_cost_ore integer not null default 0 check (freight_cost_ore >= 0),
  duty_cost_ore integer not null default 0 check (duty_cost_ore >= 0),
  other_cost_ore integer not null default 0 check (other_cost_ore >= 0),
  ordered_at timestamptz,
  expected_at date,
  received_at timestamptz,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(14,4) not null check (unit_price >= 0),
  received_quantity integer not null default 0 check (received_quantity >= 0)
);
create index purchase_order_items_po_idx on public.purchase_order_items (purchase_order_id);

create table public.inventory_movements (
  id bigint generated always as identity primary key,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  quantity_change integer not null,
  reason text not null check (reason in ('sale','purchase','adjustment','return','count','damage','initial')),
  reference_type text,
  reference_id text,
  note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index inventory_movements_variant_idx on public.inventory_movements (variant_id, created_at desc);

-- ---------------------------------------------------------------------
-- Frakt
-- ---------------------------------------------------------------------
create table public.shipping_methods (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  carrier text not null default 'bring' check (carrier in ('bring','postnord','helthjem','own','other')),
  type text not null default 'home' check (type in ('home','pickup','business')),
  price_ore integer not null default 0 check (price_ore >= 0),
  -- Fri frakt over dette beløpet (inkl. MVA). NULL = aldri fri frakt.
  free_threshold_ore integer check (free_threshold_ore is null or free_threshold_ore >= 0),
  -- Leveringsestimat som vises til kunden. NULL = vis ikke estimat.
  delivery_estimate text,
  max_weight_g integer,
  requires_business boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Kampanjer
-- ---------------------------------------------------------------------
create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code citext not null unique check (length(code) between 3 and 40),
  description text,
  type text not null check (type in ('percent','fixed','free_shipping')),
  -- percent: 1–100 · fixed: øre · free_shipping: 0
  value integer not null default 0 check (value >= 0),
  min_order_ore integer not null default 0 check (min_order_ore >= 0),
  category_id uuid references public.categories (id) on delete cascade,
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  uses_count integer not null default 0,
  once_per_customer boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discount_percent_range check (type <> 'percent' or (value between 1 and 100))
);

create table public.volume_discounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  product_id uuid references public.products (id) on delete cascade,
  category_id uuid references public.categories (id) on delete cascade,
  min_quantity integer not null check (min_quantity >= 2),
  percent_off numeric(5,2) not null check (percent_off > 0 and percent_off < 100),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint volume_discount_target check (product_id is not null or category_id is not null)
);

-- ---------------------------------------------------------------------
-- Ordre
-- ---------------------------------------------------------------------
create sequence public.order_number_seq start 100001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint not null unique default nextval('public.order_number_seq'),
  user_id uuid references auth.users (id) on delete set null,
  company_id uuid references public.companies (id) on delete set null,
  email citext not null,
  phone text,
  customer_name text not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment','paid','processing','shipped','delivered','cancelled','refunded')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','pending','paid','failed','refunded','partially_refunded','invoiced')),
  payment_method text not null check (payment_method in ('card','vipps','invoice')),
  payment_provider text check (payment_provider in ('stripe','vipps','internal')),
  payment_reference text,
  payment_intent_id text,
  subtotal_ore integer not null check (subtotal_ore >= 0),
  discount_ore integer not null default 0 check (discount_ore >= 0),
  shipping_ore integer not null default 0 check (shipping_ore >= 0),
  total_ore integer not null check (total_ore >= 0),
  vat_ore integer not null default 0 check (vat_ore >= 0),
  currency text not null default 'NOK',
  discount_code text,
  shipping_method_code text,
  shipping_method_name text,
  shipping_address jsonb not null,
  billing_address jsonb,
  customer_note text,
  purchase_reference text,
  marketing_consent boolean not null default false,
  terms_accepted_at timestamptz not null,
  reservation_expires_at timestamptz,
  stock_committed boolean not null default false,
  stock_released boolean not null default false,
  paid_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);
create index orders_payment_ref_idx on public.orders (payment_reference);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  variant_name text,
  sku text,
  quantity integer not null check (quantity > 0),
  unit_price_ore integer not null check (unit_price_ore >= 0),
  discount_ore integer not null default 0 check (discount_ore >= 0),
  vat_rate numeric(5,2) not null default 25,
  line_total_ore integer not null check (line_total_ore >= 0)
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_variant_idx on public.order_items (variant_id);

-- Kostnad på salgstidspunktet (for lønnsomhetsrapporter). Kun admin.
create table public.order_item_costs (
  order_item_id uuid primary key references public.order_items (id) on delete cascade,
  unit_cost_ore integer not null default 0,
  unit_variable_cost_ore integer not null default 0
);

create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  event_type text not null,
  message text not null,
  visible_to_customer boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events (order_id, created_at);

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  carrier text not null,
  service text,
  tracking_number text,
  tracking_url text,
  status text not null default 'created'
    check (status in ('created','in_transit','ready_for_pickup','delivered','returned','exception')),
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shipments_order_idx on public.shipments (order_id);

create sequence public.return_number_seq start 5001;

create table public.returns (
  id uuid primary key default gen_random_uuid(),
  return_number bigint not null unique default nextval('public.return_number_seq'),
  order_id uuid not null references public.orders (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  -- withdrawal = angrerett, complaint = reklamasjon
  type text not null check (type in ('withdrawal','complaint')),
  status text not null default 'requested'
    check (status in ('requested','approved','rejected','received','refunded','closed')),
  reason text not null,
  description text,
  items jsonb not null default '[]'::jsonb,
  refund_amount_ore integer check (refund_amount_ore is null or refund_amount_ore >= 0),
  restock boolean not null default false,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Handlekonto, kreditt og fakturaer (B2B – manuell godkjenning)
-- ---------------------------------------------------------------------
create table public.credit_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  company_id uuid references public.companies (id) on delete set null,
  company_name text not null,
  org_number text not null check (org_number ~ '^[0-9]{9}$'),
  customer_category text not null default 'other',
  contact_name text not null,
  email citext not null,
  phone text not null,
  billing_address jsonb not null,
  delivery_address jsonb,
  requested_limit_ore integer not null check (requested_limit_ore >= 0),
  expected_monthly_ore integer,
  message text,
  terms_accepted boolean not null default false,
  status text not null default 'submitted'
    check (status in ('submitted','under_review','approved','rejected','withdrawn')),
  decision_note text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.credit_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','active','suspended','closed')),
  credit_limit_ore integer not null default 0 check (credit_limit_ore >= 0),
  payment_terms_days integer not null default 14 check (payment_terms_days between 0 and 90),
  notes text,
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence public.invoice_number_seq start 20001;

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number bigint not null unique default nextval('public.invoice_number_seq'),
  order_id uuid references public.orders (id) on delete restrict,
  company_id uuid references public.companies (id) on delete restrict,
  user_id uuid references auth.users (id) on delete set null,
  amount_ore integer not null check (amount_ore >= 0),
  vat_ore integer not null default 0,
  issued_at timestamptz not null default now(),
  due_at timestamptz not null,
  status text not null default 'open' check (status in ('open','paid','overdue','cancelled','credited')),
  paid_at timestamptz,
  kid text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index invoices_company_idx on public.invoices (company_id, status);

create table public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  amount_ore integer not null check (amount_ore > 0),
  paid_at timestamptz not null default now(),
  method text not null default 'bank_transfer',
  reference text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Innhold: Kunstnerguide
-- ---------------------------------------------------------------------
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  excerpt text,
  body text not null default '',
  cover_image_url text,
  author_name text,
  reading_minutes integer,
  related_product_ids uuid[] not null default '{}',
  related_category_slugs text[] not null default '{}',
  seo_title text,
  seo_description text,
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Markedsføring (samtykkebasert)
-- ---------------------------------------------------------------------
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  user_id uuid references auth.users (id) on delete set null,
  status text not null default 'pending' check (status in ('pending','subscribed','unsubscribed')),
  consent_text text not null,
  consent_source text not null,
  consent_ip text,
  confirm_token uuid default gen_random_uuid(),
  unsubscribe_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz
);

create table public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  preheader text,
  body_markdown text not null,
  status text not null default 'draft' check (status in ('draft','sending','sent','failed')),
  sent_count integer not null default 0,
  sent_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.abandoned_carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  email citext not null,
  items jsonb not null default '[]'::jsonb,
  subtotal_ore integer not null default 0,
  reminder_sent_at timestamptz,
  recovered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Kundeservice
-- ---------------------------------------------------------------------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  email citext not null,
  subject text not null,
  order_number text,
  message text not null,
  status text not null default 'new' check (status in ('new','open','closed')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Drift, sikkerhet og logging
-- ---------------------------------------------------------------------
create table public.email_log (
  id bigint generated always as identity primary key,
  to_email text not null,
  template text not null,
  subject text not null,
  status text not null check (status in ('sent','failed','skipped')),
  provider_message_id text,
  error text,
  order_id uuid references public.orders (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text,
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  ip text,
  created_at timestamptz not null default now()
);
create index audit_log_created_idx on public.audit_log (created_at desc);

create table public.payment_events (
  id text primary key,
  provider text not null,
  type text not null,
  order_id uuid references public.orders (id) on delete set null,
  payload jsonb,
  processed_at timestamptz not null default now()
);

create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 0
);

-- updated_at-triggere
do $$
declare t text;
begin
  foreach t in array array[
    'price_groups','companies','profiles','addresses','categories','products','product_variants',
    'suppliers','supplier_products','purchase_orders','shipping_methods','discount_codes','orders',
    'shipments','returns','credit_applications','credit_accounts','invoices','articles',
    'email_campaigns','abandoned_carts'
  ]
  loop
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;
