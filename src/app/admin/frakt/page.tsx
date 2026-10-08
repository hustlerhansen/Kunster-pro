import { PageHeader, Panel } from "@/components/admin/ui";
import { ActionForm, Check, Select, TextInput } from "@/components/admin/form-controls";
import { Alert } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/server";
import { integrations } from "@/lib/env";
import { formatPrice } from "@/lib/money";
import { saveShippingMethod } from "../_actions/content";
import type { ShippingMethod } from "@/lib/types";

export const metadata = { title: "Frakt" };

function Fields({ m }: { m?: ShippingMethod }) {
  return (
    <>
      {m && <input type="hidden" name="id" value={m.id} />}
      <div className="grid gap-3 md:grid-cols-4">
        <TextInput label="Kode" name="code" defaultValue={m?.code} required />
        <TextInput label="Navn" name="name" defaultValue={m?.name} required />
        <Select label="Transportør" name="carrier" defaultValue={m?.carrier ?? "bring"} options={[{ value: "bring", label: "Posten/Bring" }, { value: "postnord", label: "PostNord" }, { value: "helthjem", label: "Helthjem" }, { value: "own", label: "Egen levering" }, { value: "other", label: "Annen" }]} />
        <Select label="Type" name="type" defaultValue={m?.type ?? "home"} options={[{ value: "home", label: "Hjemlevering" }, { value: "pickup", label: "Hentested" }, { value: "business", label: "Bedriftslevering" }]} />
        <TextInput label="Pris inkl. MVA (kr)" name="price" defaultValue={m ? String(m.price_ore / 100) : ""} />
        <TextInput label="Fri frakt over (kr, tom = aldri)" name="free_threshold" defaultValue={m?.free_threshold_ore ? String(m.free_threshold_ore / 100) : ""} />
        <TextInput label="Leveringsestimat (tom = vises ikke)" name="delivery_estimate" defaultValue={m?.delivery_estimate ?? ""} hint="Kun dokumenterte tider fra transportør." />
        <TextInput label="Maks vekt (g)" name="max_weight_g" type="number" defaultValue={m?.max_weight_g ?? ""} />
        <TextInput label="Sortering" name="sort_order" type="number" defaultValue={m?.sort_order ?? 0} />
      </div>
      <TextInput label="Beskrivelse" name="description" defaultValue={m?.description ?? ""} />
      <div className="flex gap-6">
        <Check label="Kun for bedriftskunder" name="requires_business" defaultChecked={m?.requires_business} />
        <Check label="Aktiv" name="is_active" defaultChecked={m?.is_active ?? true} />
      </div>
    </>
  );
}

export default async function AdminShipping() {
  const supabase = await createClient();
  const { data } = await supabase.from("shipping_methods").select("*").order("sort_order");
  return (
    <div className="space-y-4">
      <PageHeader title="Frakt og levering" description="Fraktpriser, terskel for fri frakt og leveringsestimater er konfigurerbare. Vis aldri leveringstider som ikke er dokumentert." />
      <Alert variant="info">
        Transportørintegrasjon: Bring {integrations.bring() ? "er konfigurert" : "er ikke konfigurert (BRING_API_UID, BRING_API_KEY, BRING_CUSTOMER_NUMBER)"} · PostNord{" "}
        {integrations.postnord() ? "er konfigurert" : "er ikke konfigurert (POSTNORD_API_KEY)"}. Fraktetiketter og automatiske sporingshendelser krever avtale med transportør; sporingsnummer kan registreres manuelt på ordren.
      </Alert>
      {(data as ShippingMethod[] | null)?.map((m) => (
        <details key={m.id} className="rounded-lg border bg-white">
          <summary className="flex cursor-pointer flex-wrap gap-4 px-4 py-3 text-sm">
            <strong>{m.name}</strong>
            <span>{formatPrice(m.price_ore)}</span>
            <span className="text-muted-foreground">{m.free_threshold_ore ? `Fri frakt over ${formatPrice(m.free_threshold_ore)}` : "Ingen fri frakt"}</span>
            <span className="text-muted-foreground">{m.delivery_estimate ?? "Ingen leveringstid vist"}</span>
            {!m.is_active && <span className="text-muted-foreground">(inaktiv)</span>}
          </summary>
          <div className="border-t p-4">
            <ActionForm action={saveShippingMethod}>
              <Fields m={m} />
            </ActionForm>
          </div>
        </details>
      ))}
      <Panel title="Ny fraktmetode">
        <ActionForm action={saveShippingMethod} submitLabel="Opprett">
          <Fields />
        </ActionForm>
      </Panel>
    </div>
  );
}
