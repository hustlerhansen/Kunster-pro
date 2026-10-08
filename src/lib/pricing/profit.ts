/**
 * Lønnsomhetsberegninger for innkjøp og prising.
 *
 * Begreper:
 *  - Landed cost: total reell kostnad per enhet frem til lager
 *    (innkjøpspris × valutakurs + frakt + toll + andre innkjøpskostnader).
 *    Fradragsberettiget inngående MVA (inkl. import-MVA) er IKKE en kostnad for
 *    en MVA-registrert virksomhet og holdes utenfor.
 *  - Bruttofortjeneste: salgsinntekt ekskl. MVA − varekostnad (landed cost).
 *  - Dekningsbidrag (DB): salgsinntekt ekskl. MVA − variable kostnader
 *    (varekostnad + emballasje + betalingsgebyr m.m.).
 *  - Dekningsgrad (DG): DB / salgsinntekt ekskl. MVA.
 *  - Påslag (markup): fortjeneste / kostnad.  Margin: fortjeneste / salgspris.
 *    Eksempel: kost 70, pris 140 → påslag 100 %, men margin 50 %.
 */
import { exVat, inclVat } from "@/lib/money";

export interface CostInput {
  purchasePrice: number; // i leverandørens valuta (enheter, ikke øre)
  exchangeRate: number; // NOK per valutaenhet
  freightPerUnitOre: number;
  dutyPerUnitOre: number;
  otherPerUnitOre: number;
  /** Import-MVA per enhet. Tas kun med dersom virksomheten IKKE er MVA-registrert. */
  importVatPerUnitOre?: number;
  vatRegistered?: boolean;
}

export function landedCostOre(c: CostInput): number {
  const goods = Math.round(c.purchasePrice * c.exchangeRate * 100);
  const vat = c.vatRegistered === false ? c.importVatPerUnitOre ?? 0 : 0;
  return goods + c.freightPerUnitOre + c.dutyPerUnitOre + c.otherPerUnitOre + vat;
}

export interface ProfitInput {
  priceInclVatOre: number;
  vatRate: number;
  landedCostOre: number;
  packagingPerUnitOre?: number;
  paymentFeePercent?: number;
}

export interface ProfitResult {
  priceExVatOre: number;
  vatOre: number;
  landedCostOre: number;
  grossProfitOre: number;
  variableCostsOre: number;
  contributionOre: number;
  /** Dekningsgrad 0–1 (null hvis pris = 0) */
  contributionRatio: number | null;
  /** Bruttomargin 0–1 */
  grossMargin: number | null;
  /** Påslag på varekostnad, 0–∞ (null hvis kost = 0) */
  markup: number | null;
}

export function profit(p: ProfitInput): ProfitResult {
  const priceEx = exVat(p.priceInclVatOre, p.vatRate);
  const fee = Math.round((priceEx * (p.paymentFeePercent ?? 0)) / 100);
  const variable = p.landedCostOre + (p.packagingPerUnitOre ?? 0) + fee;
  const gross = priceEx - p.landedCostOre;
  const contribution = priceEx - variable;
  return {
    priceExVatOre: priceEx,
    vatOre: p.priceInclVatOre - priceEx,
    landedCostOre: p.landedCostOre,
    grossProfitOre: gross,
    variableCostsOre: variable,
    contributionOre: contribution,
    contributionRatio: priceEx > 0 ? contribution / priceEx : null,
    grossMargin: priceEx > 0 ? gross / priceEx : null,
    markup: p.landedCostOre > 0 ? gross / p.landedCostOre : null,
  };
}

/**
 * Prisforslag basert på ønsket dekningsgrad.
 * Pris ekskl. MVA = variable kostnader / (1 − DG − betalingsgebyr%).
 * Eksempel: kostnad 70 kr, DG 50 % → 140 kr ekskl. MVA → 175 kr inkl. 25 % MVA.
 */
export function suggestPrice(input: {
  variableCostOre: number;
  targetContributionRatio: number;
  vatRate: number;
  paymentFeePercent?: number;
  /** Avrund inkl. MVA-pris opp til nærmeste "x9 kr" */
  roundToNine?: boolean;
}): { exVatOre: number; inclVatOre: number; roundedInclVatOre: number | null } {
  const ratio = input.targetContributionRatio;
  const fee = (input.paymentFeePercent ?? 0) / 100;
  if (!(ratio >= 0) || ratio + fee >= 1) throw new Error("Dekningsgrad må være mellom 0 og 100 % (inkl. gebyrer).");
  const ex = Math.round(input.variableCostOre / (1 - ratio - fee));
  const incl = inclVat(ex, input.vatRate);
  let rounded: number | null = null;
  if (input.roundToNine) {
    const kr = Math.ceil(incl / 100);
    const nine = kr % 10 === 9 ? kr : kr + ((9 - (kr % 10) + 10) % 10);
    rounded = nine * 100;
  }
  return { exVatOre: ex, inclVatOre: incl, roundedInclVatOre: rounded };
}

export function formatPercent(ratio: number | null, digits = 1): string {
  if (ratio === null || !Number.isFinite(ratio)) return "–";
  return `${(ratio * 100).toLocaleString("nb-NO", { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`;
}
