"use client";

import { useActionState } from "react";
import { deleteAccount, updateProfile } from "@/app/actions/account";
import { Field, FormMessage, SubmitButton, initialState } from "@/components/forms/fields";

export function ProfileForm({ profile }: { profile: { full_name: string | null; phone: string | null; email: string | null; marketing_consent: boolean } }) {
  const [state, action] = useActionState(updateProfile, initialState);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <Field label="E-post" name="email_ro" value={profile.email ?? ""} disabled readOnly hint="Kontakt kundeservice for å endre e-postadresse." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fullt navn" name="full_name" defaultValue={profile.full_name ?? ""} required error={e.full_name} />
        <Field label="Telefon" name="phone" type="tel" defaultValue={profile.phone ?? ""} required error={e.phone} />
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="marketing_consent" defaultChecked={profile.marketing_consent} className="mt-1 accent-[#111]" />
        <span>Jeg ønsker å motta nyhetsbrev og tilbud på e-post. Samtykket kan trekkes tilbake når som helst.</span>
      </label>
      <SubmitButton>Lagre</SubmitButton>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action] = useActionState(deleteAccount, initialState);
  return (
    <form action={action} className="space-y-3">
      <FormMessage state={state} />
      <Field label="Skriv SLETT for å bekrefte" name="confirm" autoComplete="off" />
      <SubmitButton variant="destructive" pendingText="Sletter …">
        Slett kontoen min
      </SubmitButton>
    </form>
  );
}
