"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { integrations, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { addressSchema, fieldErrors, formDataToObject, phoneSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { rateLimitByIp } from "@/lib/rate-limit";
import type { ActionState } from "./types";

const uuid = z.string().uuid();

export async function toggleFavorite(
  productId: string,
): Promise<{ ok: boolean; favorite: boolean; requiresLogin?: boolean; message: string }> {
  if (!isSupabaseConfigured()) return { ok: false, favorite: false, requiresLogin: true, message: "Krever innlogging" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, favorite: false, requiresLogin: true, message: "Krever innlogging" };
  if (!uuid.safeParse(productId).success) return { ok: false, favorite: false, message: "Ugyldig produkt" };
  const supabase = await createClient();
  const { data: existing } = await supabase.from("favorites").select("product_id").eq("product_id", productId).maybeSingle();
  if (existing) {
    await supabase.from("favorites").delete().eq("product_id", productId).eq("user_id", user.id);
    revalidatePath("/konto/favoritter");
    return { ok: true, favorite: false, message: "Fjernet" };
  }
  const { error } = await supabase.from("favorites").insert({ user_id: user.id, product_id: productId });
  revalidatePath("/konto/favoritter");
  return error ? { ok: false, favorite: false, message: "Kunne ikke lagre favoritt" } : { ok: true, favorite: true, message: "Lagret" };
}

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Skriv inn navn").max(120),
  phone: phoneSchema,
  marketing_consent: z.string().optional(),
});

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Du må være innlogget." };
  const parsed = profileSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, message: "Kontroller feltene.", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const consent = parsed.data.marketing_consent === "on";
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name, phone: parsed.data.phone, marketing_consent: consent, marketing_consent_at: consent ? undefined : null })
    .eq("id", user.id);
  if (error) return { ok: false, message: "Kunne ikke lagre endringene." };

  // Hold nyhetsbrev-status i synk med samtykket
  if (integrations.supabaseAdmin() && user.email) {
    const admin = createAdminClient();
    if (consent) {
      await admin.from("newsletter_subscribers").upsert(
        {
          email: user.email,
          user_id: user.id,
          status: "subscribed",
          consent_text: "Samtykke til nyhetsbrev og tilbud gitt i kontoinnstillinger.",
          consent_source: "kontoinnstillinger",
          confirmed_at: new Date().toISOString(),
          unsubscribed_at: null,
        },
        { onConflict: "email" },
      );
    } else {
      await admin.from("newsletter_subscribers").update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() }).eq("email", user.email);
    }
  }
  await audit({ action: "account.profile_updated", actorId: user.id, actorEmail: user.email, details: { marketing_consent: consent } });
  revalidatePath("/konto", "layout");
  return { ok: true, message: "Endringene er lagret." };
}

export async function saveAddress(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Du må være innlogget." };
  const raw = formDataToObject(formData);
  const parsed = addressSchema.safeParse({ ...raw, country: "NO" });
  if (!parsed.success) return { ok: false, message: "Kontroller adressen.", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const isDefault = raw.is_default === "on";
  if (isDefault) await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  const payload = { ...parsed.data, label: raw.label?.slice(0, 40) || null, is_default: isDefault, user_id: user.id };
  const id = raw.id && uuid.safeParse(raw.id).success ? raw.id : null;
  const { error } = id
    ? await supabase.from("addresses").update(payload).eq("id", id).eq("user_id", user.id)
    : await supabase.from("addresses").insert(payload);
  if (error) return { ok: false, message: "Kunne ikke lagre adressen." };
  revalidatePath("/konto/adresser");
  return { ok: true, message: "Adressen er lagret." };
}

export async function deleteAddress(formData: FormData) {
  const user = await getCurrentUser();
  const id = String(formData.get("id") ?? "");
  if (!user || !uuid.safeParse(id).success) return;
  const supabase = await createClient();
  await supabase.from("addresses").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/konto/adresser");
}

const returnSchema = z.object({
  order_id: uuid,
  type: z.enum(["withdrawal", "complaint"]),
  reason: z.string().trim().min(3, "Oppgi årsak").max(200),
  description: z.string().trim().max(2000).optional(),
});

export async function requestReturn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Du må være innlogget." };
  const parsed = returnSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, order_items(id, quantity)")
    .eq("id", parsed.data.order_id)
    .maybeSingle();
  if (!order) return { ok: false, message: "Fant ikke ordren." };
  if (!["paid", "processing", "shipped", "delivered"].includes(order.status)) {
    return { ok: false, message: "Ordren kan ikke returneres i nåværende status." };
  }
  const items = (order.order_items as { id: string; quantity: number }[])
    .map((i) => ({ order_item_id: i.id, quantity: Math.min(Math.max(parseInt(String(formData.get(`qty_${i.id}`) ?? "0"), 10) || 0, 0), i.quantity) }))
    .filter((i) => i.quantity > 0);
  if (items.length === 0) return { ok: false, message: "Velg minst én vare som skal returneres." };

  const { error } = await supabase.from("returns").insert({
    order_id: order.id,
    user_id: user.id,
    type: parsed.data.type,
    reason: parsed.data.reason,
    description: parsed.data.description || null,
    items,
  });
  if (error) return { ok: false, message: "Kunne ikke registrere returen." };
  await audit({ action: "return.requested", actorId: user.id, actorEmail: user.email, entityType: "order", entityId: order.id });
  revalidatePath("/konto/returer");
  return { ok: true, message: "Returen er registrert. Vi tar kontakt med returinstruksjoner." };
}

/** Henter linjene fra en tidligere ordre for «Kjøp samme produkter igjen». */
export async function getReorderLines(orderId: string) {
  const user = await getCurrentUser();
  if (!user || !uuid.safeParse(orderId).success) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("order_items")
    .select("variant_id, quantity, product_name, variant_name, unit_price_ore, product:products(slug, images:product_images(url, sort_order))")
    .eq("order_id", orderId);
  return ((data ?? []) as unknown as {
    variant_id: string | null;
    quantity: number;
    product_name: string;
    variant_name: string | null;
    unit_price_ore: number;
    product: { slug: string; images: { url: string; sort_order: number }[] } | null;
  }[])
    .filter((r) => r.variant_id && r.product)
    .map((r) => ({
      variantId: r.variant_id!,
      quantity: r.quantity,
      snapshot: {
        productName: r.product_name,
        variantName: r.variant_name ?? "",
        slug: r.product!.slug,
        priceOre: r.unit_price_ore,
        imageUrl: [...r.product!.images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null,
      },
    }));
}

/**
 * Sletting av konto (GDPR art. 17). Personopplysninger slettes/anonymiseres.
 * Ordre og fakturaer beholdes anonymisert i 5 år pga. bokføringsloven § 13.
 */
export async function deleteAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Du må være innlogget." };
  if (formData.get("confirm") !== "SLETT") return { ok: false, message: "Skriv SLETT for å bekrefte." };
  if (!integrations.supabaseAdmin()) return { ok: false, message: "Sletting krever serverkonfigurasjon. Kontakt kundeservice." };
  if (!(await rateLimitByIp("delete-account", 3, 3600))) return { ok: false, message: "For mange forsøk." };

  const admin = createAdminClient();
  const { data: open } = await admin
    .from("orders")
    .select("id")
    .eq("user_id", user.id)
    .in("status", ["paid", "processing", "shipped"])
    .limit(1);
  if (open && open.length > 0) {
    return { ok: false, message: "Du har ordre som ikke er levert ennå. Kontoen kan slettes når alle ordre er fullført." };
  }
  const { data: openInvoices } = await admin.from("invoices").select("id").eq("user_id", user.id).in("status", ["open", "overdue"]).limit(1);
  if (openInvoices && openInvoices.length > 0) {
    return { ok: false, message: "Du har ubetalte fakturaer. Kontoen kan slettes når disse er betalt." };
  }

  const anonEmail = `slettet-${user.id.slice(0, 8)}@anonymisert.invalid`;
  await admin
    .from("orders")
    .update({ email: anonEmail, phone: null, customer_name: "Slettet kunde", customer_note: null, user_id: null })
    .eq("user_id", user.id);
  await admin.from("newsletter_subscribers").delete().eq("email", user.email ?? "");
  await admin.from("abandoned_carts").delete().eq("user_id", user.id);
  await audit({ action: "account.deleted", actorId: user.id, entityType: "user", entityId: user.id });
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, message: "Kunne ikke slette kontoen. Kontakt kundeservice." };

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/?konto=slettet");
}
