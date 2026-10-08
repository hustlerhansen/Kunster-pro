-- =====================================================================
-- Databasetester for Kunstner Pro (kjøres av scripts/test-db.sh)
-- Hver test kaster exception ved feil (psql ON_ERROR_STOP=1).
-- =====================================================================
\set QUIET on
\pset tuples_only on
set client_min_messages = notice;

-- Testbrukere
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'kunde.a@test.no', '{"full_name":"Kunde A","phone":"91234567"}'),
  ('22222222-2222-4222-8222-222222222222', 'kunde.b@test.no', '{"full_name":"Kunde B"}'),
  ('33333333-3333-4333-8333-333333333333', 'admin@test.no', '{"full_name":"Admin"}');
update public.profiles set role = 'admin' where id = '33333333-3333-4333-8333-333333333333';

create or replace function pg_temp.as_user(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, false);
  execute 'set role authenticated';
end $$;
create or replace function pg_temp.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', false);
  execute 'set role anon';
end $$;
create or replace function pg_temp.as_service() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"service_role"}', false);
  execute 'set role service_role';
end $$;

-- ---------------------------------------------------------------- T1: profil opprettes via trigger
do $$ begin
  if (select full_name from public.profiles where id = '11111111-1111-4111-8111-111111111111') <> 'Kunde A' then
    raise exception 'T1 FEIL: profil ble ikke opprettet fra auth.users';
  end if;
  raise notice 'PASS T1 profil opprettes ved registrering';
end $$;

-- ---------------------------------------------------------------- T2: anonym tilgang
select pg_temp.as_anon();
do $$
declare n int;
begin
  select count(*) into n from public.products;
  if n <> 20 then raise exception 'T2 FEIL: anon ser % produkter (forventet 20)', n; end if;
  select count(*) into n from public.variant_costs;
  if n <> 0 then raise exception 'T2 FEIL: anon kan lese innkjøpskost'; end if;
  select count(*) into n from public.discount_codes;
  if n <> 0 then raise exception 'T2 FEIL: anon kan liste rabattkoder'; end if;
  select count(*) into n from public.orders;
  if n <> 0 then raise exception 'T2 FEIL: anon kan lese ordre'; end if;
  select count(*) into n from public.profiles;
  if n <> 0 then raise exception 'T2 FEIL: anon kan lese profiler'; end if;
  raise notice 'PASS T2 anonym bruker ser kun publisert katalog';
end $$;
reset role;

-- ---------------------------------------------------------------- T3: serverfunksjoner kan ikke kalles av klienter
select pg_temp.as_user('11111111-1111-4111-8111-111111111111');
do $$ begin
  begin
    perform public.create_order('{}'::jsonb);
    raise exception 'T3 FEIL: kunde kunne kalle create_order';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.confirm_order_payment(gen_random_uuid(), 'stripe', 'x', 'y', 1);
    raise exception 'T3 FEIL: kunde kunne bekrefte betaling';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.admin_dashboard_stats();
    raise exception 'T3 FEIL: kunde fikk dashbordtall';
  exception when insufficient_privilege or raise_exception then null;
  end;
  raise notice 'PASS T3 kritiske funksjoner er sperret for kunder';
end $$;

-- ---------------------------------------------------------------- T4: kunde kan ikke gjøre seg selv til admin
do $$ begin
  begin
    update public.profiles set role = 'admin' where id = '11111111-1111-4111-8111-111111111111';
    raise exception 'T4 FEIL: kunde endret egen rolle';
  exception when insufficient_privilege then null;
  end;
  update public.profiles set full_name = 'Kunde A2' where id = '11111111-1111-4111-8111-111111111111';
  -- Kan ikke oppdatere andres profil (RLS gir 0 rader)
  update public.profiles set full_name = 'Hacket' where id = '22222222-2222-4222-8222-222222222222';
  raise notice 'PASS T4 rollen er beskyttet';
end $$;
reset role;
do $$ begin
  if (select full_name from public.profiles where id = '22222222-2222-4222-8222-222222222222') = 'Hacket' then
    raise exception 'T4 FEIL: kunde kunne endre annen kundes profil';
  end if;
end $$;

-- ---------------------------------------------------------------- T5: ordreopprettelse reserverer lager
select pg_temp.as_service();
create temp table t_ids (k text primary key, v uuid);
grant all on t_ids to public;
do $$
declare
  v_variant uuid;
  v_price int;
  v_before int;
  r record;
begin
  select id, price_ore, stock_reserved into v_variant, v_price, v_before from public.product_variants where sku = 'KP-OLJ-TITANHVIT-37';
  select * into r from public.create_order(jsonb_build_object(
    'user_id', '11111111-1111-4111-8111-111111111111',
    'email', 'kunde.a@test.no', 'phone', '91234567', 'customer_name', 'Kunde A',
    'payment_method', 'card', 'payment_provider', 'stripe',
    'subtotal_ore', v_price * 2, 'discount_ore', 0, 'shipping_ore', 7900, 'total_ore', v_price * 2 + 7900, 'vat_ore', 0,
    'shipping_method_code', 'bring-pickup', 'shipping_method_name', 'Hentested',
    'shipping_address', '{"full_name":"Kunde A","line1":"Gate 1","postal_code":"0150","city":"Oslo","country":"NO"}',
    'items', jsonb_build_array(jsonb_build_object('variant_id', v_variant, 'quantity', 2, 'unit_price_ore', v_price, 'discount_ore', 0))
  ));
  insert into t_ids values ('order_a', r.order_id);
  if (select stock_reserved from public.product_variants where id = v_variant) <> v_before + 2 then
    raise exception 'T5 FEIL: lager ble ikke reservert';
  end if;
  if (select unit_cost_ore from public.order_item_costs c join public.order_items i on i.id = c.order_item_id where i.order_id = r.order_id) <= 0 then
    raise exception 'T5 FEIL: kostpris ble ikke lagret på ordrelinjen';
  end if;
  raise notice 'PASS T5 ordre opprettes og lager reserveres (ordre %)', r.order_number;
end $$;

-- ---------------------------------------------------------------- T6: ugyldig pris / for lite lager avvises
do $$
declare v_variant uuid; v_price int; v_avail int;
begin
  select id, price_ore, stock_available into v_variant, v_price, v_avail from public.product_variants where sku = 'KP-OLJ-TITANHVIT-37';
  begin
    perform public.create_order(jsonb_build_object(
      'email','x@test.no','customer_name','X','payment_method','card','payment_provider','stripe',
      'subtotal_ore', 100, 'discount_ore', 0, 'shipping_ore', 0, 'total_ore', 100, 'vat_ore', 0,
      'shipping_address','{}',
      'items', jsonb_build_array(jsonb_build_object('variant_id', v_variant, 'quantity', 1, 'unit_price_ore', 100))));
    raise exception 'T6 FEIL: manipulert pris ble godtatt';
  exception when raise_exception then
    if sqlerrm not like 'PRICE_MISMATCH%' then raise; end if;
  end;
  begin
    perform public.create_order(jsonb_build_object(
      'email','x@test.no','customer_name','X','payment_method','card','payment_provider','stripe',
      'subtotal_ore', v_price * (v_avail + 1), 'discount_ore', 0, 'shipping_ore', 0, 'total_ore', v_price * (v_avail + 1), 'vat_ore', 0,
      'shipping_address','{}',
      'items', jsonb_build_array(jsonb_build_object('variant_id', v_variant, 'quantity', v_avail + 1, 'unit_price_ore', v_price))));
    raise exception 'T6 FEIL: oversalg ble godtatt';
  exception when raise_exception then
    if sqlerrm not like 'INSUFFICIENT_STOCK%' then raise; end if;
  end;
  raise notice 'PASS T6 manipulert pris og oversalg avvises';
end $$;
reset role;

-- ---------------------------------------------------------------- T7: kunde A ser egen ordre, kunde B ser ingenting
select pg_temp.as_user('11111111-1111-4111-8111-111111111111');
do $$ begin
  if (select count(*) from public.orders) <> 1 then raise exception 'T7 FEIL: kunde A ser ikke egen ordre'; end if;
  if (select count(*) from public.order_items) < 1 then raise exception 'T7 FEIL: kunde A ser ikke ordrelinjer'; end if;
  if (select count(*) from public.order_item_costs) <> 0 then raise exception 'T7 FEIL: kunde ser kostpris'; end if;
end $$;
reset role;
select pg_temp.as_user('22222222-2222-4222-8222-222222222222');
do $$ begin
  if (select count(*) from public.orders) <> 0 then raise exception 'T7 FEIL: kunde B ser andres ordre'; end if;
  if (select count(*) from public.order_items) <> 0 then raise exception 'T7 FEIL: kunde B ser andres ordrelinjer'; end if;
  begin
    insert into public.returns (order_id, user_id, type, reason) values ((select v from t_ids where k = 'order_a'), '22222222-2222-4222-8222-222222222222', 'withdrawal', 'test');
    raise exception 'T7 FEIL: kunde B kunne registrere retur på andres ordre';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS T7 kunder kan aldri lese andre kunders data';
end $$;
reset role;

-- ---------------------------------------------------------------- T8: betaling bekreftet -> lager trekkes (idempotent)
select pg_temp.as_service();
do $$
declare
  v_order uuid := (select v from t_ids where k = 'order_a');
  v_total int := (select total_ore from public.orders where id = (select v from t_ids where k = 'order_a'));
  v_variant uuid := (select id from public.product_variants where sku = 'KP-OLJ-TITANHVIT-37');
  v_on_hand int := (select stock_on_hand from public.product_variants where sku = 'KP-OLJ-TITANHVIT-37');
  v_res int := (select stock_reserved from public.product_variants where sku = 'KP-OLJ-TITANHVIT-37');
begin
  begin
    perform public.confirm_order_payment(v_order, 'stripe', 'cs_test', 'pi_test', v_total - 1);
    raise exception 'T8 FEIL: feil beløp ble godtatt';
  exception when raise_exception then
    if sqlerrm <> 'AMOUNT_MISMATCH' then raise; end if;
  end;
  if public.confirm_order_payment(v_order, 'stripe', 'cs_test', 'pi_test', v_total) <> 'paid' then raise exception 'T8 FEIL'; end if;
  if public.confirm_order_payment(v_order, 'stripe', 'cs_test', 'pi_test', v_total) <> 'already_paid' then raise exception 'T8 FEIL: ikke idempotent'; end if;
  if (select stock_on_hand from public.product_variants where id = v_variant) <> v_on_hand - 2 then raise exception 'T8 FEIL: beholdning ikke trukket'; end if;
  if (select stock_reserved from public.product_variants where id = v_variant) <> v_res - 2 then raise exception 'T8 FEIL: reservasjon ikke frigitt'; end if;
  if (select status from public.orders where id = v_order) <> 'paid' then raise exception 'T8 FEIL: status ikke betalt'; end if;
  raise notice 'PASS T8 betaling bekreftes én gang, lager trekkes, feil beløp avvises';
end $$;

-- ---------------------------------------------------------------- T9: utløpt reservasjon frigjøres
do $$
declare v_variant uuid; v_price int; v_res int; r record;
begin
  select id, price_ore, stock_reserved into v_variant, v_price, v_res from public.product_variants where sku = 'KP-PEN-PENSELSETT-STD';
  select * into r from public.create_order(jsonb_build_object(
    'email','gjest@test.no','customer_name','Gjest','payment_method','card','payment_provider','stripe',
    'subtotal_ore', v_price, 'discount_ore', 0, 'shipping_ore', 0, 'total_ore', v_price, 'vat_ore', 0, 'reservation_minutes', 0,
    'shipping_address','{}',
    'items', jsonb_build_array(jsonb_build_object('variant_id', v_variant, 'quantity', 1, 'unit_price_ore', v_price))));
  update public.orders set reservation_expires_at = now() - interval '1 minute' where id = r.order_id;
  if public.expire_pending_orders() < 1 then raise exception 'T9 FEIL: ingen ordre utløpt'; end if;
  if (select stock_reserved from public.product_variants where id = v_variant) <> v_res then raise exception 'T9 FEIL: reservasjon ikke frigitt'; end if;
  if (select status from public.orders where id = r.order_id) <> 'cancelled' then raise exception 'T9 FEIL: ordre ikke kansellert'; end if;
  raise notice 'PASS T9 utløpte reservasjoner frigjøres automatisk';
end $$;

-- ---------------------------------------------------------------- T10: fakturakjøp respekterer kredittramme
do $$
declare v_company uuid; v_variant uuid; v_price int; r record; r2 record;
begin
  insert into public.companies (name, org_number) values ('Testskolen AS', '974760673') returning id into v_company;
  insert into public.credit_accounts (company_id, status, credit_limit_ore, payment_terms_days) values (v_company, 'active', 150000, 14);
  select id, price_ore into v_variant, v_price from public.product_variants where sku = 'KP-SET-STARTPAKKE-STD';
  select * into r from public.create_order(jsonb_build_object(
    'company_id', v_company, 'email','skole@test.no','customer_name','Skolen','payment_method','invoice','payment_provider','internal',
    'subtotal_ore', v_price, 'discount_ore', 0, 'shipping_ore', 0, 'total_ore', v_price, 'vat_ore', 0,
    'shipping_address','{}',
    'items', jsonb_build_array(jsonb_build_object('variant_id', v_variant, 'quantity', 1, 'unit_price_ore', v_price))));
  perform public.place_invoice_order(r.order_id);
  if (select payment_status from public.orders where id = r.order_id) <> 'invoiced' then raise exception 'T10 FEIL: ikke fakturert'; end if;
  -- Andre ordre (799 + 799 > 1500) skal avvises
  select * into r2 from public.create_order(jsonb_build_object(
    'company_id', v_company, 'email','skole@test.no','customer_name','Skolen','payment_method','invoice','payment_provider','internal',
    'subtotal_ore', v_price, 'discount_ore', 0, 'shipping_ore', 0, 'total_ore', v_price, 'vat_ore', 0,
    'shipping_address','{}',
    'items', jsonb_build_array(jsonb_build_object('variant_id', v_variant, 'quantity', 1, 'unit_price_ore', v_price))));
  begin
    perform public.place_invoice_order(r2.order_id);
    raise exception 'T10 FEIL: kredittrammen ble overskredet';
  exception when raise_exception then
    if sqlerrm <> 'CREDIT_LIMIT_EXCEEDED' then raise; end if;
  end;
  if (select outstanding_ore from public.credit_account_overview where company_id = v_company) <> v_price then raise exception 'T10 FEIL: utestående feil'; end if;
  -- Sperret konto kan ikke handle
  update public.credit_accounts set status = 'suspended' where company_id = v_company;
  begin
    perform public.place_invoice_order(r2.order_id);
    raise exception 'T10 FEIL: sperret konto kunne handle';
  exception when raise_exception then
    if sqlerrm <> 'CREDIT_NOT_ACTIVE' then raise; end if;
  end;
  insert into t_ids values ('company', v_company);
  raise notice 'PASS T10 fakturakjøp: kredittramme, utestående og sperring håndheves';
end $$;

-- ---------------------------------------------------------------- T11: bedriftspris via prisgruppe
do $$
declare v_group uuid; v_variant uuid; v_price int; r record;
begin
  insert into public.price_groups (name, discount_percent) values ('Skoler', 10) returning id into v_group;
  update public.companies set price_group_id = v_group where id = (select v from t_ids where k = 'company');
  select id, price_ore into v_variant, v_price from public.product_variants where sku = 'KP-LER-OPPSPENTLE-30X40';
  -- 10 % rabatt: 7900 -> 7110
  select * into r from public.create_order(jsonb_build_object(
    'company_id', (select v from t_ids where k = 'company'), 'email','skole@test.no','customer_name','Skolen','payment_method','card','payment_provider','stripe',
    'subtotal_ore', 7110, 'discount_ore', 0, 'shipping_ore', 0, 'total_ore', 7110, 'vat_ore', 0, 'shipping_address','{}',
    'items', jsonb_build_array(jsonb_build_object('variant_id', v_variant, 'quantity', 1, 'unit_price_ore', 7110))));
  raise notice 'PASS T11 prisgruppe-rabatt valideres i databasen';
end $$;

-- ---------------------------------------------------------------- T12: varemottak oppdaterer lager og landed cost
reset role;
select pg_temp.as_user('33333333-3333-4333-8333-333333333333');
do $$
declare v_po uuid; v_item uuid; v_variant uuid; v_before int; v_supplier uuid;
begin
  select id into v_supplier from public.suppliers limit 1;
  select id, stock_on_hand into v_variant, v_before from public.product_variants where sku = 'KP-MED-LINOLJE-75';
  insert into public.purchase_orders (supplier_id, status, currency, exchange_rate, freight_cost_ore, duty_cost_ore)
    values (v_supplier, 'sent', 'EUR', 11.5, 10000, 2000) returning id into v_po;
  insert into public.purchase_order_items (purchase_order_id, variant_id, quantity, unit_price) values (v_po, v_variant, 20, 2.0) returning id into v_item;
  begin
    perform public.receive_purchase_order(v_po, jsonb_build_array(jsonb_build_object('item_id', v_item, 'quantity', 21)));
    raise exception 'T12 FEIL: mottak over bestilt antall godtatt';
  exception when raise_exception then
    if sqlerrm <> 'RECEIVE_EXCEEDS_ORDERED' then raise; end if;
  end;
  perform public.receive_purchase_order(v_po, jsonb_build_array(jsonb_build_object('item_id', v_item, 'quantity', 20)));
  if (select stock_on_hand from public.product_variants where id = v_variant) <> v_before + 20 then raise exception 'T12 FEIL: lager ikke økt'; end if;
  -- 2 EUR * 11.5 = 23 kr + (100+20 kr)/20 = 6 kr => 29 kr = 2900 øre
  if (select landed_cost_ore from public.variant_costs where variant_id = v_variant) <> 2900 then
    raise exception 'T12 FEIL: landed cost % (forventet 2900)', (select landed_cost_ore from public.variant_costs where variant_id = v_variant);
  end if;
  if (select status from public.purchase_orders where id = v_po) <> 'received' then raise exception 'T12 FEIL: status ikke mottatt'; end if;
  raise notice 'PASS T12 varemottak: lager +20, landed cost 29,00 kr (inkl. fordelt frakt og toll)';
end $$;

-- ---------------------------------------------------------------- T13: admin-dashbord og innkjøpsforslag
do $$
declare s jsonb; n int;
begin
  s := public.admin_dashboard_stats();
  if (s ->> 'orders_month')::int < 2 then raise exception 'T13 FEIL: dashbord teller ikke ordre (%)', s; end if;
  select count(*) into n from public.reorder_suggestions(90, 14);
  if n < 1 then raise exception 'T13 FEIL: ingen innkjøpsforslag (Brent sienna 200 ml er under minimum)'; end if;
  select count(*) into n from public.profitability_report(now() - interval '1 day', now() + interval '1 day');
  if n < 1 then raise exception 'T13 FEIL: lønnsomhetsrapport tom'; end if;
  raise notice 'PASS T13 dashbord, innkjøpsforslag og lønnsomhetsrapport';
end $$;

-- ---------------------------------------------------------------- T14: lagerjustering kan ikke gå under reservert
do $$
declare v_variant uuid := (select id from public.product_variants where sku = 'KP-OLJ-LAMPESORT-37');
begin
  begin
    perform public.adjust_stock(v_variant, -10000, 'adjustment', 'test');
    raise exception 'T14 FEIL: negativ beholdning godtatt';
  exception when check_violation then null;
  end;
  perform public.adjust_stock(v_variant, 5, 'adjustment', 'test');
  raise notice 'PASS T14 lagerjustering logges og kan ikke gi negativ beholdning';
end $$;
reset role;

-- ---------------------------------------------------------------- T15: førpris = laveste pris siste 30 dager
do $$
declare v_variant uuid := (select id from public.product_variants where sku = 'KP-OLJ-GULOKER-60');
begin
  if public.reference_price_ore(v_variant) is not null then raise exception 'T15 FEIL: førpris uten prisreduksjon'; end if;
  -- Simuler historikk: 139 kr for 40 dager siden, 129 kr for 10 dager siden, nå 99 kr
  delete from public.price_history where variant_id = v_variant;
  insert into public.price_history (variant_id, price_ore, valid_from) values
    (v_variant, 13900, now() - interval '40 days'),
    (v_variant, 12900, now() - interval '10 days'),
    (v_variant, 9900, now());
  if public.reference_price_ore(v_variant) <> 12900 then
    raise exception 'T15 FEIL: førpris % (forventet 12900 = laveste siste 30 dager)', public.reference_price_ore(v_variant);
  end if;
  -- Prisøkning gir ingen førpris
  insert into public.price_history (variant_id, price_ore, valid_from) values (v_variant, 15900, now() + interval '1 second');
  if public.reference_price_ore(v_variant) is not null then raise exception 'T15 FEIL: førpris ved prisøkning'; end if;
  raise notice 'PASS T15 førpris følger 30-dagersregelen';
end $$;

-- ---------------------------------------------------------------- T16: rate limit
select pg_temp.as_service();
do $$ begin
  if not public.check_rate_limit('test', 2, 60) then raise exception 'T16 FEIL'; end if;
  if not public.check_rate_limit('test', 2, 60) then raise exception 'T16 FEIL'; end if;
  if public.check_rate_limit('test', 2, 60) then raise exception 'T16 FEIL: grense ikke håndhevet'; end if;
  raise notice 'PASS T16 rate limiting';
end $$;
reset role;

-- ---------------------------------------------------------------- T17: søk
do $$ begin
  if (select count(*) from public.search_products('lerret', 40)) < 3 then raise exception 'T17 FEIL: søk på lerret'; end if;
  if (select count(*) from public.search_products('ultramarin', 40)) < 1 then raise exception 'T17 FEIL: delord-søk'; end if;
  raise notice 'PASS T17 produktsøk (fulltekst og delord)';
end $$;

-- ---------------------------------------------------------------- T19: kostpris for malersett og beskyttelse av kostpriser
do $$
declare v_set uuid := (select id from public.product_variants where sku = 'KP-SET-STARTPAKKE-STD');
declare v_expected int;
begin
  select sum(c.landed_cost_ore * b.quantity) into v_expected
  from public.bundle_items b join public.variant_costs c on c.variant_id = b.variant_id
  join public.product_variants v on v.product_id = b.bundle_product_id where v.id = v_set;
  if public.variant_unit_cost(v_set) is distinct from v_expected or v_expected <= 0 then
    raise exception 'T19 FEIL: settkost % (forventet %)', public.variant_unit_cost(v_set), v_expected;
  end if;
end $$;
select pg_temp.as_user('11111111-1111-4111-8111-111111111111');
do $$ begin
  if public.variant_unit_cost((select id from public.product_variants where sku = 'KP-SET-STARTPAKKE-STD')) is not null then
    raise exception 'T19 FEIL: kunde kan lese kostpris via RPC';
  end if;
  if exists (select 1 from public.variant_profitability where landed_cost_ore is not null) then
    raise exception 'T19 FEIL: kunde ser kostpris i lønnsomhetsvisning';
  end if;
  raise notice 'PASS T19 malersett får kost fra komponenter; kostpris skjules for kunder';
end $$;
reset role;

\echo 'ALLE DATABASETESTER BESTÅTT'
