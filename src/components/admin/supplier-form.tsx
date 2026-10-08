import { ActionForm, Check, Select, TextArea, TextInput } from "./form-controls";
import { saveSupplier } from "@/app/admin/_actions/supply";

export interface SupplierRow {
  id: string; name: string; contact_name: string | null; email: string | null; phone: string | null; website: string | null; country: string; region: string;
  currency: string; lead_time_days: number | null; min_order_value: number | null; payment_terms: string | null; notes: string | null; is_active: boolean; is_demo?: boolean;
}

export function SupplierForm({ s }: { s?: SupplierRow }) {
  return (
    <ActionForm action={saveSupplier} submitLabel={s ? "Lagre leverandør" : "Opprett leverandør"}>
      {s && <input type="hidden" name="id" value={s.id} />}
      <div className="grid gap-3 md:grid-cols-3">
        <TextInput label="Leverandørnavn *" name="name" defaultValue={s?.name} required />
        <TextInput label="Kontaktperson" name="contact_name" defaultValue={s?.contact_name ?? ""} />
        <TextInput label="E-post" name="email" type="email" defaultValue={s?.email ?? ""} />
        <TextInput label="Telefon" name="phone" defaultValue={s?.phone ?? ""} />
        <TextInput label="Nettsted" name="website" defaultValue={s?.website ?? ""} placeholder="https://" />
        <TextInput label="Land (kode)" name="country" defaultValue={s?.country ?? "NO"} maxLength={2} />
        <Select label="Region" name="region" defaultValue={s?.region ?? "NO"} options={[{ value: "NO", label: "Norge" }, { value: "EU", label: "Europa" }, { value: "CN", label: "Kina" }, { value: "OTHER", label: "Annet" }]} />
        <TextInput label="Valuta" name="currency" defaultValue={s?.currency ?? "NOK"} maxLength={3} />
        <TextInput label="Leveringstid (dager)" name="lead_time_days" type="number" defaultValue={s?.lead_time_days ?? ""} />
        <TextInput label="Minimumsbestilling (i valuta)" name="min_order_value" defaultValue={s?.min_order_value ?? ""} />
        <TextInput label="Betalingsbetingelser" name="payment_terms" defaultValue={s?.payment_terms ?? ""} />
      </div>
      <TextArea label="Notater" name="notes" defaultValue={s?.notes ?? ""} rows={2} />
      <Check label="Aktiv" name="is_active" defaultChecked={s?.is_active ?? true} />
    </ActionForm>
  );
}
