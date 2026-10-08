/**
 * Røyktest: alle sider laster uten serverfeil eller JavaScript-feil.
 * Butikksider testes alltid; konto- og adminsider krever E2E_FULLSTACK=1.
 */
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { acceptCookies } from "./helpers";

const SHOP = [
  "/", "/produkter", "/oljemaling", "/pensler", "/lerret", "/malermedium", "/malersett", "/tilbehor", "/tilbud",
  "/produkt/titanhvit", "/produkt/startpakke-oljemaling", "/produkt/oppspent-lerret-bomull", "/sok?q=pensel",
  "/kunstnerguide", "/kunstnerguide/hvordan-velge-riktig-oljemaling", "/bedrift", "/handlekonto", "/kontakt", "/om-oss",
  "/kjopsvilkar", "/angrerett", "/retur-og-reklamasjon", "/frakt-og-levering", "/personvern", "/informasjonskapsler",
  "/handlekurv", "/kasse", "/logg-inn", "/registrer", "/glemt-passord",
];
const ACCOUNT = ["/konto", "/konto/bestillinger", "/konto/fakturaer", "/konto/adresser", "/konto/favoritter", "/konto/handlekonto", "/konto/returer", "/konto/innstillinger"];
const ADMIN = [
  "/admin", "/admin/ordrer", "/admin/returer", "/admin/kunder", "/admin/handlekontoer", "/admin/fakturaer", "/admin/henvendelser",
  "/admin/produkter", "/admin/produkter/ny", "/admin/kategorier", "/admin/prisgrupper", "/admin/lager", "/admin/suppliers",
  "/admin/suppliers/ny", "/admin/innkjop", "/admin/lonnsomhet", "/admin/kampanjer", "/admin/nyhetsbrev", "/admin/artikler",
  "/admin/artikler/ny", "/admin/frakt", "/admin/innstillinger", "/admin/logg",
];

function env(): Record<string, string> {
  try {
    return Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
  } catch {
    return {};
  }
}

for (const path of SHOP) {
  test(`butikk ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && !m.text().includes("favicon") && errors.push(m.text()));
    const res = await page.goto(path);
    expect(res?.status(), `${path} HTTP-status`).toBeLessThan(400);
    await expect(page.locator("main")).toBeVisible();
    expect(errors, `${path} JS-feil`).toEqual([]);
  });
}

test.describe("innlogget", () => {
  test.skip(!process.env.E2E_FULLSTACK, "Krever database");
  test("konto- og adminsider", async ({ page }) => {
    test.setTimeout(240_000);
    const e = env();
    const admin = createClient(e.NEXT_PUBLIC_SUPABASE_URL, e.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    await admin.from("rate_limits").delete().neq("key", "");
    const email = `smoke.${Date.now()}@test.no`;
    const { data } = await admin.auth.admin.createUser({ email, password: "Roykttest12345", email_confirm: true });
    await admin.from("profiles").update({ role: "admin", full_name: "Røyk Test" }).eq("id", data.user!.id);
    await page.goto("/logg-inn?neste=%2Fkonto");
    await acceptCookies(page);
    await page.locator('main [name="email"]').fill(email);
    await page.locator('main [name="password"]').fill("Roykttest12345");
    await page.getByRole("button", { name: "Logg inn" }).click();
    await page.waitForURL("**/konto");
    const { data: product } = await admin.from("products").select("id").limit(1).single();
    const { data: supplier } = await admin.from("suppliers").select("id").limit(1).single();
    const { data: order } = await admin.from("orders").select("id").limit(1).maybeSingle();
    const extra = [`/admin/produkter/${product!.id}`, `/admin/suppliers/${supplier!.id}`, ...(order ? [`/admin/ordrer/${order.id}`] : [])];
    for (const path of [...ACCOUNT, ...ADMIN, ...extra]) {
      const errors: string[] = [];
      const onErr = (err: Error) => errors.push(err.message);
      page.on("pageerror", onErr);
      const res = await page.goto(path);
      expect(res?.status(), `${path} HTTP-status`).toBeLessThan(400);
      expect(page.url(), `${path} ble omdirigert`).toContain(path.split("?")[0]);
      await expect(page.locator("main").first()).toBeVisible();
      await expect(page.getByText("Noe gikk galt")).toHaveCount(0);
      expect(errors, `${path} JS-feil`).toEqual([]);
      page.off("pageerror", onErr);
      const safe = path.replace(/\//g, "_").replace(/[^a-z0-9_-]/gi, "").slice(0, 60);
      if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/${safe}.png`, fullPage: false });
    }
  });
});
