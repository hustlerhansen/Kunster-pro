import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { RETURN_STATUS } from "@/lib/order-status";
import { formatDate } from "@/lib/utils";
import { formatPrice } from "@/lib/money";

export default async function ReturnsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("returns")
    .select("id, return_number, type, status, reason, refund_amount_ore, created_at, order:orders(id, order_number)")
    .order("created_at", { ascending: false });
  const returns = (data ?? []) as unknown as { id: string; return_number: number; type: string; status: string; reason: string; refund_amount_ore: number | null; created_at: string; order: { id: string; order_number: number } | null }[];
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Returer</h2>
      <p className="text-sm text-muted-foreground">
        For å returnere en vare, åpne bestillingen under <Link href="/konto/bestillinger" className="underline">Mine bestillinger</Link> og velg «Angrerett eller reklamasjon». Les mer om{" "}
        <Link href="/retur-og-reklamasjon" className="underline">retur og reklamasjon</Link>.
      </p>
      {returns.length ? (
        <ul className="divide-y rounded-lg border bg-white">
          {returns.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="font-medium">
                Retur #{r.return_number} · {r.type === "withdrawal" ? "Angrerett" : "Reklamasjon"}
              </span>
              {r.order && (
                <Link href={`/konto/bestillinger/${r.order.id}`} className="hover:underline">
                  Ordre #{r.order.order_number}
                </Link>
              )}
              <span className="text-muted-foreground">{formatDate(r.created_at)}</span>
              <Badge variant={RETURN_STATUS[r.status]?.variant}>{RETURN_STATUS[r.status]?.label}</Badge>
              {r.refund_amount_ore !== null && <span>Refusjon: {formatPrice(r.refund_amount_ore)}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">Ingen returer registrert.</p>
      )}
    </div>
  );
}
