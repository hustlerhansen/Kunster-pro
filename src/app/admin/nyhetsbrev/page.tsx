import { PageHeader, Panel, StatCard, Empty } from "@/components/admin/ui";
import { ActionForm, TextArea, TextInput } from "@/components/admin/form-controls";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { integrations } from "@/lib/env";
import { formatDate } from "@/lib/utils";
import { saveEmailCampaign, sendEmailCampaign } from "../_actions/content";

export const metadata = { title: "Nyhetsbrev" };

export default async function AdminNewsletter() {
  const supabase = await createClient();
  const [{ count: subscribed }, { count: pending }, { count: unsub }, { data: campaigns }, { data: latest }] = await Promise.all([
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "subscribed"),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "unsubscribed"),
    supabase.from("email_campaigns").select("*").order("created_at", { ascending: false }),
    supabase.from("newsletter_subscribers").select("email, status, consent_source, created_at, confirmed_at").order("created_at", { ascending: false }).limit(20),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Nyhetsbrev og e-postkampanjer" description="Kun abonnenter med bekreftet samtykke (dobbel opt-in) mottar kampanjer. Alle e-poster har avmeldingslenke." />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Aktive abonnenter" value={subscribed ?? 0} />
        <StatCard label="Venter på bekreftelse" value={pending ?? 0} />
        <StatCard label="Avmeldt" value={unsub ?? 0} />
      </div>
      {!integrations.resend() && <p className="text-sm text-warning">Resend er ikke konfigurert – e-post kan ikke sendes.</p>}
      <Panel title="Kampanjer">
        <div className="space-y-3">
          {campaigns?.map((c) => (
            <details key={c.id} className="rounded-md border">
              <summary className="flex cursor-pointer flex-wrap gap-4 px-4 py-2 text-sm">
                <strong>{c.subject}</strong>
                <Badge variant={c.status === "sent" ? "success" : "outline"}>{c.status === "sent" ? `Sendt ${c.sent_at ? formatDate(c.sent_at) : ""} til ${c.sent_count}` : "Utkast"}</Badge>
              </summary>
              <div className="space-y-4 border-t p-4">
                {c.status === "draft" ? (
                  <>
                    <ActionForm action={saveEmailCampaign}>
                      <input type="hidden" name="id" value={c.id} />
                      <TextInput label="Emne" name="subject" defaultValue={c.subject} />
                      <TextInput label="Forhåndstekst" name="preheader" defaultValue={c.preheader ?? ""} />
                      <TextArea label="Innhold (enkel markdown: **fet**, [lenke](/sti), # overskrift)" name="body_markdown" defaultValue={c.body_markdown} rows={8} />
                    </ActionForm>
                    <div className="flex flex-wrap gap-3">
                      <ActionForm action={sendEmailCampaign} submitLabel="Send test til meg" submitVariant="outline">
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="test" value="1" />
                      </ActionForm>
                      <ActionForm action={sendEmailCampaign} submitLabel={`Send til ${subscribed ?? 0} abonnenter`} submitVariant="gold">
                        <input type="hidden" name="id" value={c.id} />
                      </ActionForm>
                    </div>
                  </>
                ) : (
                  <pre className="text-xs whitespace-pre-wrap">{c.body_markdown}</pre>
                )}
              </div>
            </details>
          ))}
          {!campaigns?.length && <Empty>Ingen kampanjer ennå.</Empty>}
        </div>
        <details className="mt-4 rounded-md border border-dashed">
          <summary className="cursor-pointer px-4 py-2 text-sm font-medium">+ Ny kampanje</summary>
          <div className="border-t p-4">
            <ActionForm action={saveEmailCampaign} submitLabel="Lagre utkast">
              <TextInput label="Emne" name="subject" required />
              <TextInput label="Forhåndstekst" name="preheader" />
              <TextArea label="Innhold" name="body_markdown" rows={8} required />
            </ActionForm>
          </div>
        </details>
      </Panel>
      <Panel title="Siste påmeldinger">
        <ul className="divide-y text-sm">
          {latest?.map((s) => (
            <li key={s.email} className="flex flex-wrap gap-4 py-1.5">
              <span className="w-64">{s.email}</span>
              <Badge variant={s.status === "subscribed" ? "success" : s.status === "pending" ? "warning" : "secondary"}>{s.status}</Badge>
              <span className="text-muted-foreground">Kilde: {s.consent_source}</span>
              <span className="text-muted-foreground">{formatDate(s.created_at)}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
