import type { Page } from "@playwright/test";

/** Venter på cookie-banneret (vises etter hydrering) og velger «Kun nødvendige». */
export async function acceptCookies(page: Page) {
  const btn = page.getByRole("button", { name: "Kun nødvendige" }).first();
  try {
    await btn.waitFor({ state: "visible", timeout: 4000 });
    await btn.click();
  } catch {
    // banneret vises ikke når samtykke allerede er gitt
  }
}

export const MOCK = "http://localhost:4010";

export async function mockEmails(): Promise<{ to: string | string[]; subject: string; html: string }[]> {
  return (await fetch(`${MOCK}/__emails`)).json();
}

export async function login(page: Page, email: string, password: string, next = "/konto") {
  await page.goto(`/logg-inn?neste=${encodeURIComponent(next)}`);
  await acceptCookies(page);
  await page.locator('main [name="email"]').fill(email);
  await page.locator('main [name="password"]').fill(password);
  await page.getByRole("button", { name: "Logg inn" }).click();
  await page.waitForURL(`**${next}`);
}
