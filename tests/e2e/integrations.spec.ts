/**
 * Integrasjonstester mot lokale etterligninger av Stripe, Resend og Enhetsregisteret
 * (tests/mocks/services.mjs). Verifiserer vår egen kode mot disse tjenestene uten ekte nøkler.
 * Selve leverandørene er IKKE testet (se docs/RAPPORT.md).
 *
 * Krever: node tests/mocks/services.mjs, appen startet med BRREG_API_URL, STRIPE_API_URL,
 * RESEND_BASE_URL (se .env.example) og E2E_FULLSTACK=1.
 */
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { acceptCookies, login, MOCK, mockEmails } from "./helpers";

function loadEnv(): Record<string, string> {
  try {
    return Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
  } catch {
    return {};
  }
}
const env = { ...loadEnv(), ...process.env } as Record<string, string>;
test.skip(!process.env.E2E_FULLSTACK, "Krever E2E_FULLSTACK=1");

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL ?? "http://x", env.SUPABASE_SERVICE_ROLE_KEY ?? "x", { auth: { persistSession: false } });
const stamp = Date.now();
const PASSWORD = "Malerpensel2026";

async function createUser(email: string, opts: { role?: "admin"; name?: string } = {}) {
  const { data } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  await admin.from("profiles").update({ full_name: opts.name ?? "Test Bruker", phone: "91234567", ...(opts.role ? { role: opts.role } : {}) }).eq("id", data.user!.id);
  await admin.from("addresses").insert({ user_id: data.user!.id, full_name: opts.name ?? "Test Bruker", line1: "Storgata 1", postal_code: "0155", city: "Oslo", phone: "91234567", is_default: true });
  return data.user!.id;
}

function signedWebhook(event: object) {
  const payload = JSON.stringify(event);
  return { payload, signature: Stripe.webhooks.generateTestHeaderString({ payload, secret: env.STRIPE_WEBHOOK_SECRET }) };
}

const adminEmail = `admin.int.${stamp}@test.no`;

test.describe.serial("Integrasjoner (mock)", () => {
  test.beforeAll(async () => {
    await admin.from("rate_limits").delete().neq("key", "");
    await fetch(`${MOCK}/__reset`, { method: "POST" });
    await admin.from("credit_applications").delete().eq("org_number", "914778271");
    const { data: old } = await admin.from("companies").select("id").eq("org_number", "914778271").maybeSingle();
    if (old) {
      await admin.from("invoices").delete().eq("company_id", old.id); // fakturaer har ON DELETE RESTRICT mot bedrift
      await admin.from("companies").delete().eq("id", old.id);
    }
    await createUser(adminEmail, { role: "admin", name: "Admin Test" });
  });

  test("Enhetsregisteret: ukjent og konkurs-rammet org.nr. avvises, aktiv virksomhet verifiseres", async ({ page }) => {
    const email = `brreg.${stamp}@test.no`;
    await createUser(email);
    await login(page, email, PASSWORD, "/bedrift");
    const fill = async (org: string) => {
      await page.goto("/bedrift");
      await page.locator('main [name="company_name"]').fill("Test Atelier AS");
      await page.locator('main [name="org_number"]').fill(org);
      await page.locator('main [name="contact_name"]').fill("Test Bruker");
      await page.locator('main [name="email"]').fill(email);
      await page.locator('main [name="phone"]').fill("91234567");
      await page.locator('main [name="billing_line1"]').fill("Atelierveien 2");
      await page.locator('main [name="billing_postal_code"]').fill("0150");
      await page.locator('main [name="billing_city"]').fill("Oslo");
      await page.getByRole("button", { name: "Registrer bedriftskonto" }).click();
    };
    await fill("974760681"); // gyldig kontrollsiffer, finnes ikke i registeret
    await expect(page.getByText(/finnes ikke i Enhetsregisteret/).first()).toBeVisible();
    await fill("923456783");
    await expect(page.getByText(/slettet, under avvikling eller konkurs/).first()).toBeVisible();
    await fill("914778271");
    await expect(page.getByText(/Bedriftskontoen er registrert/)).toBeVisible();
    const { data: company } = await admin.from("companies").select("brreg_status, brreg_name").eq("org_number", "914778271").single();
    expect(company).toEqual({ brreg_status: "verified", brreg_name: "AKTIV KUNSTSKOLE AS" });
  });

  test("kortbetaling: Stripe-økt opprettes med riktige beløp, ordre venter, webhook bekrefter, e-post sendes", async ({ page, request }) => {
    const email = `stripe.${stamp}@test.no`;
    const userId = await createUser(email);
    const { data: before } = await admin.from("product_variants").select("stock_on_hand, stock_reserved").eq("sku", "KP-OLJ-ULTRAMARIN-37").single();
    await login(page, email, PASSWORD, "/produkt/ultramarinbla");
    await page.getByTestId("variant-option").filter({ hasText: "37 ml" }).click();
    await page.locator("main").getByRole("spinbutton", { name: "Antall" }).fill("2");
    await page.getByTestId("add-to-cart").click();
    await page.goto("/kasse");
    await expect(page.getByTestId("order-total")).toBeVisible();
    await page.getByTestId("accept-terms").check();
    await page.getByTestId("place-order").click();
    await page.waitForURL(/localhost:4010\/pay\/cs_test_mock_/, { timeout: 30_000 });
    const sessionId = page.url().split("/pay/")[1];

    const { data: order } = await admin.from("orders").select("*").eq("user_id", userId).single();
    expect(order.status).toBe("pending_payment");
    expect(order.payment_status).toBe("pending");
    expect(order.payment_reference).toBe(sessionId);
    const { data: during } = await admin.from("product_variants").select("stock_on_hand, stock_reserved").eq("sku", "KP-OLJ-ULTRAMARIN-37").single();
    expect(during!.stock_reserved).toBe(before!.stock_reserved + 2);
    expect(during!.stock_on_hand).toBe(before!.stock_on_hand);

    // Beløpene vi sender til Stripe skal summere til nøyaktig ordretotalen
    const calls = (await (await fetch(`${MOCK}/__stripe`)).json()) as { path: string; body: Record<string, string> }[];
    const checkout = calls.filter((c) => c.path === "/v1/checkout/sessions").at(-1)!;
    const amounts = Object.entries(checkout.body).filter(([k]) => /line_items\[\d+\]\[price_data\]\[unit_amount\]/.test(k)).map(([, v]) => Number(v));
    expect(amounts.reduce((a, b) => a + b, 0)).toBe(order.total_ore);
    expect(checkout.body["metadata[order_id]"]).toBe(order.id);
    expect(checkout.body.currency).toBe("nok");

    // Før webhook: ordren er IKKE betalt, selv om kunden lander på bekreftelsessiden
    await page.goto(`/kasse/bekreftelse?ordre=${order.id}&session_id=${sessionId}`);
    await expect(page.getByRole("heading", { name: /venter på bekreftelse/ })).toBeVisible();
    expect((await admin.from("orders").select("payment_status").eq("id", order.id).single()).data!.payment_status).toBe("pending");

    const { payload, signature } = signedWebhook({
      id: `evt_int_${stamp}`, object: "event", type: "checkout.session.completed",
      data: { object: { id: sessionId, object: "checkout.session", payment_status: "paid", amount_total: order.total_ore, payment_intent: `pi_int_${stamp}`, metadata: { order_id: order.id }, client_reference_id: order.id } },
    });
    const res = await request.post("/api/webhooks/stripe", { data: payload, headers: { "stripe-signature": signature, "content-type": "application/json" } });
    expect(res.status()).toBe(200);
    const { data: paid } = await admin.from("orders").select("status, payment_status").eq("id", order.id).single();
    expect(paid).toEqual({ status: "paid", payment_status: "paid" });
    const { data: after } = await admin.from("product_variants").select("stock_on_hand, stock_reserved").eq("sku", "KP-OLJ-ULTRAMARIN-37").single();
    expect(after!.stock_on_hand).toBe(before!.stock_on_hand - 2);
    expect(after!.stock_reserved).toBe(before!.stock_reserved);

    const mails = await mockEmails();
    const confirmation = mails.find((m) => m.subject.startsWith("Ordrebekreftelse") && String(m.to).includes(email));
    expect(confirmation, "ordrebekreftelse sendt via Resend").toBeTruthy();
    expect(confirmation!.html).toContain("Oljemaling Ultramarinblå");

    await page.goto(`/kasse/bekreftelse?ordre=${order.id}`);
    await expect(page.getByRole("heading", { name: "Takk for bestillingen!" })).toBeVisible();

    // Refusjon via Stripe (administrator)
    await login(page, adminEmail, PASSWORD, "/admin");
    await page.goto(`/admin/ordrer/${order.id}`);
    await page.getByRole("button", { name: "Refunder via Stripe" }).click();
    await expect(page.getByText(/Refusjonen er sendt til Stripe/).first()).toBeVisible();
    const after2 = (await (await fetch(`${MOCK}/__stripe`)).json()) as { path: string; body: Record<string, string> }[];
    const refund = after2.find((c) => c.path === "/v1/refunds");
    expect(refund?.body.payment_intent).toBe(`pi_int_${stamp}`);
  });

  test("utløpt Stripe-økt frigjør reservert lager", async ({ request }) => {
    const { data: variant } = await admin.from("product_variants").select("id, price_ore, stock_reserved").eq("sku", "KP-OLJ-GULOKER-37").single();
    const { data: created } = await admin.rpc("create_order", {
      payload: {
        email: `expire.${stamp}@test.no`, customer_name: "Utløpt", payment_method: "card", payment_provider: "stripe",
        subtotal_ore: variant!.price_ore * 3, discount_ore: 0, shipping_ore: 0, total_ore: variant!.price_ore * 3, vat_ore: 0, shipping_address: {},
        items: [{ variant_id: variant!.id, quantity: 3, unit_price_ore: variant!.price_ore }],
      },
    });
    expect(created, "create_order").not.toBeNull();
    const orderId = created[0].order_id as string;
    expect((await admin.from("product_variants").select("stock_reserved").eq("id", variant!.id).single()).data!.stock_reserved).toBe(variant!.stock_reserved + 3);
    const { payload, signature } = signedWebhook({
      id: `evt_exp_${stamp}`, object: "event", type: "checkout.session.expired",
      data: { object: { id: "cs_exp", object: "checkout.session", payment_status: "unpaid", metadata: { order_id: orderId } } },
    });
    const res = await request.post("/api/webhooks/stripe", { data: payload, headers: { "stripe-signature": signature, "content-type": "application/json" } });
    expect(res.status()).toBe(200);
    expect((await admin.from("product_variants").select("stock_reserved").eq("id", variant!.id).single()).data!.stock_reserved).toBe(variant!.stock_reserved);
    expect((await admin.from("orders").select("status").eq("id", orderId).single()).data!.status).toBe("cancelled");
  });

  test("passordtilbakestilling: e-post med lenke, nytt passord, innlogging", async ({ page }) => {
    const email = `reset.${stamp}@test.no`;
    await createUser(email);
    await page.goto("/glemt-passord");
    await acceptCookies(page);
    await page.locator('main [name="email"]').fill(email);
    await page.getByRole("button", { name: "Send lenke" }).click();
    await expect(page.getByText(/har vi sendt en e-post/)).toBeVisible();
    const mail = (await mockEmails()).filter((m) => m.subject === "Tilbakestill passordet ditt" && String(m.to).includes(email)).at(-1);
    expect(mail, "tilbakestillings-e-post sendt").toBeTruthy();
    const link = /href="([^"]*auth\/confirm[^"]*)"/.exec(mail!.html)![1].replace(/&amp;/g, "&");
    await page.goto(link);
    await page.waitForURL("**/tilbakestill-passord");
    await page.locator('main [name="password"]').fill("NyttPassord2026");
    await page.locator('main [name="password_confirm"]').fill("NyttPassord2026");
    await page.getByRole("button", { name: "Lagre nytt passord" }).click();
    await expect(page.getByText("Passordet er oppdatert.")).toBeVisible();
    // Lenken kan ikke brukes to ganger
    await page.context().clearCookies();
    await page.goto(link);
    await page.waitForURL(/logg-inn\?feil=lenke/);
    await login(page, email, "NyttPassord2026");
  });

  test("kontosletting: konto fjernes, ordre anonymiseres, åpne ordre blokkerer", async ({ page }) => {
    const email = `slett.${stamp}@test.no`;
    const userId = await createUser(email);
    const { data: variant } = await admin.from("product_variants").select("id, price_ore").eq("sku", "KP-OLJ-GULOKER-60").single();
    const mk = async () => {
      const { data } = await admin.rpc("create_order", {
        payload: {
          user_id: userId, email, customer_name: "Slett Meg", payment_method: "card", payment_provider: "stripe",
          subtotal_ore: variant!.price_ore, discount_ore: 0, shipping_ore: 0, total_ore: variant!.price_ore, vat_ore: 0, shipping_address: {},
          items: [{ variant_id: variant!.id, quantity: 1, unit_price_ore: variant!.price_ore }],
        },
      });
      return data[0].order_id as string;
    };
    const paidOrder = await mk();
    await admin.rpc("confirm_order_payment", { p_order_id: paidOrder, p_provider: "stripe", p_reference: "x", p_payment_intent: "y", p_amount_ore: variant!.price_ore });
    await login(page, email, PASSWORD, "/konto/innstillinger");
    await page.locator('main [name="confirm"]').fill("SLETT");
    await page.getByRole("button", { name: "Slett kontoen min" }).click();
    await expect(page.getByText(/ikke er levert ennå/)).toBeVisible();
    await admin.from("orders").update({ status: "delivered" }).eq("id", paidOrder);
    await page.locator('main [name="confirm"]').fill("SLETT"); // React nullstiller skjemaet etter en handling
    await page.getByRole("button", { name: "Slett kontoen min" }).click();
    await page.waitForURL("**/?konto=slettet");
    const { data: gone } = await admin.auth.admin.getUserById(userId);
    expect(gone.user).toBeNull();
    const { data: order } = await admin.from("orders").select("email, customer_name, user_id").eq("id", paidOrder).single();
    expect(order).toEqual({ email: expect.stringContaining("anonymisert.invalid"), customer_name: "Slettet kunde", user_id: null });
  });

  test("nyhetsbrev: påmelding med dobbel bekreftelse og avmelding", async ({ page }) => {
    const email = `nyhet.${stamp}@test.no`;
    await page.goto("/");
    await acceptCookies(page);
    await page.locator("#nl-footer").fill(email);
    await page.locator('footer input[name="consent"]').check();
    await page.getByRole("button", { name: "Meld meg på" }).click();
    await expect(page.getByText(/bekreft påmeldingen/)).toBeVisible();
    expect((await admin.from("newsletter_subscribers").select("status").eq("email", email).single()).data!.status).toBe("pending");
    const mail = (await mockEmails()).filter((m) => m.subject.startsWith("Bekreft påmelding") && String(m.to).includes(email)).at(-1)!;
    await page.goto(/href="([^"]*nyhetsbrev\/bekreft[^"]*)"/.exec(mail.html)![1].replace(/&amp;/g, "&"));
    await expect(page.getByRole("heading", { name: "Takk – du er påmeldt!" })).toBeVisible();
    const { data: sub } = await admin.from("newsletter_subscribers").select("status, unsubscribe_token").eq("email", email).single();
    expect(sub!.status).toBe("subscribed");
    await page.goto(`/nyhetsbrev/avmeld?token=${sub!.unsubscribe_token}`);
    await page.getByRole("button", { name: "Ja, meld meg av" }).click();
    await expect(page.getByRole("heading", { name: "Du er meldt av" })).toBeVisible();
    expect((await admin.from("newsletter_subscribers").select("status").eq("email", email).single()).data!.status).toBe("unsubscribed");
  });

  test("e-postkampanje sendes kun til bekreftede abonnenter, med avmeldingslenke", async ({ page }) => {
    await admin.from("newsletter_subscribers").delete().neq("email", "");
    const mk = (e: string, status: string) => ({ email: e, status, consent_text: "test", consent_source: "test", ...(status === "subscribed" ? { confirmed_at: new Date().toISOString() } : {}) });
    await admin.from("newsletter_subscribers").insert([mk(`a.${stamp}@test.no`, "subscribed"), mk(`b.${stamp}@test.no`, "subscribed"), mk(`pending.${stamp}@test.no`, "pending"), mk(`ut.${stamp}@test.no`, "unsubscribed")]);
    await login(page, adminEmail, PASSWORD, "/admin/nyhetsbrev");
    const subject = `Høstkampanje ${stamp}`;
    const draft = page.locator("details", { hasText: "+ Ny kampanje" });
    await draft.locator("summary").click();
    await draft.locator('[name="subject"]').fill(subject);
    await draft.locator('[name="body_markdown"]').fill("Hei! **Nye** lerret er på lager.\n\nSe [lerret](/lerret).");
    await draft.getByRole("button", { name: "Lagre utkast" }).click();
    await expect(page.getByText("Kampanjen er lagret som utkast.").first()).toBeVisible();
    await page.reload();
    const campaign = page.locator("details", { hasText: subject });
    await campaign.locator("summary").click();
    await campaign.getByRole("button", { name: "Send test til meg" }).click();
    await expect.poll(async () => (await mockEmails()).some((m) => m.subject === `[TEST] ${subject}`), { timeout: 15_000 }).toBe(true);
    await campaign.getByRole("button", { name: /Send til 2 abonnenter/ }).click();
    await expect.poll(async () => (await mockEmails()).filter((m) => m.subject === subject).length, { timeout: 20_000 }).toBe(2);
    const sent = (await mockEmails()).filter((m) => m.subject === subject);
    expect(sent.map((m) => String(m.to)).sort()).toEqual([`a.${stamp}@test.no`, `b.${stamp}@test.no`]);
    for (const m of sent) {
      expect(m.html).toContain("nyhetsbrev/avmeld?token=");
      expect(m.html).toContain("<strong>Nye</strong>");
    }
    const { data: c } = await admin.from("email_campaigns").select("status, sent_count").eq("subject", subject).single();
    expect(c).toEqual({ status: "sent", sent_count: 2 });
  });

  test("CSV-import av leverandører og innkjøpspriser", async ({ page }) => {
    await login(page, adminEmail, PASSWORD, "/admin/suppliers");
    const csv = "navn;kontaktperson;epost;telefon;nettsted;land;region;valuta;leveringstid\n" + `CSV Leverandør ${stamp};Per Test;per@test.no;22334455;;DE;EU;EUR;12\n`;
    await page.locator('input[type="file"]').first().setInputFiles({ name: "lev.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
    await page.getByRole("button", { name: "Importer" }).first().click();
    await expect(page.getByText(/Importerte 1 leverandører/).first()).toBeVisible();
    const { data: supplier } = await admin.from("suppliers").select("id, region, currency, lead_time_days").eq("name", `CSV Leverandør ${stamp}`).single();
    expect(supplier).toMatchObject({ region: "EU", currency: "EUR", lead_time_days: 12 });

    await page.goto(`/admin/suppliers/${supplier!.id}`);
    const prices = "sku;leverandor_sku;innkjopspris;valuta;minimum\nKP-OLJ-TITANHVIT-37;L-100;2,45;EUR;12\nFINNES-IKKE;X;1;EUR;1\n";
    await page.locator('input[type="file"]').last().setInputFiles({ name: "priser.csv", mimeType: "text/csv", buffer: Buffer.from(prices) });
    await page.getByRole("button", { name: "Importer" }).last().click();
    await expect(page.getByText(/Importerte 1 linjer\. 1 feil/).first()).toBeVisible();
    const { data: sp } = await admin.from("supplier_products").select("purchase_price, currency, min_order_quantity, supplier_sku").eq("supplier_id", supplier!.id).single();
    expect(sp).toMatchObject({ currency: "EUR", min_order_quantity: 12, supplier_sku: "L-100" });
    expect(Number(sp!.purchase_price)).toBe(2.45);
    const { count } = await admin.from("supplier_price_history").select("id", { count: "exact", head: true });
    expect(count).toBeGreaterThan(0);
  });
});
