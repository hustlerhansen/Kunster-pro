import "server-only";
import { revalidateTag } from "next/cache";
import { integrations } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSettings, CATALOG_TAG } from "@/lib/data/catalog";
import { sendEmail } from "@/lib/email/send";
import { emails, type OrderEmailData } from "@/lib/email/templates";
import { PAYMENT_METHOD } from "@/lib/order-status";
import type { CustomerPricingContext } from "@/lib/data/cart";

export interface PaymentAvailability {
  card: boolean;
  vipps: boolean;
  invoice: boolean;
  invoiceReason: string | null;
  creditAvailableOre: number | null;
}

/** Hvilke betalingsmetoder som faktisk kan brukes – styres av reelle integrasjoner og innstillinger. */
export async function getPaymentAvailability(ctx: CustomerPricingContext): Promise<PaymentAvailability> {
  const settings = await getSettings();
  const card = integrations.stripe() && settings.payments.card_enabled;
  const vipps = integrations.vipps() && settings.payments.vipps_enabled;
  let invoice = false;
  let invoiceReason: string | null = null;
  let creditAvailableOre: number | null = null;

  if (!ctx.companyId) {
    invoiceReason = "Faktura er kun tilgjengelig for bedrifter med godkjent handlekonto.";
  } else if (!integrations.businessInvoice() || !settings.payments.invoice_enabled) {
    invoiceReason = "Fakturakjøp er ikke aktivert ennå.";
  } else if (integrations.supabaseAdmin()) {
    const { data } = await createAdminClient()
      .from("credit_account_overview")
      .select("status, available_ore")
      .eq("company_id", ctx.companyId)
      .maybeSingle();
    if (data?.status === "active") {
      invoice = true;
      creditAvailableOre = data.available_ore;
    } else {
      invoiceReason = "Handlekontoen er ikke aktiv.";
    }
  }
  return { card, vipps, invoice, invoiceReason, creditAvailableOre };
}

export async function loadOrderEmailData(orderId: string): Promise<(OrderEmailData & { email: string }) | null> {
  const { data: order } = await createAdminClient()
    .from("orders")
    .select("*, order_items(product_name, variant_name, quantity, line_total_ore)")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return null;
  return {
    email: order.email,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    items: (order.order_items as { product_name: string; variant_name: string | null; quantity: number; line_total_ore: number }[]).map((i) => ({
      name: i.product_name,
      variant: i.variant_name,
      quantity: i.quantity,
      lineTotalOre: i.line_total_ore,
    })),
    subtotalOre: order.subtotal_ore,
    discountOre: order.discount_ore,
    shippingOre: order.shipping_ore,
    totalOre: order.total_ore,
    vatOre: order.vat_ore,
    shippingMethod: order.shipping_method_name,
    shippingAddress: order.shipping_address,
    paymentMethod: PAYMENT_METHOD[order.payment_method] ?? order.payment_method,
  };
}

export async function sendOrderConfirmation(orderId: string) {
  const data = await loadOrderEmailData(orderId);
  if (!data) return;
  await sendEmail({ to: data.email, template: "order_confirmation", email: emails.orderConfirmation(data), orderId });
}

/** Kalles når betalingsleverandøren har BEKREFTET betalingen (webhook). */
export async function markOrderPaid(opts: { orderId: string; provider: "stripe" | "vipps"; reference: string | null; paymentIntent: string | null; amountOre: number }) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("confirm_order_payment", {
    p_order_id: opts.orderId,
    p_provider: opts.provider,
    p_reference: opts.reference,
    p_payment_intent: opts.paymentIntent,
    p_amount_ore: opts.amountOre,
  });
  if (error) throw new Error(`confirm_order_payment feilet: ${error.message}`);
  if (data !== "already_paid") {
    await sendOrderConfirmation(opts.orderId);
    revalidateTag(CATALOG_TAG, "max");
  }
  return data as string;
}

export async function releaseOrder(orderId: string, reason: string) {
  const { error } = await createAdminClient().rpc("release_order_stock", { p_order_id: orderId, p_reason: reason });
  if (error) console.error("release_order_stock feilet", error);
}
