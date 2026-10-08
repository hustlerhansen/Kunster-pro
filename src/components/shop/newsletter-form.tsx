"use client";

import { useActionState } from "react";
import { subscribeNewsletter, type ActionState } from "@/app/actions/newsletter";
import { Button } from "@/components/ui/button";

export function NewsletterForm({ source }: { source: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(subscribeNewsletter, { ok: false, message: "" });
  return (
    <form action={action} className="w-full">
      <input type="hidden" name="source" value={source} />
      {/* Honeypot mot roboter */}
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={`nl-${source}`} className="sr-only">
          E-postadresse
        </label>
        <input
          id={`nl-${source}`}
          type="email"
          name="email"
          required
          placeholder="Din e-postadresse"
          className="h-12 flex-1 rounded-md border border-white/20 bg-white/5 px-4 text-sm text-white placeholder:text-white/50 focus:border-gold focus:outline-none"
        />
        <Button type="submit" variant="gold" size="lg" disabled={pending}>
          {pending ? "Sender …" : "Meld meg på"}
        </Button>
      </div>
      <label className="mt-3 flex items-start gap-2 text-xs text-white/70">
        <input type="checkbox" name="consent" required className="mt-0.5 accent-[#D4AF65]" />
        <span>
          Ja, jeg samtykker til å motta nyhetsbrev og tilbud på e-post fra Kunstner Pro. Samtykket kan trekkes tilbake når som helst.
          Se <a href="/personvern" className="underline">personvernerklæringen</a>.
        </span>
      </label>
      {state.message && (
        <p className={`mt-3 text-sm ${state.ok ? "text-gold" : "text-red-300"}`} role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}
