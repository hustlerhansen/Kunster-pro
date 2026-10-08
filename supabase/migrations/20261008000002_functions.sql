-- =====================================================================
-- Kunstner Pro – funksjoner, triggere og forretningslogikk i databasen
-- =====================================================================

-- ---------------------------------------------------------------------
-- Roller og tilgang
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and not is_blocked
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','staff') and not is_blocked
  );
$$;

create or replace function public.my_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

create or replace function public.my_price_group_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.price_group_id
  from public.profiles p
  join public.companies c on c.id = p.company_id
  where p.id = auth.uid() and c.status = 'active';
$$;

-- Ny bruker i Supabase Auth -> profil
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, marketing_consent, marketing_consent_at)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    coalesce((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false),
    case when coalesce((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false) then now() end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Kunder kan ikke endre egen rolle, bedriftstilknytning eller sperrestatus
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- service_role (server) og administratorer kan endre alt
  if coalesce(auth.role(), '') = 'service_role' or public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role
     or new.company_id is distinct from old.company_id
     or new.customer_type is distinct from old.customer_type
     or new.is_blocked is distinct from old.is_blocked
     or new.anonymized_at is distinct from old.anonymized_at
     or new.id is distinct from old.id then
    raise exception 'Ikke tillatt å endre beskyttede profilfelt' using errcode = '42501';
  end if;
  if new.marketing_consent and not old.marketing_consent then
    new.marketing_consent_at = now();
  end if;
  return new;
end;
$$;

create trigger profiles_protect_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ---------------------------------------------------------------------
-- Prishistorikk og førpris (prisopplysningsforskriften: laveste pris siste 30 dager)
-- ---------------------------------------------------------------------
create or replace function public.record_price_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.price_ore is distinct from old.price_ore then
    insert into public.price_history (variant_id, price_ore) values (new.id, new.price_ore);
  end if;
  return new;
end;
$$;

create trigger product_variants_price_history
  after insert or update of price_ore on public.product_variants
  for each row execute function public.record_price_history();

-- Returnerer laveste pris de siste 30 dagene FØR gjeldende pris ble satt.
-- Brukes som eneste lovlige "førpris". NULL når det ikke er noen reell prisreduksjon.
create or replace function public.reference_price_ore(p_variant_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  with current_price as (
    select price_ore, valid_from
    from public.price_history
    where variant_id = p_variant_id
    order by valid_from desc, id desc
    limit 1
  ),
  prior as (
    -- Prisen som gjaldt ved starten av vinduet og alle priser satt i vinduet
    select ph.price_ore
    from public.price_history ph, current_price cp
    where ph.variant_id = p_variant_id
      and ph.valid_from < cp.valid_from
      and ph.valid_from >= cp.valid_from - interval '30 days'
    union all
    select * from (
      select ph.price_ore
      from public.price_history ph, current_price cp
      where ph.variant_id = p_variant_id
        and ph.valid_from < cp.valid_from - interval '30 days'
      order by ph.valid_from desc, ph.id desc
      limit 1
    ) s
  )
  select case
    when (select min(price_ore) from prior) > (select price_ore from current_price)
      then (select min(price_ore) from prior)
    else null
  end;
$$;

-- Leverandørpris-historikk
create or replace function public.record_supplier_price_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT'
     or new.purchase_price is distinct from old.purchase_price
     or new.currency is distinct from old.currency then
    insert into public.supplier_price_history (supplier_product_id, purchase_price, currency)
    values (new.id, new.purchase_price, new.currency);
  end if;
  return new;
end;
$$;

create trigger supplier_products_price_history
  after insert or update on public.supplier_products
  for each row execute function public.record_supplier_price_history();

-- ---------------------------------------------------------------------
-- Søk
-- ---------------------------------------------------------------------
create or replace function public.search_products(q text, max_results integer default 40)
returns setof public.products
language sql
stable
set search_path = public
as $$
  select p.*
  from public.products p
  where p.status = 'active'
    and (
      p.search_vector @@ websearch_to_tsquery('norwegian', q)
      or p.name ilike '%' || q || '%'
      or p.subtitle ilike '%' || q || '%'
      or exists (
        select 1 from public.product_variants v
        where v.product_id = p.id and (v.sku ilike q || '%' or v.name ilike '%' || q || '%')
      )
    )
  order by ts_rank(p.search_vector, websearch_to_tsquery('norwegian', q)) desc, p.name
  limit least(greatest(max_results, 1), 100);
$$;

-- ---------------------------------------------------------------------
-- Rate limiting (fast vindu). Kalles kun fra server med service_role.
-- ---------------------------------------------------------------------
create or replace function public.check_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.rate_limits as rl (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
    set count = case
          when rl.window_start < now() - make_interval(secs => p_window_seconds) then 1
          else rl.count + 1
        end,
        window_start = case
          when rl.window_start < now() - make_interval(secs => p_window_seconds) then now()
          else rl.window_start
        end
  returning count into v_count;
  return v_count <= p_max;
end;
$$;

-- ---------------------------------------------------------------------
-- ORDRE: opprettelse med atomisk lagerreservasjon
-- Låser variantradene (FOR UPDATE) i fast rekkefølge -> ingen oversalg
-- ved samtidige ordre og ingen vranglås.
-- ---------------------------------------------------------------------
create or replace function public.create_order(payload jsonb)
returns table (order_id uuid, order_number bigint)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_order_id uuid;
  v_order_number bigint;
  v_item jsonb;
  v_variant record;
  v_expected_price integer;
  v_price_group uuid;
  v_group_discount numeric;
  v_subtotal integer := 0;
  v_qty integer;
  v_line_total integer;
  v_line_discount integer;
  v_item_id uuid;
  v_cost record;
begin
  if jsonb_array_length(coalesce(payload -> 'items', '[]'::jsonb)) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  -- Prisgruppe for bedriftskunde
  if payload ->> 'company_id' is not null then
    select pg.id, coalesce(pg.discount_percent, 0)
      into v_price_group, v_group_discount
    from public.companies c
    left join public.price_groups pg on pg.id = c.price_group_id and pg.is_active
    where c.id = (payload ->> 'company_id')::uuid and c.status = 'active';
  end if;
  v_group_discount := coalesce(v_group_discount, 0);

  insert into public.orders (
    user_id, company_id, email, phone, customer_name, status, payment_status, payment_method,
    payment_provider, subtotal_ore, discount_ore, shipping_ore, total_ore, vat_ore, discount_code,
    shipping_method_code, shipping_method_name, shipping_address, billing_address, customer_note,
    purchase_reference, marketing_consent, terms_accepted_at, reservation_expires_at
  ) values (
    nullif(payload ->> 'user_id', '')::uuid,
    nullif(payload ->> 'company_id', '')::uuid,
    payload ->> 'email',
    payload ->> 'phone',
    payload ->> 'customer_name',
    'pending_payment',
    'pending',
    payload ->> 'payment_method',
    payload ->> 'payment_provider',
    (payload ->> 'subtotal_ore')::integer,
    (payload ->> 'discount_ore')::integer,
    (payload ->> 'shipping_ore')::integer,
    (payload ->> 'total_ore')::integer,
    (payload ->> 'vat_ore')::integer,
    nullif(payload ->> 'discount_code', ''),
    payload ->> 'shipping_method_code',
    payload ->> 'shipping_method_name',
    payload -> 'shipping_address',
    payload -> 'billing_address',
    nullif(payload ->> 'customer_note', ''),
    nullif(payload ->> 'purchase_reference', ''),
    coalesce((payload ->> 'marketing_consent')::boolean, false),
    now(),
    now() + make_interval(mins => coalesce((payload ->> 'reservation_minutes')::integer, 35))
  )
  returning id, orders.order_number into v_order_id, v_order_number;

  for v_item in
    select value from jsonb_array_elements(payload -> 'items')
    order by (value ->> 'variant_id')
  loop
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 999 then
      raise exception 'INVALID_QUANTITY';
    end if;

    select v.*, p.name as product_name, p.status as product_status, p.id as pid
      into v_variant
    from public.product_variants v
    join public.products p on p.id = v.product_id
    where v.id = (v_item ->> 'variant_id')::uuid
    for update of v;

    if not found or not v_variant.is_active or v_variant.product_status <> 'active' then
      raise exception 'VARIANT_UNAVAILABLE:%', v_item ->> 'variant_id';
    end if;

    if v_variant.stock_on_hand - v_variant.stock_reserved < v_qty then
      raise exception 'INSUFFICIENT_STOCK:%', v_variant.sku;
    end if;

    -- Serveren skal alltid sende gjeldende pris; avvik avvises
    v_expected_price := null;
    if v_price_group is not null then
      select price_ore into v_expected_price
      from public.price_group_prices
      where price_group_id = v_price_group and variant_id = v_variant.id;
    end if;
    if v_expected_price is null then
      v_expected_price := round(v_variant.price_ore * (100 - v_group_discount) / 100.0)::integer;
    end if;
    if (v_item ->> 'unit_price_ore')::integer <> v_expected_price then
      raise exception 'PRICE_MISMATCH:%', v_variant.sku;
    end if;

    v_line_discount := coalesce((v_item ->> 'discount_ore')::integer, 0);
    v_line_total := v_expected_price * v_qty - v_line_discount;
    if v_line_total < 0 then
      raise exception 'INVALID_DISCOUNT';
    end if;
    v_subtotal := v_subtotal + v_line_total;

    update public.product_variants
      set stock_reserved = stock_reserved + v_qty
    where id = v_variant.id;

    insert into public.order_items (
      order_id, product_id, variant_id, product_name, variant_name, sku, quantity,
      unit_price_ore, discount_ore, vat_rate, line_total_ore
    ) values (
      v_order_id, v_variant.pid, v_variant.id, v_variant.product_name, v_variant.name, v_variant.sku,
      v_qty, v_expected_price, v_line_discount, v_variant.vat_rate, v_line_total
    )
    returning id into v_item_id;

    select landed_cost_ore, packaging_per_unit_ore, payment_fee_percent
      into v_cost
    from public.variant_costs where variant_id = v_variant.id;

    insert into public.order_item_costs (order_item_id, unit_cost_ore, unit_variable_cost_ore)
    values (
      v_item_id,
      coalesce(v_cost.landed_cost_ore, 0),
      coalesce(v_cost.packaging_per_unit_ore, 0)
        + round(v_expected_price * coalesce(v_cost.payment_fee_percent, 0) / 100.0)::integer
    );
  end loop;

  -- Kontroll av totaler beregnet på serveren
  if v_subtotal <> (payload ->> 'subtotal_ore')::integer then
    raise exception 'SUBTOTAL_MISMATCH';
  end if;
  if (payload ->> 'total_ore')::integer <>
     v_subtotal - (payload ->> 'discount_ore')::integer + (payload ->> 'shipping_ore')::integer then
    raise exception 'TOTAL_MISMATCH';
  end if;

  insert into public.order_events (order_id, event_type, message)
  values (v_order_id, 'created', 'Ordre opprettet – venter på betaling');

  return query select v_order_id, v_order_number;
end;
$$;

-- ---------------------------------------------------------------------
-- Betaling bekreftet av betalingsleverandør (webhook) -> trekk fra lager
-- Idempotent: kan kalles flere ganger for samme ordre.
-- ---------------------------------------------------------------------
create or replace function public.confirm_order_payment(
  p_order_id uuid,
  p_provider text,
  p_reference text,
  p_payment_intent text,
  p_amount_ore integer
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_conflict boolean := false;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order.payment_status = 'paid' then
    return 'already_paid';
  end if;

  if p_amount_ore <> v_order.total_ore then
    insert into public.order_events (order_id, event_type, message, visible_to_customer)
    values (p_order_id, 'payment_amount_mismatch',
            format('Betalt beløp %s øre avviker fra ordretotal %s øre', p_amount_ore, v_order.total_ore), false);
    raise exception 'AMOUNT_MISMATCH';
  end if;

  if not v_order.stock_committed then
    for v_item in
      select oi.variant_id, oi.quantity, oi.sku
      from public.order_items oi
      where oi.order_id = p_order_id and oi.variant_id is not null
      order by oi.variant_id
    loop
      perform 1 from public.product_variants where id = v_item.variant_id for update;
      if not v_order.stock_released then
        update public.product_variants
          set stock_reserved = stock_reserved - v_item.quantity,
              stock_on_hand = stock_on_hand - v_item.quantity
        where id = v_item.variant_id;
      else
        -- Reservasjonen var utløpt. Trekk kun hvis varen fortsatt er tilgjengelig.
        update public.product_variants
          set stock_on_hand = stock_on_hand - v_item.quantity
        where id = v_item.variant_id
          and stock_on_hand - stock_reserved >= v_item.quantity;
        if not found then
          v_conflict := true;
          insert into public.order_events (order_id, event_type, message, visible_to_customer)
          values (p_order_id, 'stock_conflict',
                  format('Lagerkonflikt for %s – betalt etter utløpt reservasjon. Krever manuell oppfølging.', v_item.sku), false);
          continue;
        end if;
      end if;
      insert into public.inventory_movements (variant_id, quantity_change, reason, reference_type, reference_id)
      values (v_item.variant_id, -v_item.quantity, 'sale', 'order', p_order_id::text);
    end loop;
  end if;

  update public.orders
    set status = case when status in ('pending_payment','cancelled') then 'paid' else status end,
        payment_status = 'paid',
        payment_provider = p_provider,
        payment_reference = coalesce(p_reference, payment_reference),
        payment_intent_id = coalesce(p_payment_intent, payment_intent_id),
        paid_at = now(),
        cancelled_at = null,
        stock_committed = true,
        reservation_expires_at = null
  where id = p_order_id;

  if v_order.discount_code is not null then
    update public.discount_codes set uses_count = uses_count + 1 where code = v_order.discount_code;
  end if;

  if v_order.user_id is not null then
    update public.abandoned_carts set recovered_at = now(), items = '[]'::jsonb
    where user_id = v_order.user_id;
  end if;

  insert into public.order_events (order_id, event_type, message)
  values (p_order_id, 'paid', 'Betaling bekreftet av ' || p_provider);

  return case when v_conflict then 'paid_with_stock_conflict' else 'paid' end;
end;
$$;

-- Frigjør reservert lager (betaling avbrutt/utløpt/kansellert før betaling)
create or replace function public.release_order_stock(p_order_id uuid, p_reason text default 'Betaling ikke fullført')
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.stock_committed or v_order.stock_released then
    return false;
  end if;

  for v_item in
    select variant_id, quantity from public.order_items
    where order_id = p_order_id and variant_id is not null
    order by variant_id
  loop
    update public.product_variants
      set stock_reserved = greatest(stock_reserved - v_item.quantity, 0)
    where id = v_item.variant_id;
  end loop;

  update public.orders
    set stock_released = true,
        status = 'cancelled',
        payment_status = case when payment_status in ('pending','unpaid') then 'failed' else payment_status end,
        cancelled_at = now(),
        reservation_expires_at = null
  where id = p_order_id;

  insert into public.order_events (order_id, event_type, message)
  values (p_order_id, 'cancelled', p_reason);
  return true;
end;
$$;

create or replace function public.expire_pending_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_count integer := 0;
begin
  for v_id in
    select id from public.orders
    where status = 'pending_payment'
      and payment_status in ('pending','unpaid')
      and reservation_expires_at is not null
      and reservation_expires_at < now()
  loop
    if public.release_order_stock(v_id, 'Reservasjon utløpt – betaling ble ikke fullført') then
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------
-- Fakturakjøp for godkjent bedriftskunde (handlekonto)
-- Låser kredittkontoen for å hindre at samtidige ordre overskrider kredittrammen.
-- ---------------------------------------------------------------------
create or replace function public.place_invoice_order(p_order_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_account public.credit_accounts%rowtype;
  v_outstanding integer;
  v_invoice_id uuid;
  v_item record;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.payment_method <> 'invoice' or v_order.company_id is null then
    raise exception 'INVALID_INVOICE_ORDER';
  end if;
  if v_order.payment_status <> 'pending' then
    raise exception 'ORDER_NOT_PENDING';
  end if;

  select * into v_account from public.credit_accounts
  where company_id = v_order.company_id for update;
  if not found or v_account.status <> 'active' then
    raise exception 'CREDIT_NOT_ACTIVE';
  end if;

  select coalesce(sum(i.amount_ore - coalesce((select sum(ip.amount_ore) from public.invoice_payments ip where ip.invoice_id = i.id), 0)), 0)
    into v_outstanding
  from public.invoices i
  where i.company_id = v_order.company_id and i.status in ('open','overdue');

  if v_outstanding + v_order.total_ore > v_account.credit_limit_ore then
    raise exception 'CREDIT_LIMIT_EXCEEDED';
  end if;

  for v_item in
    select variant_id, quantity from public.order_items
    where order_id = p_order_id and variant_id is not null order by variant_id
  loop
    update public.product_variants
      set stock_reserved = stock_reserved - v_item.quantity,
          stock_on_hand = stock_on_hand - v_item.quantity
    where id = v_item.variant_id;
    insert into public.inventory_movements (variant_id, quantity_change, reason, reference_type, reference_id)
    values (v_item.variant_id, -v_item.quantity, 'sale', 'order', p_order_id::text);
  end loop;

  insert into public.invoices (order_id, company_id, user_id, amount_ore, vat_ore, due_at)
  values (v_order.id, v_order.company_id, v_order.user_id, v_order.total_ore, v_order.vat_ore,
          now() + make_interval(days => v_account.payment_terms_days))
  returning id into v_invoice_id;

  update public.orders
    set status = 'processing', payment_status = 'invoiced', payment_provider = 'internal',
        stock_committed = true, reservation_expires_at = null
  where id = p_order_id;

  if v_order.discount_code is not null then
    update public.discount_codes set uses_count = uses_count + 1 where code = v_order.discount_code;
  end if;

  insert into public.order_events (order_id, event_type, message)
  values (p_order_id, 'invoiced', 'Ordre bekreftet på faktura (handlekonto)');
  return v_invoice_id;
end;
$$;

create or replace function public.register_invoice_payment(p_invoice_id uuid, p_amount_ore integer, p_reference text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice public.invoices%rowtype;
  v_paid integer;
begin
  if not public.is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  select * into v_invoice from public.invoices where id = p_invoice_id for update;
  if not found then raise exception 'INVOICE_NOT_FOUND'; end if;

  insert into public.invoice_payments (invoice_id, amount_ore, reference, created_by)
  values (p_invoice_id, p_amount_ore, p_reference, auth.uid());

  select coalesce(sum(amount_ore), 0) into v_paid from public.invoice_payments where invoice_id = p_invoice_id;
  if v_paid >= v_invoice.amount_ore then
    update public.invoices set status = 'paid', paid_at = now() where id = p_invoice_id;
    if v_invoice.order_id is not null then
      update public.orders set payment_status = 'paid', paid_at = now() where id = v_invoice.order_id;
    end if;
    return 'paid';
  end if;
  return 'partial';
end;
$$;

create or replace function public.mark_overdue_invoices()
returns integer
language sql
security definer
set search_path = public
as $$
  with updated as (
    update public.invoices set status = 'overdue'
    where status = 'open' and due_at < now()
    returning 1
  )
  select count(*)::integer from updated;
$$;

-- ---------------------------------------------------------------------
-- Lager: manuell justering og varemottak
-- ---------------------------------------------------------------------
create or replace function public.adjust_stock(p_variant_id uuid, p_change integer, p_reason text, p_note text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new integer;
begin
  if not public.is_staff() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_reason not in ('adjustment','count','damage','initial','return') then
    raise exception 'INVALID_REASON';
  end if;
  update public.product_variants
    set stock_on_hand = stock_on_hand + p_change
  where id = p_variant_id
  returning stock_on_hand into v_new;
  if not found then raise exception 'VARIANT_NOT_FOUND'; end if;

  insert into public.inventory_movements (variant_id, quantity_change, reason, note, created_by)
  values (p_variant_id, p_change, p_reason, p_note, auth.uid());
  return v_new;
end;
$$;

-- Varemottak. Fordeler frakt/toll/andre kostnader proporsjonalt på linjeverdi
-- og oppdaterer kostprofil (siste innkjøpskost) og beholdning.
create or replace function public.receive_purchase_order(p_po_id uuid, p_receipts jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_po public.purchase_orders%rowtype;
  v_total_value numeric;
  v_extra_ore numeric;
  v_rec jsonb;
  v_item public.purchase_order_items%rowtype;
  v_qty integer;
  v_line_share numeric;
  v_alloc_per_unit numeric;
  v_freight_ratio numeric;
  v_duty_ratio numeric;
  v_received_total integer := 0;
begin
  if not public.is_staff() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  select * into v_po from public.purchase_orders where id = p_po_id for update;
  if not found then raise exception 'PO_NOT_FOUND'; end if;
  if v_po.status in ('received','cancelled','draft') then
    raise exception 'PO_NOT_RECEIVABLE';
  end if;

  select coalesce(sum(quantity * unit_price), 0) into v_total_value
  from public.purchase_order_items where purchase_order_id = p_po_id;
  v_extra_ore := v_po.freight_cost_ore + v_po.duty_cost_ore + v_po.other_cost_ore;

  for v_rec in select value from jsonb_array_elements(p_receipts)
  loop
    v_qty := (v_rec ->> 'quantity')::integer;
    if v_qty is null or v_qty <= 0 then continue; end if;

    select * into v_item from public.purchase_order_items
    where id = (v_rec ->> 'item_id')::uuid and purchase_order_id = p_po_id for update;
    if not found then raise exception 'PO_ITEM_NOT_FOUND'; end if;
    if v_item.received_quantity + v_qty > v_item.quantity then
      raise exception 'RECEIVE_EXCEEDS_ORDERED';
    end if;

    update public.purchase_order_items
      set received_quantity = received_quantity + v_qty
    where id = v_item.id;

    update public.product_variants
      set stock_on_hand = stock_on_hand + v_qty
    where id = v_item.variant_id;

    insert into public.inventory_movements (variant_id, quantity_change, reason, reference_type, reference_id, created_by)
    values (v_item.variant_id, v_qty, 'purchase', 'purchase_order', p_po_id::text, auth.uid());

    -- Fordelte kostnader per enhet (proporsjonalt med linjeverdi)
    if v_total_value > 0 then
      v_line_share := (v_item.quantity * v_item.unit_price) / v_total_value;
    else
      v_line_share := 0;
    end if;
    v_alloc_per_unit := (v_extra_ore * v_line_share) / v_item.quantity;
    if v_extra_ore > 0 then
      v_freight_ratio := v_po.freight_cost_ore / v_extra_ore;
      v_duty_ratio := v_po.duty_cost_ore / v_extra_ore;
    else
      v_freight_ratio := 0;
      v_duty_ratio := 0;
    end if;

    insert into public.variant_costs (
      variant_id, supplier_id, purchase_price, currency, exchange_rate,
      freight_per_unit_ore, duty_per_unit_ore, other_per_unit_ore, is_demo
    ) values (
      v_item.variant_id, v_po.supplier_id, v_item.unit_price, v_po.currency, v_po.exchange_rate,
      round(v_alloc_per_unit * v_freight_ratio)::integer,
      round(v_alloc_per_unit * v_duty_ratio)::integer,
      round(v_alloc_per_unit * (1 - v_freight_ratio - v_duty_ratio))::integer,
      false
    )
    on conflict (variant_id) do update set
      supplier_id = excluded.supplier_id,
      purchase_price = excluded.purchase_price,
      currency = excluded.currency,
      exchange_rate = excluded.exchange_rate,
      freight_per_unit_ore = excluded.freight_per_unit_ore,
      duty_per_unit_ore = excluded.duty_per_unit_ore,
      other_per_unit_ore = excluded.other_per_unit_ore,
      is_demo = false,
      updated_at = now();

    insert into public.supplier_products (supplier_id, variant_id, purchase_price, currency)
    values (v_po.supplier_id, v_item.variant_id, v_item.unit_price, v_po.currency)
    on conflict (supplier_id, variant_id) do update
      set purchase_price = excluded.purchase_price, currency = excluded.currency, updated_at = now();

    v_received_total := v_received_total + v_qty;
  end loop;

  if not exists (
    select 1 from public.purchase_order_items
    where purchase_order_id = p_po_id and received_quantity < quantity
  ) then
    update public.purchase_orders set status = 'received', received_at = now() where id = p_po_id;
  end if;

  return v_received_total;
end;
$$;

-- Returer: legg varer tilbake på lager
create or replace function public.restock_return(p_return_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ret public.returns%rowtype;
  v_entry jsonb;
  v_item public.order_items%rowtype;
  v_qty integer;
  v_total integer := 0;
begin
  if not public.is_staff() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  select * into v_ret from public.returns where id = p_return_id for update;
  if not found then raise exception 'RETURN_NOT_FOUND'; end if;
  if v_ret.restock then return 0; end if;

  for v_entry in select value from jsonb_array_elements(v_ret.items)
  loop
    select * into v_item from public.order_items
    where id = (v_entry ->> 'order_item_id')::uuid and order_id = v_ret.order_id;
    if not found or v_item.variant_id is null then continue; end if;
    v_qty := least(coalesce((v_entry ->> 'quantity')::integer, 0), v_item.quantity);
    if v_qty <= 0 then continue; end if;
    update public.product_variants set stock_on_hand = stock_on_hand + v_qty where id = v_item.variant_id;
    insert into public.inventory_movements (variant_id, quantity_change, reason, reference_type, reference_id, created_by)
    values (v_item.variant_id, v_qty, 'return', 'return', p_return_id::text, auth.uid());
    v_total := v_total + v_qty;
  end loop;

  update public.returns set restock = true where id = p_return_id;
  return v_total;
end;
$$;

-- ---------------------------------------------------------------------
-- Rapporter (kun ansatte)
-- ---------------------------------------------------------------------

-- Kredittoversikt per bedrift (security_invoker -> RLS gjelder)
create view public.credit_account_overview
with (security_invoker = true) as
select
  ca.id,
  ca.company_id,
  c.name as company_name,
  c.org_number,
  ca.status,
  ca.credit_limit_ore,
  ca.payment_terms_days,
  coalesce(o.outstanding_ore, 0)::integer as outstanding_ore,
  greatest(ca.credit_limit_ore - coalesce(o.outstanding_ore, 0), 0)::integer as available_ore,
  coalesce(o.overdue_ore, 0)::integer as overdue_ore
from public.credit_accounts ca
join public.companies c on c.id = ca.company_id
left join lateral (
  select
    sum(i.amount_ore - coalesce(p.paid, 0)) filter (where i.status in ('open','overdue')) as outstanding_ore,
    sum(i.amount_ore - coalesce(p.paid, 0)) filter (where i.status = 'overdue') as overdue_ore
  from public.invoices i
  left join lateral (select sum(amount_ore) as paid from public.invoice_payments ip where ip.invoice_id = i.id) p on true
  where i.company_id = ca.company_id
) o on true;

-- Lønnsomhet per variant basert på gjeldende pris og kostprofil
create view public.variant_profitability
with (security_invoker = true) as
select
  v.id as variant_id,
  v.sku,
  v.name as variant_name,
  p.id as product_id,
  p.name as product_name,
  p.is_demo,
  v.price_ore,
  v.vat_rate,
  round(v.price_ore / (1 + v.vat_rate / 100.0))::integer as price_ex_vat_ore,
  vc.landed_cost_ore,
  (coalesce(vc.packaging_per_unit_ore, 0)
    + round(round(v.price_ore / (1 + v.vat_rate / 100.0)) * coalesce(vc.payment_fee_percent, 0) / 100.0))::integer
    as variable_cost_ore,
  v.stock_on_hand,
  (v.stock_on_hand * coalesce(vc.landed_cost_ore, 0))::bigint as stock_value_ore
from public.product_variants v
join public.products p on p.id = v.product_id
left join public.variant_costs vc on vc.variant_id = v.id;

-- Solgt lønnsomhet per produkt i periode
create or replace function public.profitability_report(p_from timestamptz, p_to timestamptz)
returns table (
  product_id uuid,
  product_name text,
  units_sold bigint,
  revenue_ex_vat_ore bigint,
  cogs_ore bigint,
  gross_profit_ore bigint,
  variable_costs_ore bigint,
  contribution_ore bigint,
  contribution_ratio numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_staff() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return query
  with lines as (
    select
      oi.product_id,
      oi.product_name,
      oi.quantity,
      round(oi.line_total_ore / (1 + oi.vat_rate / 100.0))::bigint as revenue_ex,
      (coalesce(c.unit_cost_ore, 0) * oi.quantity)::bigint as cogs,
      (coalesce(c.unit_variable_cost_ore, 0) * oi.quantity)::bigint as var_costs
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    left join public.order_item_costs c on c.order_item_id = oi.id
    where o.payment_status in ('paid','invoiced')
      and o.status not in ('cancelled','refunded')
      and o.created_at >= p_from and o.created_at < p_to
  )
  select
    l.product_id,
    max(l.product_name),
    sum(l.quantity)::bigint,
    sum(l.revenue_ex)::bigint,
    sum(l.cogs)::bigint,
    (sum(l.revenue_ex) - sum(l.cogs))::bigint,
    (sum(l.cogs) + sum(l.var_costs))::bigint,
    (sum(l.revenue_ex) - sum(l.cogs) - sum(l.var_costs))::bigint,
    case when sum(l.revenue_ex) > 0
      then round((sum(l.revenue_ex) - sum(l.cogs) - sum(l.var_costs))::numeric / sum(l.revenue_ex), 4)
      else null end
  from lines l
  group by l.product_id
  order by 8 desc;
end;
$$;

-- Innkjøpsforslag basert på salgshistorikk, leveringstid og minimumsbeholdning
create or replace function public.reorder_suggestions(p_history_days integer default 90, p_safety_days integer default 14)
returns table (
  variant_id uuid,
  sku text,
  product_name text,
  variant_name text,
  stock_available integer,
  min_stock integer,
  incoming integer,
  avg_daily_sales numeric,
  lead_time_days integer,
  supplier_id uuid,
  supplier_name text,
  suggested_quantity integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_staff() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return query
  with sales as (
    select m.variant_id, sum(-m.quantity_change)::numeric / greatest(p_history_days, 1) as per_day
    from public.inventory_movements m
    where m.reason = 'sale' and m.created_at >= now() - make_interval(days => p_history_days)
    group by m.variant_id
  ),
  inbound as (
    select poi.variant_id, sum(poi.quantity - poi.received_quantity)::integer as qty
    from public.purchase_order_items poi
    join public.purchase_orders po on po.id = poi.purchase_order_id
    where po.status in ('sent','confirmed','shipped')
    group by poi.variant_id
  ),
  preferred as (
    select distinct on (sp.variant_id) sp.variant_id, sp.supplier_id, sp.min_order_quantity, s.name, s.lead_time_days
    from public.supplier_products sp
    join public.suppliers s on s.id = sp.supplier_id
    order by sp.variant_id, sp.is_preferred desc, sp.updated_at desc
  ),
  calc as (
    select
      v.id, v.sku, p.name as pname, v.name as vname, v.stock_available as avail, v.min_stock as minst,
      coalesce(i.qty, 0) as inc,
      round(coalesce(s.per_day, 0), 3) as per_day,
      coalesce(pr.lead_time_days, 14) as lead,
      pr.supplier_id as sup_id, pr.name as sup_name,
      coalesce(pr.min_order_quantity, 1) as moq,
      v.reorder_quantity
    from public.product_variants v
    join public.products p on p.id = v.product_id and p.status <> 'archived'
    left join sales s on s.variant_id = v.id
    left join inbound i on i.variant_id = v.id
    left join preferred pr on pr.variant_id = v.id
    where v.is_active
  )
  select
    c.id, c.sku, c.pname, c.vname, c.avail, c.minst, c.inc, c.per_day, c.lead, c.sup_id, c.sup_name,
    greatest(
      case
        when ceil(c.per_day * (c.lead + p_safety_days)) + c.minst - c.avail - c.inc > 0
          then greatest(ceil(c.per_day * (c.lead + p_safety_days)) + c.minst - c.avail - c.inc,
                        coalesce(c.reorder_quantity, 0), c.moq)
        else 0
      end, 0)::integer
  from calc c
  where c.avail + c.inc <= c.minst
     or ceil(c.per_day * (c.lead + p_safety_days)) + c.minst - c.avail - c.inc > 0
  order by (c.avail - c.minst) asc;
end;
$$;

-- Dashbord-nøkkeltall
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_today timestamptz := date_trunc('day', now() at time zone 'Europe/Oslo') at time zone 'Europe/Oslo';
  v_month timestamptz := date_trunc('month', now() at time zone 'Europe/Oslo') at time zone 'Europe/Oslo';
  v_result jsonb;
begin
  if not public.is_staff() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  with valid_orders as (
    select * from public.orders
    where payment_status in ('paid','invoiced') and status not in ('cancelled','refunded')
  ),
  month_lines as (
    select
      round(oi.line_total_ore / (1 + oi.vat_rate / 100.0)) as revenue_ex,
      coalesce(c.unit_cost_ore, 0) * oi.quantity as cogs
    from public.order_items oi
    join valid_orders o on o.id = oi.order_id
    left join public.order_item_costs c on c.order_item_id = oi.id
    where o.created_at >= v_month
  )
  select jsonb_build_object(
    'revenue_today_ore', (select coalesce(sum(total_ore), 0) from valid_orders where created_at >= v_today),
    'revenue_month_ore', (select coalesce(sum(total_ore), 0) from valid_orders where created_at >= v_month),
    'orders_today', (select count(*) from valid_orders where created_at >= v_today),
    'orders_month', (select count(*) from valid_orders where created_at >= v_month),
    'avg_order_value_ore', (select coalesce(round(avg(total_ore)), 0) from valid_orders where created_at >= v_month),
    'revenue_month_ex_vat_ore', (select coalesce(sum(revenue_ex), 0) from month_lines),
    'gross_profit_month_ore', (select coalesce(sum(revenue_ex - cogs), 0) from month_lines),
    'pending_payment_orders', (select count(*) from public.orders where status = 'pending_payment'),
    'orders_to_ship', (select count(*) from public.orders where status in ('paid','processing')),
    'new_customers_month', (select count(*) from public.profiles where created_at >= v_month and role = 'customer'),
    'unpaid_invoices_count', (select count(*) from public.invoices where status in ('open','overdue')),
    'unpaid_invoices_ore', (select coalesce(sum(amount_ore), 0) from public.invoices where status in ('open','overdue')),
    'overdue_invoices_count', (select count(*) from public.invoices where status = 'overdue'),
    'open_credit_applications', (select count(*) from public.credit_applications where status in ('submitted','under_review')),
    'open_returns', (select count(*) from public.returns where status in ('requested','approved','received')),
    'best_sellers', coalesce((
      select jsonb_agg(x) from (
        select oi.product_id, max(oi.product_name) as name, sum(oi.quantity) as units, sum(oi.line_total_ore) as revenue_ore
        from public.order_items oi
        join valid_orders o on o.id = oi.order_id
        where o.created_at >= now() - interval '30 days'
        group by oi.product_id
        order by units desc
        limit 5
      ) x), '[]'::jsonb),
    'low_stock', coalesce((
      select jsonb_agg(x) from (
        select v.id, v.sku, p.name as product_name, v.name as variant_name, v.stock_available, v.min_stock
        from public.product_variants v
        join public.products p on p.id = v.product_id
        where v.is_active and p.status = 'active' and v.stock_available <= v.min_stock
        order by v.stock_available asc
        limit 10
      ) x), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------
-- Rettigheter for funksjoner
-- Serverfunksjoner kan KUN kalles med service_role.
-- ---------------------------------------------------------------------
revoke all on function public.create_order(jsonb) from public, anon, authenticated;
revoke all on function public.confirm_order_payment(uuid, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.release_order_stock(uuid, text) from public, anon, authenticated;
revoke all on function public.expire_pending_orders() from public, anon, authenticated;
revoke all on function public.place_invoice_order(uuid) from public, anon, authenticated;
revoke all on function public.mark_overdue_invoices() from public, anon, authenticated;
revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;

-- Ansattfunksjoner sjekker is_staff()/is_admin() internt
revoke all on function public.adjust_stock(uuid, integer, text, text) from public, anon;
revoke all on function public.receive_purchase_order(uuid, jsonb) from public, anon;
revoke all on function public.restock_return(uuid) from public, anon;
revoke all on function public.register_invoice_payment(uuid, integer, text) from public, anon;
revoke all on function public.profitability_report(timestamptz, timestamptz) from public, anon;
revoke all on function public.reorder_suggestions(integer, integer) from public, anon;
revoke all on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.adjust_stock(uuid, integer, text, text) to authenticated;
grant execute on function public.receive_purchase_order(uuid, jsonb) to authenticated;
grant execute on function public.restock_return(uuid) to authenticated;
grant execute on function public.register_invoice_payment(uuid, integer, text) to authenticated;
grant execute on function public.profitability_report(timestamptz, timestamptz) to authenticated;
grant execute on function public.reorder_suggestions(integer, integer) to authenticated;
grant execute on function public.admin_dashboard_stats() to authenticated;

-- Trigger-funksjoner skal ikke kunne kalles direkte
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.record_price_history() from public, anon, authenticated;
revoke all on function public.record_supplier_price_history() from public, anon, authenticated;
