"use server";

import { z } from "zod";
import { priceCart } from "@/lib/data/cart";
import { getCurrentUser } from "@/lib/auth";
import { integrations } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CartTotals } from "@/lib/pricing/cart";

const input = z.object({
  lines: z.array(z.object({ variantId: z.string().max(64), quantity: z.number().int().min(1).max(99) })).max(100),
  discountCode: z.string().max(40).optional().nullable(),
  shippingCode: z.string().max(40).optional().nullable(),
});

/** Server-side prising av handlekurven (ferske priser, lager, rabatter og frakt). */
export async function priceCartAction(raw: unknown): Promise<{ ok: true; totals: CartTotals } | { ok: false; message: string }> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Ugyldig handlekurv." };
  try {
    const totals = await priceCart(parsed.data);
    return { ok: true, totals };
  } catch (err) {
    console.error(err);
    return { ok: false, message: "Kunne ikke beregne handlekurven. Prøv igjen." };
  }
}

const syncInput = z.array(z.object({ name: z.string().max(200), quantity: z.number().int().min(1).max(99), priceOre: z.number().int().min(0) })).max(100);

/** Lagrer handlekurven for innloggede kunder (brukes til påminnelse om forlatt handlekurv ved samtykke). */
export async function syncAbandonedCart(raw: unknown): Promise<void> {
  if (!integrations.supabaseAdmin()) return;
  const user = await getCurrentUser();
  if (!user?.email) return;
  const parsed = syncInput.safeParse(raw);
  if (!parsed.success) return;
  const admin = createAdminClient();
  if (parsed.data.length === 0) {
    await admin.from("abandoned_carts").delete().eq("user_id", user.id);
    return;
  }
  await admin.from("abandoned_carts").upsert(
    {
      user_id: user.id,
      email: user.email,
      items: parsed.data.map((i) => ({ name: i.name, quantity: i.quantity })),
      subtotal_ore: parsed.data.reduce((s, i) => s + i.priceOre * i.quantity, 0),
      reminder_sent_at: null,
      recovered_at: null,
    },
    { onConflict: "user_id" },
  );
}
