"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CreditCard, FileText, Lock, Smartphone } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { createCheckout } from "@/app/actions/checkout";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useCart } from "./cart/cart-provider";
import { usePricedCart } from "./cart/use-priced-cart";
import { OrderSummary } from "./cart/order-summary";
import { trackEvent } from "./consent/analytics";

interface Prefill {
  email: string;
  phone: string;
  full_name: string;
  company_name: string;
  line1: string;
  line2: string;
  postal_code: string;
  city: string;
}

export function CheckoutForm({
  prefill,
  isBusiness,
  loggedIn,
  payments,
  databaseReady,
}: {
  prefill: Prefill;
  isBusiness: boolean;
  loggedIn: boolean;
  payments: { card: boolean; vipps: boolean; invoice: boolean; invoiceReason: string | null };
  databaseReady: boolean;
}) {
  const { items, ready, discountCode, shippingCode, setShippingCode } = useCart();
  const { totals, loading, refresh } = usePricedCart();
  const [form, setForm] = useState(prefill);
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState({ full_name: "", company_name: "", line1: "", postal_code: "", city: "" });
  const methods = (["card", "vipps", "invoice"] as const).filter((m) => payments[m]);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "vipps" | "invoice" | undefined>(methods[0]);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [note, setNote] = useState("");
  const [reference, setReference] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!ready) return <Skeleton className="h-96" />;
  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-10 text-center">
        <p>Handlekurven er tom.</p>
        <Button asChild className="mt-4">
          <Link href="/produkter">Se produkter</Link>
        </Button>
      </div>
    );
  }

  const set = (k: keyof Prefill) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const err = (k: string) => errors[k] ?? errors[`shipping.${k}`];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!paymentMethod) {
      setMessage("Ingen betalingsmetode er tilgjengelig ennå.");
      return;
    }
    start(async () => {
      trackEvent("begin_checkout", { currency: "NOK", value: (totals?.total_ore ?? 0) / 100 });
      const res = await createCheckout({
        lines: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        discountCode: discountCode || null,
        shippingCode: totals?.shipping?.code ?? shippingCode,
        paymentMethod,
        email: form.email,
        phone: form.phone,
        shipping: {
          full_name: form.full_name,
          company_name: form.company_name || null,
          line1: form.line1,
          line2: form.line2 || null,
          postal_code: form.postal_code,
          city: form.city,
          country: "NO",
          phone: form.phone,
        },
        billingSame,
        billing: billingSame ? null : { ...billing, line2: null, country: "NO", phone: null },
        note: note || null,
        purchaseReference: reference || null,
        acceptTerms,
        marketingConsent: marketing,
      });
      if (res.ok) {
        window.location.href = res.redirectUrl;
        return;
      }
      setErrors(res.fieldErrors ?? {});
      setMessage(res.message);
      if (res.repriced) refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_400px]" noValidate>
      <div className="space-y-6">
        {!databaseReady && (
          <Alert variant="warning">
            <strong>Demomodus:</strong> Bestilling er ikke aktivert fordi database og betaling ikke er koblet til. Du kan fylle ut skjemaet for å teste flyten.
          </Alert>
        )}
        {message && <Alert variant="destructive">{message}</Alert>}

        <Section title="1. Kontaktinformasjon">
          {!loggedIn && (
            <p className="text-sm text-muted-foreground">
              Har du konto? <Link href="/logg-inn?neste=/kasse" className="underline">Logg inn</Link> for raskere utfylling og ordrehistorikk.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="E-post" id="email" type="email" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" readOnly={loggedIn} />
            <F label="Mobil" id="phone" type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" />
          </div>
        </Section>

        <Section title="2. Leveringsadresse">
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Fullt navn" id="full_name" value={form.full_name} onChange={set("full_name")} error={err("full_name")} autoComplete="name" />
            <F label={isBusiness ? "Firma" : "Firma (valgfritt)"} id="company_name" value={form.company_name} onChange={set("company_name")} autoComplete="organization" required={false} />
          </div>
          <F label="Adresse" id="line1" value={form.line1} onChange={set("line1")} error={err("line1")} autoComplete="address-line1" />
          <F label="C/O, etasje e.l. (valgfritt)" id="line2" value={form.line2} onChange={set("line2")} autoComplete="address-line2" required={false} />
          <div className="grid grid-cols-[1fr_2fr] gap-4">
            <F label="Postnr." id="postal_code" value={form.postal_code} onChange={set("postal_code")} error={err("postal_code")} inputMode="numeric" maxLength={4} autoComplete="postal-code" />
            <F label="Poststed" id="city" value={form.city} onChange={set("city")} error={err("city")} autoComplete="address-level2" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} className="accent-[#111]" />
            Fakturaadresse er lik leveringsadresse
          </label>
          {!billingSame && (
            <div className="grid gap-4 rounded-md border bg-background p-4 sm:grid-cols-2">
              {(["full_name", "company_name", "line1", "postal_code", "city"] as const).map((k) => (
                <F
                  key={k}
                  id={`billing_${k}`}
                  label={{ full_name: "Navn", company_name: "Firma", line1: "Adresse", postal_code: "Postnr.", city: "Poststed" }[k]}
                  value={billing[k]}
                  onChange={(e) => setBilling((b) => ({ ...b, [k]: e.target.value }))}
                  error={errors[`billing.${k}`]}
                  required={k !== "company_name"}
                />
              ))}
            </div>
          )}
        </Section>

        <Section title="3. Levering">
          {totals?.shipping_options.length ? (
            <div className="space-y-2">
              {totals.shipping_options.map((o) => (
                <label key={o.code} className="flex cursor-pointer items-start gap-3 rounded-md border bg-white p-4 text-sm has-[:checked]:border-ink has-[:checked]:ring-1 has-[:checked]:ring-ink">
                  <input type="radio" name="shipping" checked={totals.shipping?.code === o.code} onChange={() => setShippingCode(o.code)} className="mt-1 accent-[#111]" />
                  <span className="flex-1">
                    <span className="font-medium">{o.name}</span>
                    {o.description && <span className="block text-muted-foreground">{o.description}</span>}
                    {o.delivery_estimate && <span className="block text-xs text-muted-foreground">Estimert: {o.delivery_estimate}</span>}
                  </span>
                  <span className="font-medium">{o.is_free ? "Gratis" : formatPrice(o.price_ore)}</span>
                </label>
              ))}
            </div>
          ) : (
            <Skeleton className="h-20" />
          )}
        </Section>

        <Section title="4. Betaling">
          {methods.length === 0 ? (
            <Alert variant="warning">Ingen betalingsmetoder er aktivert ennå. Betaling aktiveres når gyldige API-nøkler er lagt inn (Stripe/Vipps).</Alert>
          ) : (
            <div className="space-y-2">
              {methods.map((m) => {
                const meta = {
                  card: { icon: CreditCard, title: "Kort", text: "Visa, Mastercard m.fl. via Stripe – sikker betaling." },
                  vipps: { icon: Smartphone, title: "Vipps", text: "Betal med Vipps." },
                  invoice: { icon: FileText, title: "Faktura (handlekonto)", text: "Godkjent bedriftskunde – betales etter avtalte betalingsvilkår." },
                }[m];
                return (
                  <label key={m} className="flex cursor-pointer items-start gap-3 rounded-md border bg-white p-4 text-sm has-[:checked]:border-ink has-[:checked]:ring-1 has-[:checked]:ring-ink">
                    <input type="radio" name="payment" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} className="mt-1 accent-[#111]" />
                    <meta.icon className="size-5 shrink-0" />
                    <span>
                      <span className="font-medium">{meta.title}</span>
                      <span className="block text-muted-foreground">{meta.text}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          {!payments.invoice && isBusiness && payments.invoiceReason && <p className="text-xs text-muted-foreground">{payments.invoiceReason}</p>}
          {(isBusiness || paymentMethod === "invoice") && (
            <F label="Deres referanse / innkjøpsnr. (valgfritt)" id="reference" value={reference} onChange={(e) => setReference(e.target.value)} required={false} />
          )}
          <div className="space-y-1.5">
            <Label htmlFor="note">Kommentar til ordren (valgfritt)</Label>
            <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} />
          </div>
        </Section>
      </div>

      <aside className="h-fit space-y-5 rounded-lg border bg-white p-5 lg:sticky lg:top-4">
        <h2 className="text-xl font-semibold">Din ordre</h2>
        <ul className="space-y-2 text-sm">
          {totals?.lines.map((l) => (
            <li key={l.variant_id} className={cn("flex justify-between gap-3", l.issue && "text-destructive")}>
              <span>
                {l.quantity} × {l.product_name} <span className="text-muted-foreground">({l.variant_name})</span>
                {l.issue && <span className="block text-xs">Ikke tilgjengelig i ønsket antall</span>}
              </span>
              <span className="whitespace-nowrap">{formatPrice(l.line_total_ore)}</span>
            </li>
          ))}
        </ul>
        {totals ? <OrderSummary totals={totals} /> : <Skeleton className="h-32" />}
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-1 accent-[#111]" data-testid="accept-terms" />
          <span>
            Jeg har lest og godtar <Link href="/kjopsvilkar" target="_blank" className="underline">kjøpsvilkårene</Link> og{" "}
            <Link href="/personvern" target="_blank" className="underline">personvernerklæringen</Link>, og er kjent med{" "}
            <Link href="/angrerett" target="_blank" className="underline">angreretten</Link>.
            {errors.acceptTerms && <span className="block text-xs text-destructive">{errors.acceptTerms}</span>}
          </span>
        </label>
        {!loggedIn && (
          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-1 accent-[#111]" />
            <span>Ja takk, send meg nyhetsbrev og tilbud på e-post (valgfritt).</span>
          </label>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={pending || loading || !totals || totals.has_issues || !paymentMethod} data-testid="place-order">
          <Lock />
          {pending ? "Behandler …" : paymentMethod === "invoice" ? "Bekreft bestilling" : `Gå til betaling${totals ? ` – ${formatPrice(totals.total_ore)}` : ""}`}
        </Button>
        <p className="text-center text-xs text-muted-foreground">Bestillingen er bindende når betalingen er gjennomført. Ordren registreres som betalt først når betalingen er bekreftet.</p>
      </aside>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border bg-white p-5 sm:p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function F({ label, id, error, required = true, ...props }: React.ComponentProps<"input"> & { label: string; id: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <Input id={id} name={id} aria-invalid={Boolean(error)} {...props} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
