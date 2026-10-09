import "server-only";

/**
 * Oppslag i Enhetsregisteret (åpent API, ingen nøkkel). Brukes til å verifisere at et
 * organisasjonsnummer finnes og er aktivt før bedriftskonto eller handlekonto opprettes.
 * API-URL kan overstyres med BRREG_API_URL (brukes i test).
 */
export type BrregStatus = "verified" | "not_found" | "inactive" | "unavailable";

export interface BrregResult {
  status: BrregStatus;
  name: string | null;
  details: {
    orgForm?: string | null;
    vatRegistered?: boolean;
    bankrupt?: boolean;
    underLiquidation?: boolean;
    underForcedLiquidation?: boolean;
    deleted?: boolean;
  } | null;
}

// Overstyring tillates aldri i Vercel-produksjon (hindrer at verifisering kan omgås ved feilkonfigurasjon)
const BASE = () =>
  ((process.env.VERCEL_ENV !== "production" && process.env.BRREG_API_URL) || "https://data.brreg.no/enhetsregisteret/api").replace(/\/$/, "");

export async function lookupOrganization(orgNumber: string): Promise<BrregResult> {
  const digits = orgNumber.replace(/\s/g, "");
  if (!/^\d{9}$/.test(digits)) return { status: "not_found", name: null, details: null };
  try {
    const res = await fetch(`${BASE()}/enheter/${digits}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (res.status === 404) return { status: "not_found", name: null, details: null };
    // Slettede enheter returnerer 410 Gone
    if (res.status === 410) return { status: "inactive", name: null, details: { deleted: true } };
    if (!res.ok) return { status: "unavailable", name: null, details: null };
    const e = (await res.json()) as {
      navn?: string;
      organisasjonsform?: { kode?: string };
      registrertIMvaregisteret?: boolean;
      konkurs?: boolean;
      underAvvikling?: boolean;
      underTvangsavviklingEllerTvangsopplosning?: boolean;
      slettedato?: string;
    };
    const details = {
      orgForm: e.organisasjonsform?.kode ?? null,
      vatRegistered: Boolean(e.registrertIMvaregisteret),
      bankrupt: Boolean(e.konkurs),
      underLiquidation: Boolean(e.underAvvikling),
      underForcedLiquidation: Boolean(e.underTvangsavviklingEllerTvangsopplosning),
      deleted: Boolean(e.slettedato),
    };
    const inactive = details.bankrupt || details.underLiquidation || details.underForcedLiquidation || details.deleted;
    return { status: inactive ? "inactive" : "verified", name: e.navn ?? null, details };
  } catch {
    return { status: "unavailable", name: null, details: null };
  }
}

export const BRREG_MESSAGES: Record<Exclude<BrregStatus, "verified" | "unavailable">, string> = {
  not_found: "Organisasjonsnummeret finnes ikke i Enhetsregisteret. Kontroller nummeret.",
  inactive: "Virksomheten er registrert som slettet, under avvikling eller konkurs, og kan ikke registreres.",
};
