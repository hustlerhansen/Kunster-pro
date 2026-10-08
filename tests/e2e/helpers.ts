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
