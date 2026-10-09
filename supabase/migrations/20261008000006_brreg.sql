-- Verifisering av organisasjonsnummer mot Enhetsregisteret (Brønnøysundregistrene)
alter table public.companies
  add column if not exists brreg_name text,
  add column if not exists brreg_checked_at timestamptz,
  add column if not exists brreg_status text check (brreg_status in ('verified','not_found','inactive','unavailable'));

alter table public.credit_applications
  add column if not exists brreg_name text,
  add column if not exists brreg_checked_at timestamptz,
  add column if not exists brreg_status text check (brreg_status in ('verified','not_found','inactive','unavailable')),
  add column if not exists brreg_details jsonb;
