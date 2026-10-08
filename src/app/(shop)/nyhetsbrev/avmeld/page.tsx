import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { integrations } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Meld av nyhetsbrev", robots: { index: false } };
export const dynamic = "force-dynamic";

async function unsubscribe(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(token) || !integrations.supabaseAdmin()) return;
  const admin = createAdminClient();
  const { data } = await admin
    .from("newsletter_subscribers")
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .eq("unsubscribe_token", token)
    .select("email");
  // Trekk også tilbake markedsføringssamtykket på kundekontoen
  if (data?.[0]?.email) await admin.from("profiles").update({ marketing_consent: false, marketing_consent_at: null }).eq("email", data[0].email);
  redirect("/nyhetsbrev/avmeld?ferdig=1");
}

export default async function Unsubscribe({ searchParams }: PageProps<"/nyhetsbrev/avmeld">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  return (
    <div className="container-page max-w-xl py-20 text-center">
      {sp.ferdig ? (
        <>
          <h1 className="text-3xl font-semibold">Du er meldt av</h1>
          <p className="mt-4 text-muted-foreground">Du vil ikke lenger motta nyhetsbrev eller markedsføring på e-post fra oss.</p>
        </>
      ) : token ? (
        <>
          <h1 className="text-3xl font-semibold">Meld av nyhetsbrevet?</h1>
          <form action={unsubscribe} className="mt-6">
            <input type="hidden" name="token" value={token} />
            <Button>Ja, meld meg av</Button>
          </form>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-semibold">Meld av nyhetsbrevet</h1>
          <p className="mt-4 text-muted-foreground">
            Bruk lenken i e-posten du har mottatt, eller endre samtykke under <Link href="/konto/innstillinger" className="underline">Kontoinnstillinger</Link>.
          </p>
        </>
      )}
    </div>
  );
}
