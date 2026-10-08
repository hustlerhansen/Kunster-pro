"use client";

import { useActionState } from "react";
import { requestReturn } from "@/app/actions/account";
import { FormMessage, SubmitButton, initialState } from "@/components/forms/fields";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function ReturnRequestForm({ orderId, items }: { orderId: string; items: { id: string; name: string; quantity: number }[] }) {
  const [state, action] = useActionState(requestReturn, initialState);
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="order_id" value={orderId} />
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ret-type">Type</Label>
          <NativeSelect id="ret-type" name="type" defaultValue="withdrawal">
            <option value="withdrawal">Angrerett (innen 14 dager)</option>
            <option value="complaint">Reklamasjon (feil eller mangel)</option>
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ret-reason">Årsak</Label>
          <Input id="ret-reason" name="reason" required placeholder="F.eks. feil størrelse" />
        </div>
      </div>
      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium">Velg antall som skal returneres</legend>
        {items.map((i) => (
          <label key={i.id} className="flex items-center justify-between gap-3 text-sm">
            <span>{i.name}</span>
            <input type="number" name={`qty_${i.id}`} min={0} max={i.quantity} defaultValue={0} className="h-9 w-20 rounded-md border px-2" aria-label={`Antall ${i.name}`} />
          </label>
        ))}
      </fieldset>
      <div className="space-y-1.5">
        <Label htmlFor="ret-desc">Beskrivelse (valgfritt)</Label>
        <Textarea id="ret-desc" name="description" rows={3} />
      </div>
      <SubmitButton variant="outline">Send forespørsel</SubmitButton>
    </form>
  );
}
