/**
 * Alle beløp i systemet lagres som heltall i øre for å unngå avrundingsfeil.
 * Utsalgspriser lagres INKLUDERT MVA (slik forbrukere skal se dem),
 * og beløp ekskl. MVA utledes fra MVA-satsen.
 */

export const DEFAULT_VAT_RATE = 25;

const nok = new Intl.NumberFormat("nb-NO", {
  style: "currency",
  currency: "NOK",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const nokFixed = new Intl.NumberFormat("nb-NO", {
  style: "currency",
  currency: "NOK",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formaterer øre som "499 kr" (eller "499,50 kr" når det finnes øre). */
export function formatPrice(ore: number): string {
  const kr = ore / 100;
  const formatted = Number.isInteger(kr) ? nok.format(kr) : nokFixed.format(kr);
  // Intl gir "kr 499" i nb-NO; norske nettbutikker skriver normalt "499 kr".
  return formatted.replace(/^kr\s?/, "").replace(/ kr$/, "").trim() + " kr";
}

/** Formaterer med to desimaler – brukes i admin og fakturaer. */
export function formatPriceExact(ore: number): string {
  return nokFixed.format(ore / 100).replace(/^kr\s?/, "").trim() + " kr";
}

export function toOre(kr: number | string): number {
  const value = typeof kr === "string" ? Number(kr.replace(/\s/g, "").replace(",", ".")) : kr;
  if (!Number.isFinite(value)) throw new Error(`Ugyldig beløp: ${kr}`);
  return Math.round(value * 100);
}

export function oreToKr(ore: number): number {
  return Math.round(ore) / 100;
}

/** Beløp ekskl. MVA fra beløp inkl. MVA. */
export function exVat(inclOre: number, vatRate = DEFAULT_VAT_RATE): number {
  return Math.round(inclOre / (1 + vatRate / 100));
}

/** MVA-andelen av et beløp inkl. MVA. */
export function vatPortion(inclOre: number, vatRate = DEFAULT_VAT_RATE): number {
  return inclOre - exVat(inclOre, vatRate);
}

/** Beløp inkl. MVA fra beløp ekskl. MVA. */
export function inclVat(exOre: number, vatRate = DEFAULT_VAT_RATE): number {
  return Math.round(exOre * (1 + vatRate / 100));
}
