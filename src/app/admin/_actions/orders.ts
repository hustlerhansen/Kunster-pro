"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { integrations } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { emails } from "@/lib/email/templates";
import { getStripe } from "@/lib/payments/stripe";
import { captureVippsPayment } from "@/lib/payments/vipps";
import { releaseOrder } from "@/lib/orders";
import type { ActionState } from "@/app/actions/types";
import { dbError, fd, optKrToOre, optStr, refreshCatalog, staffAction, uuid, zodFail } from "./util";

const STATUS_FLOW: Record<string, string[]> = {
  pending_payment: ["cancelled"],
  paid: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

const STATUS_MESSAGES: Record<string, string> = {
  processing: "Ordren er under behandling",
  shipped: "Ordren er sendt",
  delivered: "Ordren er levert",
  cancelled: "Ordren er kansellert",
};

export async function updateOrderStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({ order_id: uuid, status: z.enum(["processing", "shipped", "delivered", "cancelled"]), note: optStr(500), notify: z.string().optional() })
    .safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  const { order_id, status, note, notify } = parsed.data;

  return staffAction<ActionState>({ action: "order.status_changed", entityType: "order" }, async ({ supabase, userId }) => {
    const { data: order } = await supabase.from("orders").select("id, status, payment_status, order_number, customer_name, email").eq("id", order_id).single();
    if (!order) return { result: { ok: false, message: "Fant ikke ordren." } };
    if (!STATUS_FLOW[order.status]?.includes(status)) {
      return { result: { ok: false, message: `Kan ikke endre status fra «${order.status}» til «${status}».` } };
    }
    if (status === "cancelled" && order.payment_status === "pending") {
      // Ubetalt ordre: frigjør reservert lager
      await releaseOrder(order.id, note ?? "Kansellert av administrator");
    } else if (status === "cancelled" && ["paid", "invoiced"].includes(order.payment_status)) {
      return { result: { ok: false, message: "Betalt ordre må refunderes (bruk «Refunder») før den kanselleres." } };
    } else {
      const { error } = await supabase.from("orders").update({ status }).eq("id", order.id);
      if (error) return { result: dbError("Kunne ikke oppdatere", error) };
    }
    await supabase.from("order_events").insert({
      order_id: order.id,
      event_type: `status_${status}`,
      message: note ? `${STATUS_MESSAGES[status]}: ${note}` : STATUS_MESSAGES[status],
      created_by: userId,
    });
    if (notify === "on" && (status === "delivered" || status === "processing")) {
      await sendEmail({
        to: order.email,
        template: "delivery_update",
        orderId: order.id,
        email: emails.deliveryUpdate({ orderNumber: order.order_number, customerName: order.customer_name, status: STATUS_MESSAGES[status], message: note ?? STATUS_MESSAGES[status] }),
      });
    }
    revalidatePath(`/admin/ordrer/${order.id}`);
    return { result: { ok: true, message: "Status er oppdatert." }, entityId: order.id, details: { from: order.status, to: status } };
  });
}

const CARRIERS: Record<string, { name: string; url: (n: string) => string }> = {
  bring: { name: "Posten/Bring", url: (n) => `https://sporing.posten.no/sporing/${encodeURIComponent(n)}` },
  postnord: { name: "PostNord", url: (n) => `https://tracking.postnord.com/no/?id=${encodeURIComponent(n)}` },
  helthjem: { name: "Helthjem", url: (n) => `https://helthjem.no/sporing?trackingNumber=${encodeURIComponent(n)}` },
  other: { name: "Annen transportør", url: () => "" },
};

/** Registrerer forsendelse med sporingsnummer, setter status «Sendt» og varsler kunden. */
export async function addShipment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({ order_id: uuid, carrier: z.enum(["bring", "postnord", "helthjem", "other"]), service: optStr(80), tracking_number: optStr(80), tracking_url: optStr(400) })
    .safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  return staffAction<ActionState>({ action: "order.shipment_added", entityType: "order" }, async ({ supabase, userId }) => {
    const { data: order } = await supabase
      .from("orders")
      .select("id, status, order_number, customer_name, email, payment_provider, payment_reference, total_ore, payment_status")
      .eq("id", d.order_id)
      .single();
    if (!order) return { result: { ok: false, message: "Fant ikke ordren." } };
    if (!["paid", "processing", "shipped"].includes(order.status)) {
      return { result: { ok: false, message: "Ordren må være betalt/fakturert før den kan sendes." } };
    }
    const carrier = CARRIERS[d.carrier];
    const trackingUrl = d.tracking_url && /^https:\/\//.test(d.tracking_url) ? d.tracking_url : d.tracking_number ? carrier.url(d.tracking_number) || null : null;

    // Vipps: beløpet trekkes (capture) først når varen sendes
    if (order.payment_provider === "vipps" && order.payment_reference && integrations.vipps() && order.status !== "shipped") {
      try {
        await captureVippsPayment(order.payment_reference, order.total_ore);
      } catch (err) {
        return { result: { ok: false, message: `Vipps capture feilet: ${(err as Error).message}` } };
      }
    }

    const { error } = await supabase.from("shipments").insert({
      order_id: order.id,
      carrier: carrier.name,
      service: d.service,
      tracking_number: d.tracking_number,
      tracking_url: trackingUrl,
      status: "in_transit",
      shipped_at: new Date().toISOString(),
    });
    if (error) return { result: dbError("Kunne ikke registrere forsendelsen", error) };
    await supabase.from("orders").update({ status: "shipped" }).eq("id", order.id);
    await supabase.from("order_events").insert({
      order_id: order.id,
      event_type: "shipped",
      message: `Sendt med ${carrier.name}${d.tracking_number ? ` – sporingsnummer ${d.tracking_number}` : ""}`,
      created_by: userId,
    });
    await sendEmail({
      to: order.email,
      template: "shipment_confirmation",
      orderId: order.id,
      email: emails.shipmentConfirmation({ orderNumber: order.order_number, customerName: order.customer_name, carrier: carrier.name, trackingNumber: d.tracking_number, trackingUrl }),
    });
    revalidatePath(`/admin/ordrer/${order.id}`);
    return { result: { ok: true, message: "Forsendelsen er registrert og kunden er varslet." }, entityId: order.id, details: { tracking: d.tracking_number } };
  });
}

export async function updateShipmentStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({ shipment_id: uuid, order_id: uuid, status: z.enum(["in_transit", "ready_for_pickup", "delivered", "returned", "exception"]), notify: z.string().optional() })
    .safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  const labels: Record<string, string> = {
    in_transit: "Pakken er under transport",
    ready_for_pickup: "Pakken er klar til henting",
    delivered: "Pakken er levert",
    returned: "Pakken er returnert til avsender",
    exception: "Det har oppstått et avvik med forsendelsen",
  };
  return staffAction<ActionState>({ action: "shipment.status_changed", entityType: "order" }, async ({ supabase, userId }) => {
    const { error } = await supabase
      .from("shipments")
      .update({ status: d.status, ...(d.status === "delivered" ? { delivered_at: new Date().toISOString() } : {}) })
      .eq("id", d.shipment_id);
    if (error) return { result: dbError("Kunne ikke oppdatere", error) };
    if (d.status === "delivered") await supabase.from("orders").update({ status: "delivered" }).eq("id", d.order_id).eq("status", "shipped");
    await supabase.from("order_events").insert({ order_id: d.order_id, event_type: `shipment_${d.status}`, message: labels[d.status], created_by: userId });
    if (d.notify === "on") {
      const { data: order } = await supabase.from("orders").select("order_number, customer_name, email").eq("id", d.order_id).single();
      if (order)
        await sendEmail({
          to: order.email,
          template: "delivery_update",
          orderId: d.order_id,
          email: emails.deliveryUpdate({ orderNumber: order.order_number, customerName: order.customer_name, status: labels[d.status], message: labels[d.status] }),
        });
    }
    revalidatePath(`/admin/ordrer/${d.order_id}`);
    return { result: { ok: true, message: "Leveringsstatus er oppdatert." }, entityId: d.order_id, details: { status: d.status } };
  });
}

/** Refusjon via Stripe (hel eller delvis). Ordrestatus oppdateres når Stripe bekrefter (webhook). */
export async function refundOrder(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z.object({ order_id: uuid, amount: optKrToOre, reason: optStr(300) }).safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  return staffAction<ActionState>({ action: "order.refund_requested", adminOnly: true, entityType: "order" }, async ({ supabase, userId }) => {
    const { data: order } = await supabase.from("orders").select("id, payment_provider, payment_intent_id, payment_status, total_ore").eq("id", d.order_id).single();
    if (!order) return { result: { ok: false, message: "Fant ikke ordren." } };
    if (order.payment_provider !== "stripe" || !order.payment_intent_id) {
      return { result: { ok: false, message: "Automatisk refusjon støttes kun for kortbetaling (Stripe). Refunder manuelt og registrer i notat." } };
    }
    if (!integrations.stripe()) return { result: { ok: false, message: "Stripe er ikke konfigurert." } };
    const amount = d.amount ?? undefined;
    if (amount !== undefined && (amount <= 0 || amount > order.total_ore)) return { result: { ok: false, message: "Ugyldig refusjonsbeløp." } };
    try {
      await getStripe().refunds.create(
        { payment_intent: order.payment_intent_id, amount, metadata: { order_id: order.id } },
        { idempotencyKey: `refund-${order.id}-${amount ?? "full"}-${Date.now().toString().slice(0, -4)}` },
      );
    } catch (err) {
      return { result: { ok: false, message: `Stripe-refusjon feilet: ${(err as Error).message}` } };
    }
    await supabase.from("order_events").insert({
      order_id: order.id,
      event_type: "refund_requested",
      message: `Refusjon ${amount ? `${amount / 100} kr` : "hele beløpet"} sendt til Stripe${d.reason ? ` – ${d.reason}` : ""}`,
      visible_to_customer: true,
      created_by: userId,
    });
    revalidatePath(`/admin/ordrer/${order.id}`);
    return { result: { ok: true, message: "Refusjonen er sendt til Stripe. Status oppdateres når Stripe bekrefter." }, entityId: order.id, details: { amount } };
  });
}

export async function addOrderNote(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z.object({ order_id: uuid, message: z.string().trim().min(2).max(1000), visible: z.string().optional() }).safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  return staffAction<ActionState>({ action: "order.note_added", entityType: "order" }, async ({ supabase, userId }) => {
    const { error } = await supabase.from("order_events").insert({
      order_id: parsed.data.order_id,
      event_type: "note",
      message: parsed.data.message,
      visible_to_customer: parsed.data.visible === "on",
      created_by: userId,
    });
    revalidatePath(`/admin/ordrer/${parsed.data.order_id}`);
    return { result: error ? dbError("Kunne ikke lagre notat", error) : { ok: true, message: "Notat lagret." }, entityId: parsed.data.order_id };
  });
}

// ------------------------------------------------------------------ Returer

export async function updateReturn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      return_id: uuid,
      status: z.enum(["requested", "approved", "rejected", "received", "refunded", "closed"]),
      refund_amount: optKrToOre,
      admin_note: optStr(1000),
      restock: z.string().optional(),
    })
    .safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  return staffAction<ActionState>({ action: "return.updated", entityType: "return" }, async ({ supabase }) => {
    const { error } = await supabase
      .from("returns")
      .update({ status: d.status, refund_amount_ore: d.refund_amount, admin_note: d.admin_note })
      .eq("id", d.return_id);
    if (error) return { result: dbError("Kunne ikke oppdatere returen", error) };
    if (d.restock === "on") {
      const { error: rErr } = await supabase.rpc("restock_return", { p_return_id: d.return_id });
      if (rErr) return { result: dbError("Kunne ikke legge varene på lager", rErr) };
      refreshCatalog();
    }
    revalidatePath("/admin/returer");
    return { result: { ok: true, message: "Returen er oppdatert." }, entityId: d.return_id, details: { status: d.status, restock: d.restock === "on" } };
  });
}

// ------------------------------------------------------------------ Kunder

export async function updateCustomer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      user_id: uuid,
      role: z.enum(["customer", "staff", "admin"]),
      is_blocked: z.string().optional(),
      company_id: z.string().optional().transform((v) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : null)),
    })
    .safeParse(fd(formData));
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  return staffAction<ActionState>({ action: "customer.updated", adminOnly: true, entityType: "user" }, async ({ supabase, userId }) => {
    if (d.user_id === userId && d.role !== "admin") return { result: { ok: false, message: "Du kan ikke fjerne din egen administratorrolle." } };
    const { error } = await supabase
      .from("profiles")
      .update({ role: d.role, is_blocked: d.is_blocked === "on", company_id: d.company_id, customer_type: d.company_id ? "business" : "private" })
      .eq("id", d.user_id);
    if (error) return { result: dbError("Kunne ikke oppdatere kunden", error) };
    revalidatePath(`/admin/kunder/${d.user_id}`);
    return { result: { ok: true, message: "Kunden er oppdatert." }, entityId: d.user_id, details: { role: d.role, blocked: d.is_blocked === "on", company_id: d.company_id } };
  });
}

// ------------------------------------------------------------------ Henvendelser

export async function setContactStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!uuid.safeParse(id).success || !["new", "open", "closed"].includes(status)) return;
  await staffAction({ action: "contact.status_changed", entityType: "contact" }, async ({ supabase }) => {
    await supabase.from("contact_messages").update({ status }).eq("id", id);
    return { result: null, entityId: id };
  });
  revalidatePath("/admin/henvendelser");
}

/** Brukes av dashbord for å frigjøre utløpte reservasjoner manuelt. */
export async function expireStaleOrders() {
  await staffAction({ action: "orders.expire_stale", entityType: "order" }, async () => {
    const { data } = await createAdminClient().rpc("expire_pending_orders");
    return { result: data, details: { released: data } };
  });
  refreshCatalog("/admin", "/admin/ordrer");
}
