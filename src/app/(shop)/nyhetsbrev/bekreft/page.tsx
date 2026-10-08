import type { Metadata } from "next";
import Link from "next/link";
import { integrations } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Bekreft nyhetsbrev", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ConfirmNewsletter({ searchParams }: PageProps<"/nyhetsbrev/bekreft">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  let ok = false;
  if (/^[0-9a-f-]{36}$/i.test(token) && integrations.supabaseAdmin()) {
    const { data } = await createAdminClient()
      .from("newsletter_subscribers")
      .update({ status: "subscribed", confirmed_at: new Date().toISOString(), confirm_token: null, unsubscribed_at: null })
      .eq("confirm_token", token)
      .select("id");
    ok = Boolean(data?.length);
  }
  return (
    <div className="container-page max-w-xl py-20 text-center">
      <h1 className="text-3xl font-semibold">{ok ? "Takk – du er påmeldt!" : "Lenken er ugyldig eller allerede brukt"}</h1>
      <p className="mt-4 text-muted-foreground">{ok ? "Du vil nå motta nyhetsbrev fra Kunstner Pro. Du kan melde deg av når som helst via lenken i e-postene." : "Har du allerede bekreftet, er du påmeldt."}</p>
      <Link href="/" className="mt-8 inline-block underline">
        Til forsiden
      </Link>
    </div>
  );
}
