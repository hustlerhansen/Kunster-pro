"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, requestPasswordReset, updatePassword } from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton, initialState } from "./fields";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(signIn, initialState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="neste" value={next} />
      <FormMessage state={state} />
      <Field label="E-post" name="email" type="email" autoComplete="email" required />
      <Field label="Passord" name="password" type="password" autoComplete="current-password" required />
      <div className="text-right text-sm">
        <Link href="/glemt-passord" className="underline underline-offset-4">
          Glemt passord?
        </Link>
      </div>
      <SubmitButton className="w-full" size="lg" pendingText="Logger inn …">
        Logg inn
      </SubmitButton>
    </form>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(signUp, initialState);
  const e = state.fieldErrors ?? {};
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field label="Fullt navn" name="full_name" autoComplete="name" required error={e.full_name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="E-post" name="email" type="email" autoComplete="email" required error={e.email} />
        <Field label="Telefon" name="phone" type="tel" autoComplete="tel" required error={e.phone} />
      </div>
      <Field label="Adresse" name="line1" autoComplete="street-address" required error={e.line1} />
      <div className="grid grid-cols-[1fr_2fr] gap-4">
        <Field label="Postnr." name="postal_code" inputMode="numeric" autoComplete="postal-code" maxLength={4} required error={e.postal_code} />
        <Field label="Poststed" name="city" autoComplete="address-level2" required error={e.city} />
      </div>
      <Field label="Passord" name="password" type="password" autoComplete="new-password" required error={e.password} hint="Minst 10 tegn, både bokstaver og tall." />
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="accept_terms" className="mt-1 accent-[#111]" required />
        <span>
          Jeg godtar <Link href="/kjopsvilkar" className="underline">kjøpsvilkårene</Link> og har lest{" "}
          <Link href="/personvern" className="underline">personvernerklæringen</Link>.<span className="text-destructive">*</span>
          {e.accept_terms && <span className="block text-xs text-destructive">{e.accept_terms}</span>}
        </span>
      </label>
      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="marketing_consent" className="mt-1 accent-[#111]" />
        <span>Ja takk, jeg vil gjerne motta nyhetsbrev og tilbud på e-post (valgfritt – kan trekkes tilbake når som helst).</span>
      </label>
      <SubmitButton className="w-full" size="lg" pendingText="Oppretter konto …">
        Opprett konto
      </SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, initialState);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <Field label="E-post" name="email" type="email" autoComplete="email" required />
      <SubmitButton className="w-full" size="lg" pendingText="Sender …">
        Send lenke
      </SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, initialState);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <Field label="Nytt passord" name="password" type="password" autoComplete="new-password" required hint="Minst 10 tegn, både bokstaver og tall." />
      <Field label="Gjenta passord" name="password_confirm" type="password" autoComplete="new-password" required />
      <SubmitButton className="w-full" size="lg">
        Lagre nytt passord
      </SubmitButton>
      {state.ok && (
        <p className="text-center text-sm">
          <Link href="/konto" className="underline">
            Gå til Min side
          </Link>
        </p>
      )}
    </form>
  );
}
