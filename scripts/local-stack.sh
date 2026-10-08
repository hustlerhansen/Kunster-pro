#!/usr/bin/env bash
# =====================================================================
# Lett «Supabase-lignende» teststack uten Docker:
#   PostgreSQL (lokal) + GoTrue (Supabase Auth) + PostgREST + enkel proxy.
# Brukes til ende-til-ende-testing der `supabase start` (Docker) ikke er tilgjengelig.
# For vanlig utvikling anbefales Supabase CLI: `supabase start`.
#
#   sudo -E bash scripts/local-stack.sh setup   # last ned binærer, opprett database
#   bash scripts/local-stack.sh start           # start auth, postgrest og proxy (port 54321)
#   bash scripts/local-stack.sh reset           # last migrasjoner og seed på nytt
#   bash scripts/local-stack.sh env             # skriv ut .env.local-verdier
# =====================================================================
set -euo pipefail
cd "$(dirname "$0")/.."
DIR=.local-stack
DB=kp_stack
SECRET="super-secret-jwt-token-with-at-least-32-characters-long"
AUTH_VERSION=v2.180.0
POSTGREST_VERSION=v12.2.3
mkdir -p "$DIR"

psql_su() { su postgres -c "psql -v ON_ERROR_STOP=1 -q -d $DB $*"; }

jwt() {
  node -e '
const { createHmac } = require("node:crypto");
const [secret, role] = process.argv.slice(1);
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const h = b64({ alg: "HS256", typ: "JWT" });
const now = Math.floor(Date.now() / 1000);
const p = b64({ role, iss: "supabase", iat: now, exp: now + 10 * 365 * 86400 });
console.log(`${h}.${p}.${createHmac("sha256", secret).update(`${h}.${p}`).digest("base64url")}`);' "$SECRET" "$1"
}

load_schema() {
  cat > "$DIR/prep.sql" <<'SQL'
create schema if not exists storage;
create table if not exists storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table if not exists storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
alter table storage.objects enable row level security;
grant usage on schema public, auth, storage to anon, authenticated, service_role;
grant execute on all functions in schema auth to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
SQL
  su postgres -c "psql -v ON_ERROR_STOP=1 -q -d $DB -f $PWD/$DIR/prep.sql"
  for f in supabase/migrations/*.sql supabase/seed.sql; do su postgres -c "psql -v ON_ERROR_STOP=1 -q -d $DB -f $PWD/$f"; done
  su postgres -c "psql -q -d $DB -c \"notify pgrst, 'reload schema'\""
}

case "${1:-}" in
  setup)
    [ -x "$DIR/auth/auth" ] || { curl -sSL -o "$DIR/auth.tgz" "https://github.com/supabase/auth/releases/download/$AUTH_VERSION/auth-$AUTH_VERSION-x86.tar.gz"; mkdir -p "$DIR/auth"; tar -xzf "$DIR/auth.tgz" -C "$DIR/auth"; }
    [ -x "$DIR/postgrest" ] || { curl -sSL -o "$DIR/postgrest.tar.xz" "https://github.com/PostgREST/postgrest/releases/download/$POSTGREST_VERSION/postgrest-$POSTGREST_VERSION-linux-static-x64.tar.xz"; tar -xJf "$DIR/postgrest.tar.xz" -C "$DIR"; }
    su postgres -c "dropdb --if-exists $DB; createdb $DB"
    su postgres -c "psql -q -d $DB" <<'SQL'
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin noinherit bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname='authenticator') then create role authenticator login noinherit password 'authpass'; end if;
  if not exists (select 1 from pg_roles where rolname='supabase_auth_admin') then create role supabase_auth_admin login superuser password 'authadmin'; end if;
end $$;
grant anon, authenticated, service_role to authenticator;
create schema if not exists auth authorization supabase_auth_admin;
create extension if not exists pgcrypto;
SQL
    echo "Database opprettet. Kjør «start» (GoTrue migrerer auth-skjemaet), deretter «reset»."
    ;;
  start)
    cat > "$DIR/auth.env" <<ENV
GOTRUE_DB_DRIVER=postgres
DATABASE_URL="postgres://supabase_auth_admin:authadmin@127.0.0.1:5432/$DB?search_path=auth&sslmode=disable"
GOTRUE_JWT_SECRET=$SECRET
GOTRUE_JWT_EXP=3600
GOTRUE_JWT_AUD=authenticated
GOTRUE_JWT_ADMIN_ROLES=service_role
API_EXTERNAL_URL=http://localhost:54321/auth/v1
GOTRUE_API_HOST=127.0.0.1
PORT=9999
GOTRUE_SITE_URL=http://localhost:3000
GOTRUE_URI_ALLOW_LIST=http://localhost:3000/**
GOTRUE_EXTERNAL_EMAIL_ENABLED=true
GOTRUE_MAILER_AUTOCONFIRM=true
GOTRUE_SMTP_HOST=localhost
GOTRUE_SMTP_PORT=2500
GOTRUE_SMTP_ADMIN_EMAIL=admin@localhost
ENV
    (set -a; . "$DIR/auth.env"; set +a; nohup "$DIR/auth/auth" > "$DIR/auth.log" 2>&1 &)
    cat > "$DIR/postgrest.conf" <<CONF
db-uri = "postgres://authenticator:authpass@127.0.0.1:5432/$DB"
db-schemas = "public"
db-anon-role = "anon"
jwt-secret = "$SECRET"
server-port = 3001
server-host = "127.0.0.1"
CONF
    nohup "$DIR/postgrest" "$DIR/postgrest.conf" > "$DIR/postgrest.log" 2>&1 &
    cat > "$DIR/proxy.mjs" <<'JS'
import http from "node:http";
const routes = [["/rest/v1", 3001], ["/auth/v1", 9999]];
http.createServer((req, res) => {
  const r = routes.find(([p]) => req.url.startsWith(p));
  if (!r) { res.writeHead(404); return res.end(); }
  const up = http.request({ host: "127.0.0.1", port: r[1], path: req.url.slice(r[0].length) || "/", method: req.method, headers: { ...req.headers, host: `localhost:${r[1]}` } },
    (u) => { res.writeHead(u.statusCode, u.headers); u.pipe(res); });
  up.on("error", (e) => { res.writeHead(502); res.end(String(e)); });
  req.pipe(up);
}).listen(54321);
JS
    nohup node "$DIR/proxy.mjs" > "$DIR/proxy.log" 2>&1 &
    sleep 3 && curl -s localhost:54321/auth/v1/health && echo
    ;;
  reset)
    su postgres -c "psql -q -d $DB -c 'drop schema if exists public cascade; create schema public; grant all on schema public to postgres, anon, authenticated, service_role; delete from auth.users;'"
    load_schema
    echo "Migrasjoner og seed lastet."
    ;;
  env)
    echo "NEXT_PUBLIC_SITE_URL=http://localhost:3000"
    echo "NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$(jwt anon)"
    echo "SUPABASE_SERVICE_ROLE_KEY=$(jwt service_role)"
    ;;
  *)
    echo "Bruk: $0 setup|start|reset|env"; exit 1 ;;
esac
