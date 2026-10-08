"use client";

import { useActionState } from "react";
import { registerBusiness, submitCreditApplication } from "@/app/actions/business";
import { Field, FormMessage, SubmitButton, initialState } from "./fields";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { CUSTOMER_CATEGORY_LABELS } from "@/lib/validation";

function CompanyFields({ e, defaults }: { e: Record<string, string>; defaults?: { email?: string; name?: string } }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Firmanavn" name="company_name" required error={e.company_name} autoComplete="organization" />
        <Field label="Organisasjonsnummer" name="org_number" required error={e.org_number} inputMode="numeric" maxLength={11} hint="9 siffer" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="customer_category">Type virksomhet</Label>
        <NativeSelect id="customer_category" name="customer_category" defaultValue="artist">
          {Object.entries(CUSTOMER_CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Kontaktperson" name="contact_name" required error={e.contact_name} defaultValue={defaults?.name} />
        <Field label="E-post" name="email" type="email" required error={e.email} defaultValue={defaults?.email} />
        <Field label="Telefon" name="phone" type="tel" required error={e.phone} />
      </div>
      <fieldset className="space-y-3 rounded-md border p-4">
        <legend className="px-1 text-sm font-medium">Fakturaadresse</legend>
        <Field label="Adresse" name="billing_line1" required error={e.billing_line1} />
        <div className="grid grid-cols-[1fr_2fr] gap-4">
          <Field label="Postnr." name="billing_postal_code" required error={e.billing_postal_code} maxLength={4} />
          <Field label="Poststed" name="billing_city" required error={e.billing_city} />
        </div>
      </fieldset>
      <fieldset className="space-y-3 rounded-md border p-4">
        <legend className="px-1 text-sm font-medium">Leveringsadresse (hvis annen)</legend>
        <Field label="Adresse" name="delivery_line1" required={false} />
        <div className="grid grid-cols-[1fr_2fr] gap-4">
          <Field label="Postnr." name="delivery_postal_code" required={false} maxLength={4} />
          <Field label="Poststed" name="delivery_city" required={false} />
        </div>
      </fieldset>
    </>
  );
}

export function BusinessRegisterForm({ defaults }: { defaults?: { email?: string; name?: string } }) {
  const [state, action] = useActionState(registerBusiness, initialState);
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <CompanyFields e={state.fieldErrors ?? {}} defaults={defaults} />
      <SubmitButton size="lg">Registrer bedriftskonto</SubmitButton>
    </form>
  );
}

export function CreditApplicationForm({ defaults }: { defaults?: { email?: string; name?: string } }) {
  const [state, action] = useActionState(submitCreditApplication, initialState);
  const e = state.fieldErrors ?? {};
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <FormMessage state={state} />
      <CompanyFields e={e} defaults={defaults} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ønsket kredittramme (kr)" name="requested_limit" type="number" min={1000} step={1000} required error={e.requested_limit} defaultValue="10000" />
        <Field label="Forventet kjøp per måned (kr)" name="expected_monthly" type="number" min={0} required={false} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message">Kommentar (valgfritt)</Label>
        <Textarea id="message" name="message" rows={3} />
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="accept_terms" className="mt-1 accent-[#111]" />
        <span>
          Jeg bekrefter at jeg har fullmakt til å søke på vegne av virksomheten, og samtykker til at Kunstner Pro kan innhente opplysninger fra offentlige registre
          og kredittopplysning for å vurdere søknaden.<span className="text-destructive">*</span>
          {e.accept_terms && <span className="block text-xs text-destructive">{e.accept_terms}</span>}
        </span>
      </label>
      <SubmitButton size="lg" pendingText="Sender søknad …">
        Send søknad
      </SubmitButton>
    </form>
  );
}
