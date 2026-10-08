"use client";

import { useActionState } from "react";
import { submitContact } from "@/app/actions/contact";
import { Field, FormMessage, SubmitButton, initialState } from "./fields";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const [state, action] = useActionState(submitContact, initialState);
  const e = state.fieldErrors ?? {};
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Navn" name="name" required error={e.name} autoComplete="name" />
        <Field label="E-post" name="email" type="email" required error={e.email} autoComplete="email" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="subject">Emne</Label>
          <NativeSelect id="subject" name="subject" defaultValue="Spørsmål om produkt">
            {["Spørsmål om produkt", "Min bestilling", "Retur eller reklamasjon", "Handlekonto / bedrift", "Personvern", "Annet"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </NativeSelect>
        </div>
        <Field label="Ordrenummer (valgfritt)" name="order_number" required={false} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message">
          Melding<span className="text-destructive">*</span>
        </Label>
        <Textarea id="message" name="message" rows={6} />
        {e.message && <p className="text-xs text-destructive">{e.message}</p>}
      </div>
      <p className="text-xs text-muted-foreground">Vi bruker opplysningene kun til å besvare henvendelsen. Se personvernerklæringen.</p>
      <SubmitButton size="lg" pendingText="Sender …">
        Send melding
      </SubmitButton>
    </form>
  );
}
