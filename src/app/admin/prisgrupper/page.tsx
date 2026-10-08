import Link from "next/link";
import { PageHeader, Panel } from "@/components/admin/ui";
import { ActionForm, Check, TextInput } from "@/components/admin/form-controls";
import { createClient } from "@/lib/supabase/server";
import { savePriceGroup } from "../_actions/credit";

export const metadata = { title: "Prisgrupper" };

export default async function AdminPriceGroups() {
  const supabase = await createClient();
  const { data } = await supabase.from("price_groups").select("*, companies(count), price_group_prices(count)").order("name");
  return (
    <div className="space-y-4">
      <PageHeader title="Prisgrupper (B2B)" description="Gi bedriftskunder en generell rabatt og/eller egne priser per variant. Prisene gjelder automatisk i handlekurv og kasse for tilknyttede bedrifter." />
      {data?.map((g) => (
        <Panel key={g.id} title={g.name} actions={<Link href={`/admin/prisgrupper/${g.id}`} className="text-sm underline">Varepriser</Link>}>
          <ActionForm action={savePriceGroup}>
            <input type="hidden" name="id" value={g.id} />
            <div className="grid gap-3 md:grid-cols-3">
              <TextInput label="Navn" name="name" defaultValue={g.name} />
              <TextInput label="Generell rabatt %" name="discount_percent" defaultValue={String(g.discount_percent)} />
              <TextInput label="Beskrivelse" name="description" defaultValue={g.description ?? ""} />
            </div>
            <Check label="Aktiv" name="is_active" defaultChecked={g.is_active} />
            <p className="text-xs text-muted-foreground">
              {(g.companies as { count: number }[])[0]?.count ?? 0} bedrifter · {(g.price_group_prices as { count: number }[])[0]?.count ?? 0} egne varepriser
            </p>
          </ActionForm>
        </Panel>
      ))}
      <Panel title="Ny prisgruppe">
        <ActionForm action={savePriceGroup} submitLabel="Opprett">
          <div className="grid gap-3 md:grid-cols-3">
            <TextInput label="Navn" name="name" placeholder="F.eks. Kunstskoler" required />
            <TextInput label="Generell rabatt %" name="discount_percent" defaultValue="0" />
            <TextInput label="Beskrivelse" name="description" />
          </div>
          <Check label="Aktiv" name="is_active" defaultChecked />
        </ActionForm>
      </Panel>
    </div>
  );
}
