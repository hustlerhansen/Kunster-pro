import { describe, expect, it } from "vitest";
import { landedCostOre, profit, suggestPrice } from "@/lib/pricing/profit";

describe("landed cost", () => {
  it("summerer innkjøp i NOK, frakt, toll og andre kostnader", () => {
    expect(
      landedCostOre({ purchasePrice: 4, exchangeRate: 11.5, freightPerUnitOre: 500, dutyPerUnitOre: 200, otherPerUnitOre: 100 }),
    ).toBe(4600 + 800);
  });
  it("tar ikke med import-MVA for MVA-registrert virksomhet", () => {
    const base = { purchasePrice: 10, exchangeRate: 1, freightPerUnitOre: 0, dutyPerUnitOre: 0, otherPerUnitOre: 0, importVatPerUnitOre: 250 };
    expect(landedCostOre({ ...base, vatRegistered: true })).toBe(1000);
    expect(landedCostOre({ ...base, vatRegistered: false })).toBe(1250);
  });
});

describe("prisforslag", () => {
  it("eksempelet fra kravspesifikasjonen: kost 70 kr, DG 50 % → 140 kr ekskl. / 175 kr inkl. MVA", () => {
    const s = suggestPrice({ variableCostOre: 7000, targetContributionRatio: 0.5, vatRate: 25 });
    expect(s.exVatOre).toBe(14000);
    expect(s.inclVatOre).toBe(17500);
  });
  it("avrunder til x9 kr ved ønske", () => {
    const s = suggestPrice({ variableCostOre: 7000, targetContributionRatio: 0.5, vatRate: 25, roundToNine: true });
    expect(s.roundedInclVatOre).toBe(17900);
  });
  it("avviser umulig dekningsgrad", () => {
    expect(() => suggestPrice({ variableCostOre: 100, targetContributionRatio: 1, vatRate: 25 })).toThrow();
  });
});

describe("lønnsomhet", () => {
  it("skiller mellom påslag og margin", () => {
    const r = profit({ priceInclVatOre: 17500, vatRate: 25, landedCostOre: 7000 });
    expect(r.priceExVatOre).toBe(14000);
    expect(r.grossProfitOre).toBe(7000);
    expect(r.grossMargin).toBeCloseTo(0.5);
    expect(r.markup).toBeCloseTo(1.0);
  });
  it("dekningsbidrag trekker fra variable kostnader inkl. betalingsgebyr", () => {
    const r = profit({ priceInclVatOre: 12500, vatRate: 25, landedCostOre: 4000, packagingPerUnitOre: 500, paymentFeePercent: 2 });
    // pris ekskl. 10 000, gebyr 200, variable 4 700, DB 5 300
    expect(r.contributionOre).toBe(5300);
    expect(r.contributionRatio).toBeCloseTo(0.53);
  });
});
