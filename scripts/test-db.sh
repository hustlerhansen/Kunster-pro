#!/usr/bin/env bash
# Kjører migrasjoner, seed og databasetester mot en lokal PostgreSQL (krever psql og en
# superbruker). Supabase-spesifikke deler (auth, roller, storage) etterlignes i
# supabase/tests/supabase-stub.sql.
#
#   PGHOST=localhost PGUSER=postgres npm run db:test
set -euo pipefail
cd "$(dirname "$0")/.."
DB="${TEST_DB:-kunstnerpro_test}"
PSQL="psql -v ON_ERROR_STOP=1 -q"

dropdb --if-exists "$DB"
createdb "$DB"
$PSQL -d "$DB" -f supabase/tests/supabase-stub.sql
for f in supabase/migrations/*.sql; do
  echo "→ $f"
  $PSQL -d "$DB" -f "$f"
done
$PSQL -d "$DB" -f supabase/seed.sql
echo "→ Funksjonelle tester"
$PSQL -d "$DB" -f supabase/tests/db-tests.sql

echo "→ Samtidighetstest: 8 parallelle kjøp av siste enhet"
VARIANT=$(psql -d "$DB" -qAtc "update product_variants set stock_on_hand = 1, stock_reserved = 0 where sku = 'KP-LER-DYPTLERRET-70X100' returning id")
PRICE=$(psql -d "$DB" -Atc "select price_ore from product_variants where id = '$VARIANT'")
PAYLOAD="{\"email\":\"c@test.no\",\"customer_name\":\"C\",\"payment_method\":\"card\",\"payment_provider\":\"stripe\",\"subtotal_ore\":$PRICE,\"discount_ore\":0,\"shipping_ore\":0,\"total_ore\":$PRICE,\"vat_ore\":0,\"shipping_address\":{},\"items\":[{\"variant_id\":\"$VARIANT\",\"quantity\":1,\"unit_price_ore\":$PRICE}]}"
TMP=$(mktemp -d)
for i in $(seq 1 8); do
  (psql -d "$DB" -Atc "select pg_sleep(0.2); select order_id from public.create_order('$PAYLOAD'::jsonb)" >"$TMP/$i.out" 2>&1 || true) &
done
wait
OK=$(grep -l -E '^[0-9a-f-]{36}$' "$TMP"/*.out | wc -l)
FAIL=$(grep -l 'INSUFFICIENT_STOCK' "$TMP"/*.out | wc -l)
STATE=$(psql -d "$DB" -Atc "select stock_on_hand || '/' || stock_reserved from product_variants where id = '$VARIANT'")
rm -rf "$TMP"
if [ "$OK" -ne 1 ] || [ "$FAIL" -ne 7 ] || [ "$STATE" != "1/1" ]; then
  echo "FEIL: samtidighetstest – vellykkede=$OK avvist=$FAIL lager=$STATE"
  exit 1
fi
echo "PASS T18 samtidige kjøp: 1 vellykket, 7 avvist, ingen oversalg (lager 1/reservert 1)"
dropdb "$DB"
echo "ALLE DATABASETESTER BESTÅTT"
