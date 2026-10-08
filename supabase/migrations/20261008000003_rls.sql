-- =====================================================================
-- Kunstner Pro – Row Level Security
-- Prinsipp: alt er stengt som standard. Kunder ser kun egne data.
-- Ordre opprettes kun av serveren (service_role) etter server-side validering.
-- =====================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'settings','price_groups','companies','profiles','addresses','categories','brands','products',
    'product_images','product_variants','price_history','bundle_items','price_group_prices','favorites',
    'suppliers','supplier_products','supplier_price_history','variant_costs','purchase_orders',
    'purchase_order_items','inventory_movements','shipping_methods','discount_codes','volume_discounts',
    'orders','order_items','order_item_costs','order_events','shipments','returns',
    'credit_applications','credit_accounts','invoices','invoice_payments','articles',
    'newsletter_subscribers','email_campaigns','abandoned_carts','contact_messages','email_log',
    'audit_log','payment_events','rate_limits'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Ansatte (admin/staff) har full tilgang til drifts- og katalogtabeller
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'companies','addresses','categories','brands','products','product_images','product_variants',
    'price_history','bundle_items','price_group_prices','suppliers','supplier_products',
    'supplier_price_history','variant_costs','purchase_orders','purchase_order_items',
    'inventory_movements','shipping_methods','discount_codes','volume_discounts','orders','order_items',
    'order_item_costs','order_events','shipments','returns','credit_applications','invoices',
    'invoice_payments','articles','newsletter_subscribers','email_campaigns','abandoned_carts',
    'contact_messages','email_log','favorites'
  ]
  loop
    execute format(
      'create policy "staff_all_%1$s" on public.%1$I for all to authenticated using (public.is_staff()) with check (public.is_staff())',
      t
    );
  end loop;
end $$;

-- Sensitive tabeller: kun administrator (ikke staff)
create policy "admin_all_settings" on public.settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin_all_price_groups" on public.price_groups for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin_all_credit_accounts" on public.credit_accounts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admin_read_audit_log" on public.audit_log for select to authenticated
  using (public.is_admin());
create policy "admin_read_payment_events" on public.payment_events for select to authenticated
  using (public.is_admin());
create policy "staff_read_profiles" on public.profiles for select to authenticated
  using (public.is_staff());
create policy "admin_update_profiles" on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "staff_read_price_groups" on public.price_groups for select to authenticated
  using (public.is_staff());
create policy "staff_read_credit_accounts" on public.credit_accounts for select to authenticated
  using (public.is_staff());

-- rate_limits: ingen policyer -> kun service_role

-- ---------------------------------------------------------------------
-- Offentlig katalog (anon + innloggede)
-- ---------------------------------------------------------------------
create policy "public_read_settings" on public.settings for select to anon, authenticated
  using (key in ('store','delivery','banner','payments','company','hero'));

create policy "public_read_categories" on public.categories for select to anon, authenticated
  using (is_active);
create policy "public_read_brands" on public.brands for select to anon, authenticated
  using (true);
create policy "public_read_products" on public.products for select to anon, authenticated
  using (status = 'active');
create policy "public_read_product_images" on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
create policy "public_read_variants" on public.product_variants for select to anon, authenticated
  using (is_active and exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
create policy "public_read_bundle_items" on public.bundle_items for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = bundle_product_id and p.status = 'active'));
create policy "public_read_shipping_methods" on public.shipping_methods for select to anon, authenticated
  using (is_active);
create policy "public_read_volume_discounts" on public.volume_discounts for select to anon, authenticated
  using (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy "public_read_articles" on public.articles for select to anon, authenticated
  using (status = 'published' and published_at <= now());
-- discount_codes leses KUN av serveren (ingen offentlig policy -> koder kan ikke listes)

-- ---------------------------------------------------------------------
-- Egne data for innloggede kunder
-- ---------------------------------------------------------------------
create policy "own_profile_select" on public.profiles for select to authenticated
  using (id = auth.uid());
create policy "own_profile_update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "own_addresses" on public.addresses for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own_favorites" on public.favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own_company_select" on public.companies for select to authenticated
  using (id = public.my_company_id());

create policy "own_price_group_select" on public.price_groups for select to authenticated
  using (id = public.my_price_group_id());
create policy "own_price_group_prices" on public.price_group_prices for select to authenticated
  using (price_group_id = public.my_price_group_id());

create policy "own_orders_select" on public.orders for select to authenticated
  using (user_id = auth.uid());
create policy "own_order_items_select" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "own_order_events_select" on public.order_events for select to authenticated
  using (visible_to_customer and exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "own_shipments_select" on public.shipments for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

create policy "own_returns_select" on public.returns for select to authenticated
  using (user_id = auth.uid());
create policy "own_returns_insert" on public.returns for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'requested'
    and refund_amount_ore is null
    and restock = false
    and admin_note is null
    and exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

create policy "own_credit_applications_select" on public.credit_applications for select to authenticated
  using (user_id = auth.uid());

create policy "own_credit_account_select" on public.credit_accounts for select to authenticated
  using (company_id = public.my_company_id());

create policy "own_invoices_select" on public.invoices for select to authenticated
  using (user_id = auth.uid() or (company_id is not null and company_id = public.my_company_id()));
create policy "own_invoice_payments_select" on public.invoice_payments for select to authenticated
  using (exists (
    select 1 from public.invoices i
    where i.id = invoice_id
      and (i.user_id = auth.uid() or (i.company_id is not null and i.company_id = public.my_company_id()))
  ));

create policy "own_abandoned_cart" on public.abandoned_carts for select to authenticated
  using (user_id = auth.uid());

-- Visningene arver RLS via security_invoker
grant select on public.credit_account_overview to authenticated;
grant select on public.variant_profitability to authenticated;
revoke select on public.variant_profitability from anon;
revoke select on public.credit_account_overview from anon;
