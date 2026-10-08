import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddressForm, type AddressRow } from "@/components/shop/address-form";
import { createClient } from "@/lib/supabase/server";
import { deleteAddress } from "@/app/actions/account";

export default async function AddressesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("addresses").select("*").order("is_default", { ascending: false }).order("created_at");
  const addresses = (data ?? []) as AddressRow[];
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Leveringsadresser</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {addresses.map((a) => (
          <Card key={a.id}>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{a.label || "Adresse"}</CardTitle>
              {a.is_default && <Badge variant="gold">Standard</Badge>}
            </CardHeader>
            <CardContent className="space-y-4">
              <details>
                <summary className="cursor-pointer text-sm">
                  {a.full_name}, {a.line1}, {a.postal_code} {a.city}
                </summary>
                <div className="mt-4">
                  <AddressForm address={a} />
                </div>
              </details>
              <form action={deleteAddress}>
                <input type="hidden" name="id" value={a.id} />
                <Button variant="ghost" size="sm" className="text-destructive">
                  Slett
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Ny adresse</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressForm />
        </CardContent>
      </Card>
    </div>
  );
}
