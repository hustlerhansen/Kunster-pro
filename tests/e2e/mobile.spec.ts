/** Regresjonstest: ingen side skal være bredere enn mobilskjermen (390 px). */
import { expect, test } from "@playwright/test";

const PAGES = ["/", "/produkter", "/oljemaling", "/tilbud", "/produkt/titanhvit", "/produkt/startpakke-oljemaling", "/handlekurv", "/kasse", "/kunstnerguide/hvordan-velge-lerret", "/bedrift", "/handlekonto", "/kontakt", "/personvern", "/frakt-og-levering", "/registrer"];

for (const path of PAGES) {
  test(`mobil ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    const width = await page.evaluate(() => window.innerWidth);
    expect(width, `${path} er bredere enn skjermen`).toBe(390);
    await expect(page.getByRole("button", { name: /Handlekurv/ })).toBeInViewport();
  });
}
