import { PageHeader } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Hendelseslogg" };

export default async function AdminAuditLog() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: logs }, { data: emails }] = await Promise.all([
    supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("email_log").select("*").order("created_at", { ascending: false }).limit(50),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Hendelseslogg" description="Kritiske hendelser: admin-endringer, betaling, kreditt, kontosletting og dataeksport." />
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-xs">
          <thead className="bg-secondary/50 text-left">
            <tr>
              <th className="p-2">Tid</th>
              <th className="p-2">Handling</th>
              <th className="p-2">Utført av</th>
              <th className="p-2">Objekt</th>
              <th className="p-2">Detaljer</th>
              <th className="p-2">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs?.map((l) => (
              <tr key={l.id}>
                <td className="p-2 whitespace-nowrap">{formatDate(l.created_at, true)}</td>
                <td className="p-2 font-medium">{l.action}</td>
                <td className="p-2">{l.actor_email ?? l.actor_id ?? "system"}</td>
                <td className="p-2">{l.entity_type} {l.entity_id?.slice(0, 8)}</td>
                <td className="max-w-md truncate p-2 font-mono">{JSON.stringify(l.details)}</td>
                <td className="p-2">{l.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="font-sans text-lg font-semibold">E-postlogg</h2>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-xs">
          <tbody className="divide-y">
            {emails?.map((e) => (
              <tr key={e.id}>
                <td className="p-2 whitespace-nowrap">{formatDate(e.created_at, true)}</td>
                <td className="p-2">{e.template}</td>
                <td className="p-2">{e.to_email}</td>
                <td className="p-2">{e.subject}</td>
                <td className="p-2">{e.status}</td>
                <td className="p-2 text-destructive">{e.error}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
