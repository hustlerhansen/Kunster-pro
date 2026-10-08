import { defineConfig, devices } from "@playwright/test";

/**
 * E2E-tester. Forutsetter at appen kjører på BASE_URL (standard http://localhost:3000).
 * - tests/e2e/demo.spec.ts: demomodus (uten database)
 * - tests/e2e/fullstack.spec.ts: krever Supabase (lokalt via `supabase start`) – kjøres med E2E_FULLSTACK=1
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    locale: "nb-NO",
    timezoneId: "Europe/Oslo",
    screenshot: "only-on-failure",
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : undefined,
  },
  projects: [
    { name: "desktop", testIgnore: /mobile\.spec/, use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 900 } } },
    { name: "mobil", testMatch: /mobile\.spec/, use: { ...devices["iPhone 13"], browserName: "chromium" } },
  ],
});
