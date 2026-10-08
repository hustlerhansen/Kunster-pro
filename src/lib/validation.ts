import { z } from "zod";

/** Validerer norsk organisasjonsnummer (9 siffer, modulus 11). */
export function isValidOrgNumber(value: string): boolean {
  const digits = value.replace(/\s/g, "");
  if (!/^\d{9}$/.test(digits)) return false;
  const weights = [3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((s, w, i) => s + w * Number(digits[i]), 0);
  const rest = sum % 11;
  const control = rest === 0 ? 0 : 11 - rest;
  if (control === 10) return false;
  return control === Number(digits[8]);
}

export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^(\+47)?[2-9]\d{7}$/.test(v) || /^\+\d{8,15}$/.test(v), "Ugyldig telefonnummer");

export const postalCodeSchema = z.string().trim().regex(/^\d{4}$/, "Postnummer må ha 4 siffer");

export const addressSchema = z.object({
  full_name: z.string().trim().min(2, "Skriv inn navn").max(120),
  company_name: z.string().trim().max(120).optional().nullable(),
  line1: z.string().trim().min(3, "Skriv inn adresse").max(160),
  line2: z.string().trim().max(160).optional().nullable(),
  postal_code: postalCodeSchema,
  city: z.string().trim().min(2, "Skriv inn poststed").max(80),
  country: z.literal("NO").default("NO"),
  phone: z.string().trim().max(30).optional().nullable(),
});

export const passwordSchema = z
  .string()
  .min(10, "Passordet må ha minst 10 tegn")
  .max(128)
  .refine((v) => /[a-zA-ZæøåÆØÅ]/.test(v) && /\d/.test(v), "Passordet må inneholde både bokstaver og tall");

export const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Skriv inn fullt navn").max(120),
  email: z.string().trim().toLowerCase().email("Ugyldig e-postadresse").max(200),
  phone: phoneSchema,
  line1: z.string().trim().min(3, "Skriv inn adresse").max(160),
  postal_code: postalCodeSchema,
  city: z.string().trim().min(2, "Skriv inn poststed").max(80),
  password: passwordSchema,
  accept_terms: z.literal("on", { message: "Du må godta kjøpsvilkår og personvernerklæring" }),
  marketing_consent: z.string().optional(),
});

export const orgNumberSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s/g, ""))
  .refine(isValidOrgNumber, "Ugyldig organisasjonsnummer");

export const businessSchema = z.object({
  company_name: z.string().trim().min(2, "Skriv inn firmanavn").max(160),
  org_number: orgNumberSchema,
  customer_category: z.enum(["artist", "school", "association", "studio", "course", "retailer", "other"]),
  contact_name: z.string().trim().min(2, "Skriv inn kontaktperson").max(120),
  email: z.string().trim().toLowerCase().email("Ugyldig e-postadresse"),
  phone: phoneSchema,
  billing_line1: z.string().trim().min(3, "Skriv inn fakturaadresse").max(160),
  billing_postal_code: postalCodeSchema,
  billing_city: z.string().trim().min(2).max(80),
  delivery_line1: z.string().trim().max(160).optional(),
  delivery_postal_code: z.string().trim().optional(),
  delivery_city: z.string().trim().max(80).optional(),
});

export const CUSTOMER_CATEGORY_LABELS: Record<string, string> = {
  artist: "Profesjonell kunstner",
  school: "Kunstskole / skole",
  association: "Kunstforening",
  studio: "Atelier",
  course: "Kursarrangør",
  retailer: "Kunstbutikk / forhandler",
  other: "Annet",
};

export function formDataToObject(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  fd.forEach((v, k) => {
    if (typeof v === "string") out[k] = v;
  });
  return out;
}

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Ugyldig skjema";
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
