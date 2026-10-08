import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data/catalog";
import { formatPriceExact } from "@/lib/money";
import { PAYMENT_METHOD } from "@/lib/order-status";
import { formatDate } from "@/lib/utils";
import { PrintButton } from "@/components/shop/print-button";
import type { Address } from "@/lib/types";

/** Utskriftsvennlig kvittering/fakturagrunnlag for en ordre. */
export default async function ReceiptPage({ params }: PageProps<"/konto/fakturaer/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: order }, settings] = await Promise.all([
    supabase.from("orders").select("*, order_items(*), invoices(invoice_number, due_at, kid)").eq("id", id).maybeSingle(),
    getSettings(),
  ]);
  if (!order || !["paid", "invoiced"].includes(order.payment_status)) notFound();
  const items = order.order_items as { id: string; product_name: string; variant_name: string | null; sku: string; quantity: number; unit_price_ore: number; line_total_ore: number; vat_rate: number }[];
  const invoice = (order.invoices as { invoice_number: number; due_at: string; kid: string | null }[])[0];
  const c = settings.company;
  const addr = (order.billing_address ?? order.shipping_address) as Address;
  return (
    <div className="rounded-lg border bg-white p-6 sm:p-10 print:border-0 print:p-0">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <p className="font-serif text-2xl font-bold">Kunstner Pro</p>
          <p className="text-sm text-muted-foreground">
            {c.legal_name ?? "[Firmanavn ikke registrert]"} · Org.nr. {c.org_number ? `${c.org_number}${c.vat_registered ? " MVA" : ""}` : "[ikke registrert]"}
            <br />
            {c.address ?? "[Adresse ikke registrert]"}
          </p>
        </div>
        <PrintButton />
      </div>
      <h2 className="text-2xl font-semibold">{invoice ? `Faktura #${invoice.invoice_number}` : `Kvittering – ordre #${order.order_number}`}</h2>
      <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <p>
          <strong>Kunde</strong>
          <br />
          {addr.company_name && (
            <>
              {addr.company_name}
              <br />
            </>
          )}
          {addr.full_name}
          <br />
          {addr.line1}
          <br />
          {addr.postal_code} {addr.city}
        </p>
        <p>
          Ordre: #{order.order_number}
          <br />
          Dato: {formatDate(order.paid_at ?? order.created_at)}
          <br />
          Betaling: {PAYMENT_METHOD[order.payment_method] ?? order.payment_method}
          {invoice && (
            <>
              <br />
              Forfall: {formatDate(invoice.due_at)}
              {invoice.kid && (
                <>
                  <br />
                  KID: {invoice.kid}
                </>
              )}
            </>
          )}
          {order.purchase_reference && (
            <>
              <br />
              Deres ref.: {order.purchase_reference}
            </>
          )}
        </p>
      </div>
      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b-2 border-ink text-left">
            <th className="py-2">Vare</th>
            <th className="py-2">Varenr.</th>
            <th className="py-2 text-right">Antall</th>
            <th className="py-2 text-right">Pris</th>
            <th className="py-2 text-right">Sum</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id} className="border-b">
              <td className="py-2">
                {i.product_name}
                {i.variant_name ? ` – ${i.variant_name}` : ""}
              </td>
              <td className="py-2">{i.sku}</td>
              <td className="py-2 text-right">{i.quantity}</td>
              <td className="py-2 text-right">{formatPriceExact(i.unit_price_ore)}</td>
              <td className="py-2 text-right">{formatPriceExact(i.line_total_ore)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="mt-6 ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between"><dt>Varer</dt><dd>{formatPriceExact(order.subtotal_ore)}</dd></div>
        {order.discount_ore > 0 && <div className="flex justify-between"><dt>Rabatt</dt><dd>−{formatPriceExact(order.discount_ore)}</dd></div>}
        <div className="flex justify-between"><dt>Frakt</dt><dd>{formatPriceExact(order.shipping_ore)}</dd></div>
        <div className="flex justify-between"><dt>Sum ekskl. MVA</dt><dd>{formatPriceExact(order.total_ore - order.vat_ore)}</dd></div>
        <div className="flex justify-between"><dt>MVA 25 %</dt><dd>{formatPriceExact(order.vat_ore)}</dd></div>
        <div className="flex justify-between border-t pt-1 text-base font-semibold"><dt>Totalt</dt><dd>{formatPriceExact(order.total_ore)}</dd></div>
      </dl>
    </div>
  );
}
