-- Hjelpefunksjoner for butikkfronten

-- Førpris (laveste pris siste 30 dager før prisreduksjon) for flere varianter i ett kall
create or replace function public.reference_prices(p_variant_ids uuid[])
returns table (variant_id uuid, reference_price_ore integer)
language sql
stable
security definer
set search_path = public
as $$
  select v.id, public.reference_price_ore(v.id)
  from public.product_variants v
  where v.id = any(p_variant_ids) and v.is_active;
$$;

grant execute on function public.reference_prices(uuid[]) to anon, authenticated;
grant execute on function public.reference_price_ore(uuid) to anon, authenticated;
grant execute on function public.search_products(text, integer) to anon, authenticated;
