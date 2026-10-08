import "server-only";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import { CATALOG_TAG } from "@/lib/data/catalog";
import type { ActionState } from "@/app/actions/types";

export const uuid = z.string().uuid();

/** Tom streng → null, ellers trimmet streng. */
export const optStr = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

/** Kroner (med komma eller punktum) → øre. */
export const krToOre = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s/g, "").replace(",", "."))
  .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), "Ugyldig beløp")
  .transform((v) => (v === "" ? 0 : Math.round(Number(v) * 100)));

export const optKrToOre = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v ? v.replace(/\s/g, "").replace(",", ".") : ""))
  .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), "Ugyldig beløp")
  .transform((v) => (v === "" ? null : Math.round(Number(v) * 100)));

export const num = z
  .string()
  .trim()
  .transform((v) => v.replace(",", "."))
  .refine((v) => v !== "" && !Number.isNaN(Number(v)), "Ugyldig tall")
  .transform(Number);

export const int = z
  .string()
  .trim()
  .refine((v) => /^-?\d+$/.test(v), "Må være et heltall")
  .transform((v) => parseInt(v, 10));

export const optInt = z
  .string()
  .trim()
  .optional()
  .nullable()
  .refine((v) => !v || /^-?\d+$/.test(v), "Må være et heltall")
  .transform((v) => (v ? parseInt(v, 10) : null));

export const bool = z
  .string()
  .optional()
  .nullable()
  .transform((v) => v === "on" || v === "true");

export function fd(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  formData.forEach((v, k) => {
    if (typeof v === "string") out[k] = v;
  });
  return out;
}

export function zodFail(error: z.ZodError): ActionState {
  const fe: Record<string, string> = {};
  for (const i of error.issues) fe[i.path.join(".") || "_"] ??= i.message;
  return { ok: false, message: error.issues[0]?.message ?? "Ugyldig skjema", fieldErrors: fe };
}

/** Kjører en admin-handling: tilgangssjekk (server-side) + revisjonslogg. */
export async function staffAction<T>(
  opts: { action: string; adminOnly?: boolean; entityType?: string },
  fn: (ctx: { supabase: Awaited<ReturnType<typeof createClient>>; userId: string; email: string | null }) => Promise<{ result: T; entityId?: string | null; details?: Record<string, unknown> }>,
): Promise<T> {
  const { user, profile } = opts.adminOnly ? await requireAdmin() : await requireStaff();
  const supabase = await createClient();
  const { result, entityId, details } = await fn({ supabase, userId: user.id, email: profile.email });
  await audit({ action: opts.action, actorId: user.id, actorEmail: profile.email, entityType: opts.entityType, entityId: entityId ?? null, details });
  return result;
}

export function refreshCatalog(...paths: string[]) {
  revalidateTag(CATALOG_TAG, "max");
  for (const p of paths) revalidatePath(p);
}

export function dbError(message: string, err: { message: string; code?: string } | null): ActionState {
  if (err?.code === "23505") return { ok: false, message: `${message}: finnes allerede (unik verdi).` };
  if (err?.code === "23503") return { ok: false, message: `${message}: er i bruk av andre data.` };
  if (err?.code === "23514") return { ok: false, message: `${message}: verdien er ikke tillatt.` };
  return { ok: false, message: `${message}${err ? ` (${err.message})` : ""}` };
}
