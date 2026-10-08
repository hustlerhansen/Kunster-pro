import { NextResponse } from "next/server";
import { integrations, siteUrl } from "@/lib/env";
import { isAuthorizedCron } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { emails } from "@/lib/email/templates";

/**
 * Påminnelse om forlatt handlekurv. Sendes KUN til innloggede kunder som har gitt
 * markedsføringssamtykke (markedsføringsloven § 15), én gang per handlekurv, etter 3 timer.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  if (!integrations.supabaseAdmin()) return NextResponse.json({ skipped: "database ikke konfigurert" });
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
  const oldest = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { data: carts } = await admin
    .from("abandoned_carts")
    .select("id, user_id, email, items, updated_at")
    .is("reminder_sent_at", null)
    .is("recovered_at", null)
    .lt("updated_at", cutoff)
    .gt("updated_at", oldest)
    .limit(100);

  const userIds = (carts ?? []).map((c) => c.user_id);
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, full_name, marketing_consent").in("id", userIds)
    : { data: [] };
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  let sent = 0;
  for (const raw of (carts ?? []) as { id: string; user_id: string; email: string; items: { name: string; quantity: number }[] }[]) {
    const cart = { ...raw, profile: byId.get(raw.user_id) };
    if (!cart.profile?.marketing_consent || !cart.items?.length) continue;
    const { data: sub } = await admin.from("newsletter_subscribers").select("unsubscribe_token").eq("email", cart.email).maybeSingle();
    await sendEmail({
      to: cart.email,
      template: "abandoned_cart",
      email: emails.abandonedCart({
        name: cart.profile.full_name?.split(" ")[0] ?? null,
        items: cart.items.slice(0, 10),
        unsubscribeUrl: sub ? `${siteUrl}/nyhetsbrev/avmeld?token=${sub.unsubscribe_token}` : `${siteUrl}/konto/innstillinger`,
      }),
    });
    await admin.from("abandoned_carts").update({ reminder_sent_at: new Date().toISOString() }).eq("id", cart.id);
    sent++;
  }
  return NextResponse.json({ sent });
}
