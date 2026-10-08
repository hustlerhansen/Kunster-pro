/**
 * Sentral oversikt over miljøvariabler og hvilke integrasjoner som er aktive.
 * Ingen hemmelige nøkler hardkodes – alt leses fra miljøet.
 * Se docs/MILJOVARIABLER.md for full dokumentasjon.
 */

function has(...keys: string[]): boolean {
  return keys.every((k) => {
    const v = process.env[k];
    return typeof v === "string" && v.trim().length > 0;
  });
}

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** Er offentlig Supabase-tilkobling konfigurert? (trygt å kalle i klient og server) */
export function isSupabaseConfigured(): boolean {
  return supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
}

/** Server-only feature flags. */
export const integrations = {
  supabaseAdmin: () => isSupabaseConfigured() && has("SUPABASE_SERVICE_ROLE_KEY"),
  stripe: () => has("STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"),
  vipps: () =>
    has("VIPPS_CLIENT_ID", "VIPPS_CLIENT_SECRET", "VIPPS_SUBSCRIPTION_KEY", "VIPPS_MSN") &&
    process.env.VIPPS_ENABLED === "true",
  resend: () => has("RESEND_API_KEY", "EMAIL_FROM"),
  bring: () => has("BRING_API_UID", "BRING_API_KEY", "BRING_CUSTOMER_NUMBER"),
  postnord: () => has("POSTNORD_API_KEY"),
  /**
   * Fakturakjøp for godkjente bedriftskunder krever BÅDE at dette flagget er satt
   * OG at administrator har aktivert det i butikkinnstillinger. Holdes av inntil
   * juridiske, økonomiske og tekniske krav er avklart.
   */
  businessInvoice: () => process.env.FEATURE_BUSINESS_INVOICE === "true",
  cron: () => has("CRON_SECRET"),
};

export const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";
