"use server";

import { z } from "zod";
import { integrations } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { rateLimitByIp } from "@/lib/rate-limit";
import { fieldErrors, formDataToObject } from "@/lib/validation";
import type { ActionState } from "./types";

const schema = z.object({
  name: z.string().trim().min(2, "Skriv inn navn").max(120),
  email: z.string().trim().toLowerCase().email("Ugyldig e-postadresse"),
  subject: z.string().trim().min(2, "Velg emne").max(120),
  order_number: z.string().trim().max(20).optional(),
  message: z.string().trim().min(10, "Meldingen er for kort").max(4000),
});

export async function submitContact(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (formData.get("company_website")) return { ok: true, message: "Takk for meldingen!" };
  if (!(await rateLimitByIp("contact", 5, 3600))) return { ok: false, message: "For mange henvendelser. Prøv igjen senere." };
  const parsed = schema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, message: "Kontroller feltene.", fieldErrors: fieldErrors(parsed.error) };
  if (!integrations.supabaseAdmin()) return { ok: false, message: "Kontaktskjemaet er ikke aktivert ennå. Send oss en e-post." };
  const user = await getCurrentUser();
  const { error } = await createAdminClient()
    .from("contact_messages")
    .insert({ ...parsed.data, order_number: parsed.data.order_number || null, user_id: user?.id ?? null });
  if (error) return { ok: false, message: "Noe gikk galt. Prøv igjen." };
  return { ok: true, message: "Takk for meldingen! Vi svarer så snart vi kan." };
}
