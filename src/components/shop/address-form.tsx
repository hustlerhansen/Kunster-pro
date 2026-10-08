"use client";

import { useActionState } from "react";
import { saveAddress } from "@/app/actions/account";
import { Field, FormMessage, SubmitButton, initialState } from "@/components/forms/fields";

export interface AddressRow {
  id: string;
  label: string | null;
  full_name: string;
  company_name: string | null;
  line1: string;
  line2: string | null;
  postal_code: string;
  city: string;
  phone: string | null;
  is_default: boolean;
}

export function AddressForm({ address }: { address?: AddressRow }) {
  const [state, action] = useActionState(saveAddress, initialState);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-3">
      {address && <input type="hidden" name="id" value={address.id} />}
      <FormMessage state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Navn på adressen" name="label" defaultValue={address?.label ?? ""} placeholder="F.eks. Atelier" />
        <Field label="Mottaker" name="full_name" defaultValue={address?.full_name} required error={e.full_name} />
        <Field label="Firma (valgfritt)" name="company_name" defaultValue={address?.company_name ?? ""} />
        <Field label="Telefon" name="phone" type="tel" defaultValue={address?.phone ?? ""} />
      </div>
      <Field label="Adresse" name="line1" defaultValue={address?.line1} required error={e.line1} />
      <Field label="Adresselinje 2" name="line2" defaultValue={address?.line2 ?? ""} />
      <div className="grid grid-cols-[1fr_2fr] gap-3">
        <Field label="Postnr." name="postal_code" defaultValue={address?.postal_code} maxLength={4} inputMode="numeric" required error={e.postal_code} />
        <Field label="Poststed" name="city" defaultValue={address?.city} required error={e.city} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_default" defaultChecked={address?.is_default} className="accent-[#111]" /> Standard leveringsadresse
      </label>
      <SubmitButton size="sm">{address ? "Lagre endringer" : "Legg til adresse"}</SubmitButton>
    </form>
  );
}
