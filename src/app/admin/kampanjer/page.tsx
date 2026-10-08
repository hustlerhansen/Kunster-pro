import { PageHeader, Panel, Empty } from "@/components/admin/ui";
import { ActionForm, Check, Select, TextInput } from "@/components/admin/form-controls";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { deleteVolumeDiscount, saveDiscountCode, saveVolumeDiscount } from "../_actions/content";

export const metadata = { title: "Kampanjer og rabatter" };

const toLocal = (v: string | null) => (v ? new Date(v).toISOString().slice(0, 16) : "");

interface Code { id: string; code: string; description: string | null; type: string; value: number; min_order_ore: number; category_id: string | null; starts_at: string | null; ends_at: string | null; max_uses: number | null; uses_count: number; once_per_customer: boolean; is_active: boolean }

function CodeFields({ c, categories }: { c?: Code; categories: { id: string; name: string }[] }) {
  return (
    <>
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="grid gap-3 md:grid-cols-4">
        <TextInput label="Kode" name="code" defaultValue={c?.code} required />
        <Select label="Type" name="type" defaultValue={c?.type ?? "percent"} options={[{ value: "percent", label: "Prosent" }, { value: "fixed", label: "Fast beløp (kr)" }, { value: "free_shipping", label: "Fri frakt" }]} />
        <TextInput label="Verdi (% eller kr)" name="value" defaultValue={c ? String(c.type === "fixed" ? c.value / 100 : c.value) : ""} />
        <TextInput label="Minste ordrebeløp (kr)" name="min_order" defaultValue={c ? String(c.min_order_ore / 100) : "0"} />
        <Select label="Gjelder kategori" name="category_id" defaultValue={c?.category_id ?? ""} options={[{ value: "", label: "Hele sortimentet" }, ...categories.map((k) => ({ value: k.id, label: k.name }))]} />
        <TextInput label="Starter" name="starts_at" type="datetime-local" defaultValue={toLocal(c?.starts_at ?? null)} />
        <TextInput label="Slutter" name="ends_at" type="datetime-local" defaultValue={toLocal(c?.ends_at ?? null)} />
        <TextInput label="Maks antall bruk" name="max_uses" type="number" defaultValue={c?.max_uses ?? ""} />
      </div>
      <TextInput label="Beskrivelse (vises til kunden)" name="description" defaultValue={c?.description ?? ""} />
      <div className="flex gap-6">
        <Check label="Én gang per kunde" name="once_per_customer" defaultChecked={c?.once_per_customer} />
        <Check label="Aktiv" name="is_active" defaultChecked={c?.is_active ?? true} />
      </div>
    </>
  );
}

export default async function AdminCampaigns() {
  const supabase = await createClient();
  const [{ data: codes }, { data: volume }, { data: categories }, { data: products }] = await Promise.all([
    supabase.from("discount_codes").select("*").order("created_at", { ascending: false }),
    supabase.from("volume_discounts").select("*, product:products(name), category:categories(name)").order("created_at"),
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("products").select("id, name").neq("status", "archived").order("name"),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Kampanjer og rabatter" />
      <Alert variant="info">
        <div>
          <strong>Norske prisregler:</strong> Førpris vises automatisk kun som laveste pris de siste 30 dagene før en prisreduksjon (prisopplysningsforskriften § 4a). Sett ned prisen på
          varianten for å lage et tilbud – ikke oppgi fiktive «før»-priser. Produktpakker (malersett) viser besparelse beregnet mot dagens enkeltpriser.
        </div>
      </Alert>

      <Panel title="Rabattkoder">
        <div className="space-y-2">
          {(codes as Code[] | null)?.map((c) => (
            <details key={c.id} className="rounded-md border">
              <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 px-4 py-2 text-sm">
                <strong>{c.code}</strong>
                <span>{c.type === "percent" ? `${c.value} %` : c.type === "fixed" ? formatPrice(c.value) : "Fri frakt"}</span>
                <span className="text-muted-foreground">Brukt {c.uses_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</span>
                {c.ends_at && <span className="text-muted-foreground">til {formatDate(c.ends_at)}</span>}
                <Badge variant={c.is_active ? "success" : "secondary"}>{c.is_active ? "Aktiv" : "Inaktiv"}</Badge>
              </summary>
              <div className="border-t p-4">
                <ActionForm action={saveDiscountCode}>
                  <CodeFields c={c} categories={categories ?? []} />
                </ActionForm>
              </div>
            </details>
          ))}
          {!codes?.length && <Empty>Ingen rabattkoder.</Empty>}
        </div>
        <details className="mt-4 rounded-md border border-dashed">
          <summary className="cursor-pointer px-4 py-2 text-sm font-medium">+ Ny rabattkode</summary>
          <div className="border-t p-4">
            <ActionForm action={saveDiscountCode} submitLabel="Opprett">
              <CodeFields categories={categories ?? []} />
            </ActionForm>
          </div>
        </details>
      </Panel>

      <Panel title="Mengderabatter («Kjøp 5 lerret – få rabatt»)">
        <ul className="mb-4 divide-y text-sm">
          {volume?.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-4 py-2">
              <strong>{v.name}</strong>
              <span>
                Fra {v.min_quantity} stk: {Number(v.percent_off)} % – {(v.product as { name: string } | null)?.name ?? (v.category as { name: string } | null)?.name}
              </span>
              <Badge variant={v.is_active ? "success" : "secondary"}>{v.is_active ? "Aktiv" : "Inaktiv"}</Badge>
              <form action={deleteVolumeDiscount}>
                <input type="hidden" name="id" value={v.id} />
                <button className="text-xs text-destructive underline">Slett</button>
              </form>
            </li>
          ))}
        </ul>
        <ActionForm action={saveVolumeDiscount} submitLabel="Legg til mengderabatt">
          <div className="grid gap-3 md:grid-cols-3">
            <TextInput label="Navn (vises til kunden)" name="name" placeholder="Kjøp 5 lerret – spar 10 %" required />
            <Select label="Produkt" name="product_id" options={[{ value: "", label: "– eller velg kategori –" }, ...(products ?? []).map((p) => ({ value: p.id, label: p.name }))]} />
            <Select label="Kategori" name="category_id" options={[{ value: "", label: "–" }, ...(categories ?? []).map((c) => ({ value: c.id, label: c.name }))]} />
            <TextInput label="Minste antall" name="min_quantity" type="number" defaultValue="5" />
            <TextInput label="Rabatt %" name="percent_off" defaultValue="10" />
            <TextInput label="Beskrivelse" name="description" />
            <TextInput label="Starter" name="starts_at" type="datetime-local" />
            <TextInput label="Slutter" name="ends_at" type="datetime-local" />
          </div>
          <Check label="Aktiv" name="is_active" defaultChecked />
        </ActionForm>
      </Panel>
    </div>
  );
}
