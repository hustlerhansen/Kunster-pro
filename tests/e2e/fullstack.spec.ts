/**
 * Ende-til-ende-test mot ekte database (Supabase Auth + PostgREST + PostgreSQL).
 * Kjør: E2E_FULLSTACK=1 npx playwright test fullstack
 * Krever .env.local med NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * STRIPE_WEBHOOK_SECRET og FEATURE_BUSINESS_INVOICE=true.
 */
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { acceptCookies } from "./helpers";

function loadEnv(): Record<string, string> {
  try {
    return Object.fromEntries(
      readFileSync(".env.local", "utf8")
        .split("\n")
        .filter((l) => l.includes("=") && !l.startsWith("#"))
        .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
    );
  } catch {
    return {};
  }
}
const env = { ...loadEnv(), ...process.env } as Record<string, string>;

test.skip(!process.env.E2E_FULLSTACK, "Krever E2E_FULLSTACK=1 og tilkoblet database");

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL ?? "http://x", env.SUPABASE_SERVICE_ROLE_KEY ?? "x", { auth: { persistSession: false } });
const stamp = Date.now();

/** Gyldig (mod11) organisasjonsnummer, unikt per testkjøring. */
function orgNumber(): string {
  const w = [3, 2, 7, 6, 5, 4, 3, 2];
  for (let n = 0; n < 1000; n++) {
    const base = String(800000000 + ((stamp + n * 7919) % 99999999)).slice(0, 8);
    const sum = w.reduce((s, x, i) => s + x * Number(base[i]), 0);
    const c = (11 - (sum % 11)) % 11;
    if (c !== 10) return base + c;
  }
  throw new Error("fant ikke orgnr");
}
const ORG = orgNumber();
const customer = { name: "Kari Kunstner", email: `kari.${stamp}@test.no`, password: "Malerpensel2026" };
const adminUser = { email: `admin.${stamp}@test.no`, password: "AdminPassord2026" };

async function login(page: Page, email: string, password: string, next = "/konto") {
  await page.goto(`/logg-inn?neste=${encodeURIComponent(next)}`);
  await acceptCookies(page);
  await page.locator('main [name="email"]').first().fill(email);
  await page.locator('main [name="password"]').first().fill(password);
  await page.getByRole("button", { name: "Logg inn" }).click();
  await page.waitForURL(`**${next}`);
}

async function stock(sku: string) {
  const { data } = await admin.from("product_variants").select("stock_on_hand, stock_reserved").eq("sku", sku).single();
  return data!;
}

test.describe.serial("Full kundereise og administrasjon", () => {
  test.beforeAll(async () => {
    // Nullstill rate limiting fra tidligere testkjøringer (samme IP)
    await admin.from("rate_limits").delete().neq("key", "");
  });

  test("registrering oppretter konto, profil og adresse", async ({ page }) => {
    await page.goto("/registrer");
    await acceptCookies(page);
    await page.locator('main [name="full_name"]').first().fill(customer.name);
    await page.locator('main [name="email"]').first().fill(customer.email);
    await page.locator('main [name="phone"]').first().fill("912 34 567");
    await page.locator('main [name="line1"]').first().fill("Storgata 1");
    await page.locator('main [name="postal_code"]').first().fill("0155");
    await page.locator('main [name="city"]').first().fill("Oslo");
    await page.locator('main [name="password"]').first().fill(customer.password);
    await page.locator('input[name="accept_terms"]').check();
    await page.getByRole("button", { name: "Opprett konto" }).click();
    await page.waitForURL("**/konto");
    await expect(page.getByRole("heading", { name: /Hei, Kari/ })).toBeVisible();
    const { data: profile } = await admin.from("profiles").select("id, full_name, phone, role").eq("email", customer.email).single();
    expect(profile?.full_name).toBe(customer.name);
    expect(profile?.role).toBe("customer");
    const { count } = await admin.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", profile!.id);
    expect(count).toBe(1);
  });

  test("feil passord avvises, riktig passord logger inn", async ({ page }) => {
    await page.goto("/logg-inn");
    await acceptCookies(page);
    await page.locator('main [name="email"]').first().fill(customer.email);
    await page.locator('main [name="password"]').first().fill("feilpassord123");
    await page.getByRole("button", { name: "Logg inn" }).click();
    await expect(page.getByText("Feil e-post eller passord.")).toBeVisible();
    await login(page, customer.email, customer.password);
  });

  test("produktsøk, varianter, handlekurv, mengderabatt og rabattkode", async ({ page }) => {
    await admin.from("discount_codes").upsert({ code: "E2ETEST10", type: "percent", value: 10, is_active: true }, { onConflict: "code" });
    await page.goto("/sok?q=lerret");
    await acceptCookies(page);
    await expect(page.getByTestId("search-count")).toContainText("treff");
    await page.goto("/produkt/oppspent-lerret-bomull");
    await page.getByTestId("variant-option").filter({ hasText: "40 × 50 cm" }).click();
    await page.locator("main").getByRole("spinbutton", { name: "Antall" }).fill("5");
    await page.getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-count")).toHaveText("5");
    await page.goto("/handlekurv");
    await expect(page.getByText("Kjøp 5 lerret – spar 10 %").first()).toBeVisible();
    // 5 × 109 = 545, −10 % = 490,50
    await expect(page.getByTestId("line-total")).toHaveText("490,50 kr");
    await page.locator("#rabattkode").fill("e2etest10");
    await page.getByRole("button", { name: "Bruk" }).click();
    await expect(page.getByText("Rabattkode E2ETEST10")).toBeVisible();
    await page.locator("#rabattkode").fill("FINNESIKKE");
    await page.getByRole("button", { name: "Bruk" }).click();
    await expect(page.getByText("Rabattkoden finnes ikke.")).toBeVisible();
    await page.getByRole("button", { name: "Fjern" }).last().click();
  });

  test("kortbetaling som ikke kan startes markerer IKKE ordren som betalt og frigjør lager", async ({ page }) => {
    await login(page, customer.email, customer.password, "/produkt/oppspent-lerret-bomull");
    await page.getByTestId("variant-option").filter({ hasText: "40 × 50 cm" }).click();
    await page.getByTestId("add-to-cart").click();
    await page.goto("/kasse");
    const before = await stock("KP-LER-OPPSPENTLE-40X50");
    await expect(page.getByTestId("order-total")).toBeVisible();
    await page.getByTestId("accept-terms").check();
    await page.getByTestId("place-order").click();
    await expect(page.getByText(/Betalingen kunne ikke startes/)).toBeVisible({ timeout: 30_000 });
    const after = await stock("KP-LER-OPPSPENTLE-40X50");
    expect(after).toEqual(before);
    const { data: orders } = await admin.from("orders").select("status, payment_status").eq("email", customer.email).order("created_at", { ascending: false }).limit(1);
    expect(orders?.[0]).toEqual({ status: "cancelled", payment_status: "failed" });
  });

  test("Stripe-webhook med gyldig signatur bekrefter betaling; ugyldig signatur avvises", async ({ request }) => {
    const { data: variant } = await admin.from("product_variants").select("id, price_ore, stock_on_hand").eq("sku", "KP-OLJ-ULTRAMARIN-37").single();
    const { data: prof } = await admin.from("profiles").select("id").eq("email", customer.email).single();
    const { data: created, error } = await admin.rpc("create_order", {
      payload: {
        user_id: prof!.id,
        email: customer.email,
        customer_name: customer.name,
        payment_method: "card",
        payment_provider: "stripe",
        subtotal_ore: variant!.price_ore,
        discount_ore: 0,
        shipping_ore: 0,
        total_ore: variant!.price_ore,
        vat_ore: 0,
        shipping_address: { full_name: customer.name, line1: "Storgata 1", postal_code: "0155", city: "Oslo", country: "NO" },
        items: [{ variant_id: variant!.id, quantity: 1, unit_price_ore: variant!.price_ore }],
      },
    });
    expect(error).toBeNull();
    const orderId = created[0].order_id as string;
    const payload = JSON.stringify({
      id: `evt_e2e_${stamp}`,
      object: "event",
      type: "checkout.session.completed",
      data: { object: { id: `cs_e2e_${stamp}`, object: "checkout.session", payment_status: "paid", amount_total: variant!.price_ore, payment_intent: `pi_e2e_${stamp}`, metadata: { order_id: orderId }, client_reference_id: orderId } },
    });
    const bad = await request.post("/api/webhooks/stripe", { data: payload, headers: { "stripe-signature": "t=1,v1=feil", "content-type": "application/json" } });
    expect(bad.status()).toBe(400);
    const { data: stillPending } = await admin.from("orders").select("payment_status").eq("id", orderId).single();
    expect(stillPending?.payment_status).toBe("pending");

    const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: env.STRIPE_WEBHOOK_SECRET });
    const ok = await request.post("/api/webhooks/stripe", { data: payload, headers: { "stripe-signature": signature, "content-type": "application/json" } });
    expect(ok.status()).toBe(200);
    const dup = await request.post("/api/webhooks/stripe", { data: payload, headers: { "stripe-signature": signature, "content-type": "application/json" } });
    expect((await dup.json()).duplicate).toBe(true);
    const { data: paid } = await admin.from("orders").select("status, payment_status, payment_intent_id").eq("id", orderId).single();
    expect(paid).toEqual({ status: "paid", payment_status: "paid", payment_intent_id: `pi_e2e_${stamp}` });
    const { data: v2 } = await admin.from("product_variants").select("stock_on_hand").eq("id", variant!.id).single();
    expect(v2!.stock_on_hand).toBe(variant!.stock_on_hand - 1);
    const { data: mails } = await admin.from("email_log").select("template, status").eq("order_id", orderId);
    expect(mails?.some((m) => m.template === "order_confirmation")).toBe(true);
  });

  test("kunden ser ordren, kan kjøpe samme produkter igjen og registrere retur", async ({ page }) => {
    await login(page, customer.email, customer.password, "/konto/bestillinger");
    await page.getByRole("row", { name: /Betalt/ }).getByRole("link").first().click();
    await expect(page.getByText("Betaling bekreftet av stripe")).toBeVisible();
    await page.getByRole("button", { name: "Kjøp samme produkter igjen" }).click();
    await page.waitForURL("**/handlekurv");
    await expect(page.getByText("Oljemaling Ultramarinblå").first()).toBeVisible();
    await page.goBack();
    await page.locator('input[name^="qty_"]').first().fill("1");
    await page.locator('main [name="reason"]').first().fill("Feil farge bestilt");
    await page.getByRole("button", { name: "Send forespørsel" }).click();
    await expect(page.getByText("Returen er registrert.")).toBeVisible();
  });

  test("datainnsyn: eksport av egne personopplysninger", async ({ page }) => {
    await login(page, customer.email, customer.password, "/konto/innstillinger");
    const res = await page.request.get("/konto/eksport");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.account.email).toBe(customer.email);
    expect(body.orders.length).toBeGreaterThan(0);
  });

  test("kunde uten adminrolle får ikke tilgang til /admin", async ({ page }) => {
    await login(page, customer.email, customer.password);
    await page.goto("/admin");
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("bedriftsregistrering og søknad om handlekonto", async ({ page }) => {
    await login(page, customer.email, customer.password, "/handlekonto");
    await page.locator('main [name="company_name"]').first().fill("Kari Atelier AS");
    await page.locator('main [name="org_number"]').first().fill(ORG);
    await page.locator('main [name="contact_name"]').first().fill(customer.name);
    await page.locator('main [name="email"]').first().fill(customer.email);
    await page.locator('main [name="phone"]').first().fill("91234567");
    await page.locator('input[name="billing_line1"]').fill("Atelierveien 2");
    await page.locator('input[name="billing_postal_code"]').fill("0150");
    await page.locator('input[name="billing_city"]').fill("Oslo");
    await page.locator('input[name="requested_limit"]').fill("20000");
    await page.locator('input[name="accept_terms"]').check();
    await page.getByRole("button", { name: "Send søknad" }).click();
    await expect(page.getByText(/Søknaden er mottatt/)).toBeVisible();
  });

  test("administrator: dashbord, godkjenning av kreditt, faktura-aktivering", async ({ page }) => {
    const { data: u } = await admin.auth.admin.createUser({ email: adminUser.email, password: adminUser.password, email_confirm: true });
    await admin.from("profiles").update({ role: "admin" }).eq("id", u.user!.id);
    await login(page, adminUser.email, adminUser.password, "/admin");
    await expect(page.getByRole("heading", { name: "Dashbord" })).toBeVisible();
    await expect(page.getByText("Omsetning i dag")).toBeVisible();
    await expect(page.getByText(/merket DEMO/)).toBeVisible();

    await page.goto("/admin/handlekontoer");
    const card = page.locator("div.rounded-md.border.p-4").filter({ hasText: "Kari Atelier AS" });
    await card.locator('select[name="decision"]').selectOption("approved");
    await card.locator('input[name="credit_limit"]').fill("20000");
    await card.locator('input[name="checks_confirmed"]').check();
    await card.locator('input[name="activate"]').check();
    await card.getByRole("button", { name: "Lagre beslutning" }).click();
    // Søknaden flyttes til «Behandlede søknader» når den er godkjent
    await expect(page.getByRole("listitem").filter({ hasText: `Kari Atelier AS (${ORG})` })).toContainText("Godkjent");
    const { data: account } = await admin.from("credit_account_overview").select("status, credit_limit_ore").eq("org_number", ORG).single();
    expect(account).toEqual({ status: "active", credit_limit_ore: 2000000 });

    await page.goto("/admin/innstillinger");
    const payments = page.locator("section").filter({ hasText: "Betalingsmetoder" });
    await payments.locator('input[name="invoice_enabled"]').check();
    await payments.getByRole("button", { name: "Lagre" }).click();
    await expect(page.getByText("Innstillingene er lagret.").first()).toBeVisible();
  });

  test("godkjent bedriftskunde handler på faktura innenfor kredittrammen", async ({ page }) => {
    await login(page, customer.email, customer.password, "/produkt/startpakke-oljemaling");
    await page.getByTestId("add-to-cart").click();
    await page.goto("/kasse");
    await expect(page.getByText("Faktura (handlekonto)")).toBeVisible();
    await page.getByText("Faktura (handlekonto)").click();
    await page.getByTestId("accept-terms").check();
    await page.getByTestId("place-order").click();
    await page.waitForURL("**/kasse/bekreftelse**", { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Takk for bestillingen!" })).toBeVisible();
    const { data: inv } = await admin.from("invoices").select("amount_ore, status").order("created_at", { ascending: false }).limit(1).single();
    expect(inv?.status).toBe("open");
    await page.goto("/konto/handlekonto");
    await expect(page.getByText("Tilgjengelig kreditt")).toBeVisible();
  });

  test("administrator registrerer forsendelse med sporingsnummer", async ({ page }) => {
    await login(page, adminUser.email, adminUser.password, "/admin/ordrer?status=paid");
    await page.getByRole("link", { name: /^#\d+/ }).first().click();
    await page.locator('main [name="tracking_number"]').first().fill("70712345678901234");
    await page.getByRole("button", { name: "Registrer forsendelse og varsle kunden" }).click();
    await expect(page.getByText("Forsendelsen er registrert og kunden er varslet.").first()).toBeVisible();
    await expect(page.getByText(/Sendt med Posten\/Bring/).first()).toBeVisible();
  });

  test("administrator oppretter produkt med variant og kostprofil", async ({ page }) => {
    await login(page, adminUser.email, adminUser.password, "/admin/produkter/ny");
    await page.locator('main [name="name"]').first().fill(`Testmaling ${stamp}`);
    await page.getByRole("button", { name: "Opprett produkt" }).click();
    await page.waitForURL("**/admin/produkter/**?ny=1");
    const nv = page.locator("details", { hasText: "+ Ny variant" });
    await nv.locator('[name="name"]').fill("37 ml");
    await nv.locator('[name="sku"]').fill(`TEST-${stamp}`);
    await nv.locator('[name="price"]').fill("175");
    await page.getByRole("button", { name: "Legg til variant" }).click();
    await expect(page.getByText("Varianten er lagt til.").first()).toBeVisible();
    const { data: v } = await admin.from("product_variants").select("price_ore").eq("sku", `TEST-${stamp}`).single();
    expect(v?.price_ore).toBe(17500);
  });
});
