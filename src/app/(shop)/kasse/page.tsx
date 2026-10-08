import type { Metadata } from "next";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { Alert } from "@/components/ui/alert";
import { getCurrentProfile, getCurrentCompany } from "@/lib/auth";
import { getPricingContext } from "@/lib/data/cart";
import { getPaymentAvailability } from "@/lib/orders";
import { integrations, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Kasse", robots: { index: false } };

export default async function CheckoutPage({ searchParams }: PageProps<"/kasse">) {
  const sp = await searchParams;
  const profile = await getCurrentProfile();
  const company = await getCurrentCompany();
  const ctx = await getPricingContext();
  const payments = await getPaymentAvailability(ctx);

  let address: Record<string, string | null> | null = null;
  if (profile && isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("addresses").select("*").order("is_default", { ascending: false }).limit(1).maybeSingle();
    address = data;
  }
  const delivery = (company?.delivery_address ?? company?.billing_address ?? null) as Record<string, string> | null;

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-4xl font-semibold">Kasse</h1>
      {sp.avbrutt && (
        <Alert variant="warning" className="mb-6">
          Betalingen ble avbrutt. Ingen beløp er trukket – du kan prøve igjen.
        </Alert>
      )}
      <CheckoutForm
        loggedIn={Boolean(profile)}
        isBusiness={ctx.isBusiness}
        databaseReady={isSupabaseConfigured() && integrations.supabaseAdmin()}
        payments={{ card: payments.card, vipps: payments.vipps, invoice: payments.invoice, invoiceReason: payments.invoiceReason }}
        prefill={{
          email: profile?.email ?? "",
          phone: profile?.phone ?? "",
          full_name: address?.full_name ?? profile?.full_name ?? "",
          company_name: company?.name ?? address?.company_name ?? "",
          line1: address?.line1 ?? delivery?.line1 ?? "",
          line2: address?.line2 ?? "",
          postal_code: address?.postal_code ?? delivery?.postal_code ?? "",
          city: address?.city ?? delivery?.city ?? "",
        }}
      />
    </div>
  );
}
