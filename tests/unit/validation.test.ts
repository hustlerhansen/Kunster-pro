import { describe, expect, it } from "vitest";
import { isValidOrgNumber, phoneSchema, registerSchema } from "@/lib/validation";
import { exVat, formatPrice, vatPortion } from "@/lib/money";

describe("organisasjonsnummer", () => {
  it("godtar gyldige (mod11) og avviser ugyldige", () => {
    expect(isValidOrgNumber("974760673")).toBe(true); // Brønnøysundregistrene
    expect(isValidOrgNumber("974 760 673")).toBe(true);
    expect(isValidOrgNumber("974760674")).toBe(false);
    expect(isValidOrgNumber("12345")).toBe(false);
  });
});

describe("telefon", () => {
  it("godtar norske nummer", () => {
    expect(phoneSchema.safeParse("912 34 567").success).toBe(true);
    expect(phoneSchema.safeParse("+47 22 33 44 55").success).toBe(true);
    expect(phoneSchema.safeParse("123").success).toBe(false);
  });
});

describe("registrering", () => {
  it("krever samtykke til vilkår og sterkt passord", () => {
    const base = { full_name: "Ola Nordmann", email: "ola@example.no", phone: "91234567", line1: "Storgata 1", postal_code: "0155", city: "Oslo", password: "hemmelig1234" };
    expect(registerSchema.safeParse(base).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, accept_terms: "on" }).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, accept_terms: "on", password: "kort1" }).success).toBe(false);
  });
});

describe("MVA og formatering", () => {
  it("beregner MVA-andel av pris inkl. MVA", () => {
    expect(exVat(12500)).toBe(10000);
    expect(vatPortion(12500)).toBe(2500);
  });
  it("formaterer kroner", () => {
    expect(formatPrice(49900)).toBe("499 kr");
    expect(formatPrice(4950)).toBe("49,50 kr");
    expect(formatPrice(129900)).toBe("1\u00a0299 kr");
  });
});
