import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { ORDER_STATUS } from "@/lib/order-status";
import { formatDate } from "@/lib/utils";
import { ReorderButton } from "@/components/shop/reorder-button";

export default async function AccountOverview() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const [{ data: orders }, { count: favCount }, { count: addrCount }] = await Promise.all([
    supabase.from("orders").select("id, order_number, status, total_ore, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("favorites").select("product_id", { count: "exact", head: true }),
    supabase.from("addresses").select("id", { count: "exact", head: true }),
  ]);
  const last = orders?.find((o) => o.status !== "cancelled" && o.status !== "pending_payment");
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Bestillinger" value={String(orders?.length ?? 0)} href="/konto/bestillinger" />
        <Stat label="Favoritter" value={String(favCount ?? 0)} href="/konto/favoritter" />
        <Stat label="Lagrede adresser" value={String(addrCount ?? 0)} href="/konto/adresser" />
      </div>
      {last && (
        <Card className="border-gold/40 bg-gold-light/30">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-5">
            <div>
              <p className="font-semibold">Siste ordre: #{last.order_number}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(last.created_at)} · {formatPrice(last.total_ore)}
              </p>
            </div>
            <ReorderButton orderId={last.id} />
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Siste bestillinger</CardTitle>
        </CardHeader>
        <CardContent>
          {orders?.length ? (
            <ul className="divide-y">
              {orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <Link href={`/konto/bestillinger/${o.id}`} className="font-medium hover:underline">
                    Ordre #{o.order_number}
                  </Link>
                  <span className="text-muted-foreground">{formatDate(o.created_at)}</span>
                  <Badge variant={ORDER_STATUS[o.status]?.variant}>{ORDER_STATUS[o.status]?.label ?? o.status}</Badge>
                  <span className="font-medium">{formatPrice(o.total_ore)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Du har ingen bestillinger ennå. <Link href="/produkter" className="underline">Se sortimentet</Link>.
            </p>
          )}
        </CardContent>
      </Card>
      {profile?.customer_type !== "business" && (
        <p className="text-sm text-muted-foreground">
          Handler du for atelier, skole eller bedrift? <Link href="/handlekonto" className="underline">Søk om handlekonto</Link>.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link href={href} className="rounded-lg border bg-white p-5 transition-shadow hover:shadow-md">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold">{value}</p>
    </Link>
  );
}
