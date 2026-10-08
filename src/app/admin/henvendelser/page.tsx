import { PageHeader, Empty } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { setContactStatus } from "../_actions/orders";

export const metadata = { title: "Henvendelser" };

export default async function AdminContact() {
  const supabase = await createClient();
  const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200);
  return (
    <div>
      <PageHeader title="Henvendelser" description="Meldinger fra kontaktskjemaet. Svar kunden direkte på e-post." />
      {!data?.length && <Empty>Ingen henvendelser.</Empty>}
      <div className="space-y-3">
        {data?.map((m) => (
          <div key={m.id} className="rounded-lg border bg-white p-4 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <strong>{m.subject}</strong>
              <Badge variant={m.status === "new" ? "warning" : m.status === "open" ? "info" : "secondary"}>{m.status === "new" ? "Ny" : m.status === "open" ? "Under arbeid" : "Lukket"}</Badge>
              <span>
                {m.name} – <a href={`mailto:${m.email}`} className="underline">{m.email}</a>
              </span>
              {m.order_number && <span>Ordre {m.order_number}</span>}
              <span className="text-muted-foreground">{formatDate(m.created_at, true)}</span>
            </div>
            <p className="mt-2 whitespace-pre-line">{m.message}</p>
            <div className="mt-3 flex gap-2">
              {(["open", "closed"] as const).map((s) => (
                <form key={s} action={setContactStatus}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="status" value={s} />
                  <button className="rounded border px-2 py-1 text-xs hover:bg-secondary">{s === "open" ? "Under arbeid" : "Lukk"}</button>
                </form>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
