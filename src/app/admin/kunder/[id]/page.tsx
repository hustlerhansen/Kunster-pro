import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Panel, StatCard } from "@/components/admin/ui";
import { ActionForm, Check, Select } from "@/components/admin/form-controls";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/money";
import { ORDER_STATUS } from "@/lib/order-status";
import { formatDate } from "@/lib/utils";
import { updateCustomer } from "../../_actions/orders";

export const metadata = { title: "Kunde" };

export default async function AdminCustomer({ params }: PageProps<"/admin/kunder/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: profile }, { data: orders }, { data: addresses }, { data: companies }] = await Promise.all([
    supabase.from("profiles").select("*, company:companies(id, name, org_number)").eq("id", id).maybeSingle(),
    supabase.from("orders").select("id, order_number, status, payment_status, total_ore, created_at").eq("user_id", id).order("created_at", { ascending: false }),
    supabase.from("addresses").select("*").eq("user_id", id),
    supabase.from("companies").select("id, name, org_number").order("name"),
  ]);
  if (!profile) notFound();
  const paid = (orders ?? []).filter((o) => ["paid", "invoiced"].includes(o.payment_status) && o.status !== "refunded");
  const total = paid.reduce((s, o) => s + o.total_ore, 0);
  return (
    <div className="space-y-6">
      <PageHeader title={profile.full_name ?? profile.email} description={`${profile.email} · ${profile.phone ?? ""} · registrert ${formatDate(profile.created_at)}`} />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Kjøp (betalte ordre)" value={paid.length} />
        <StatCard label="Total kjøpssum" value={formatPrice(total)} />
        <StatCard label="Gj.snittlig ordre" value={formatPrice(paid.length ? Math.round(total / paid.length) : 0)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Kjøpshistorikk">
          <ul className="divide-y text-sm">
            {(orders ?? []).map((o) => (
              <li key={o.id} className="flex justify-between gap-3 py-2">
                <Link href={`/admin/ordrer/${o.id}`} className="underline">#{o.order_number}</Link>
                <span>{formatDate(o.created_at)}</span>
                <Badge variant={ORDER_STATUS[o.status]?.variant}>{ORDER_STATUS[o.status]?.label}</Badge>
                <span>{formatPrice(o.total_ore)}</span>
              </li>
            ))}
            {!orders?.length && <li className="py-4 text-muted-foreground">Ingen ordre.</li>}
          </ul>
        </Panel>
        <Panel title="Tilgang og bedrift (kun administrator)">
          <ActionForm action={updateCustomer} submitLabel="Lagre">
            <input type="hidden" name="user_id" value={profile.id} />
            <Select label="Rolle" name="role" defaultValue={profile.role} options={[{ value: "customer", label: "Kunde" }, { value: "staff", label: "Ansatt (admin uten innstillinger/kreditt)" }, { value: "admin", label: "Administrator" }]} />
            <Select label="Tilknyttet bedrift" name="company_id" defaultValue={profile.company_id ?? ""} options={[{ value: "", label: "– Ingen (privatkunde) –" }, ...(companies ?? []).map((c) => ({ value: c.id, label: `${c.name} (${c.org_number})` }))]} />
            <Check label="Sperret konto" name="is_blocked" defaultChecked={profile.is_blocked} />
          </ActionForm>
          <div className="mt-4 text-sm">
            <p className="font-medium">Adresser</p>
            {(addresses ?? []).map((a) => (
              <p key={a.id} className="text-muted-foreground">
                {a.full_name}, {a.line1}, {a.postal_code} {a.city}
              </p>
            ))}
            <p className="mt-2">Markedsføringssamtykke: {profile.marketing_consent ? `Ja (${profile.marketing_consent_at ? formatDate(profile.marketing_consent_at) : ""})` : "Nei"}</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
