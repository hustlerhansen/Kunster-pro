import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { integrations } from "@/lib/env";

/**
 * Vipps MobilePay ePayment API – FORBEREDT integrasjon.
 * Aktiveres først når VIPPS_* er satt og VIPPS_ENABLED=true, og når flyten er
 * verifisert i Vipps sitt testmiljø (https://developer.vippsmobilepay.com).
 *
 * Merk: I Norge skal beløpet normalt først trekkes (capture) når varen sendes.
 * Ordren regnes som betalt når betalingen er AUTHORIZED; capture gjøres ved forsendelse.
 */
const BASE = () => (process.env.VIPPS_ENV === "production" ? "https://api.vipps.no" : "https://apitest.vipps.no");

function commonHeaders() {
  return {
    "Ocp-Apim-Subscription-Key": process.env.VIPPS_SUBSCRIPTION_KEY!,
    "Merchant-Serial-Number": process.env.VIPPS_MSN!,
    "Vipps-System-Name": "kunstner-pro",
    "Vipps-System-Version": "1.0.0",
    "Content-Type": "application/json",
  };
}

let tokenCache: { token: string; expires: number } | null = null;

async function accessToken(): Promise<string> {
  if (tokenCache && tokenCache.expires > Date.now() + 60_000) return tokenCache.token;
  const res = await fetch(`${BASE()}/accesstoken/get`, {
    method: "POST",
    headers: { ...commonHeaders(), client_id: process.env.VIPPS_CLIENT_ID!, client_secret: process.env.VIPPS_CLIENT_SECRET! },
  });
  if (!res.ok) throw new Error(`Vipps accesstoken feilet: ${res.status}`);
  const json = (await res.json()) as { access_token: string; expires_in: string | number };
  tokenCache = { token: json.access_token, expires: Date.now() + Number(json.expires_in) * 1000 };
  return json.access_token;
}

export async function createVippsPayment(opts: { reference: string; amountOre: number; returnUrl: string; description: string; phone?: string | null }) {
  if (!integrations.vipps()) throw new Error("Vipps er ikke aktivert.");
  const token = await accessToken();
  const res = await fetch(`${BASE()}/epayment/v1/payments`, {
    method: "POST",
    headers: { ...commonHeaders(), Authorization: `Bearer ${token}`, "Idempotency-Key": opts.reference },
    body: JSON.stringify({
      amount: { currency: "NOK", value: opts.amountOre },
      paymentMethod: { type: "WALLET" },
      ...(opts.phone ? { customer: { phoneNumber: opts.phone.replace(/\D/g, "").replace(/^(?!47)/, "47") } } : {}),
      reference: opts.reference,
      returnUrl: opts.returnUrl,
      userFlow: "WEB_REDIRECT",
      paymentDescription: opts.description.slice(0, 100),
    }),
  });
  if (!res.ok) throw new Error(`Vipps createPayment feilet: ${res.status} ${await res.text()}`);
  return (await res.json()) as { redirectUrl: string; reference: string };
}

export async function getVippsPayment(reference: string) {
  const token = await accessToken();
  const res = await fetch(`${BASE()}/epayment/v1/payments/${encodeURIComponent(reference)}`, {
    headers: { ...commonHeaders(), Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Vipps getPayment feilet: ${res.status}`);
  return (await res.json()) as { state: string; aggregate: { authorizedAmount: { value: number } } };
}

export async function captureVippsPayment(reference: string, amountOre: number) {
  const token = await accessToken();
  const res = await fetch(`${BASE()}/epayment/v1/payments/${encodeURIComponent(reference)}/capture`, {
    method: "POST",
    headers: { ...commonHeaders(), Authorization: `Bearer ${token}`, "Idempotency-Key": `capture-${reference}` },
    body: JSON.stringify({ modificationAmount: { currency: "NOK", value: amountOre } }),
  });
  if (!res.ok) throw new Error(`Vipps capture feilet: ${res.status}`);
}

/**
 * Verifiserer Vipps webhook-signatur (HMAC-SHA256). Signert streng:
 * "POST\n<path og query>\n<x-ms-date>;<host>;<x-ms-content-sha256>"
 */
export function verifyVippsWebhook(opts: {
  body: string;
  pathAndQuery: string;
  host: string;
  date: string | null;
  contentSha256: string | null;
  authorization: string | null;
}): boolean {
  const secret = process.env.VIPPS_WEBHOOK_SECRET;
  if (!secret || !opts.date || !opts.contentSha256 || !opts.authorization) return false;
  const bodyHash = createHash("sha256").update(opts.body).digest("base64");
  if (bodyHash !== opts.contentSha256) return false;
  const signed = `POST\n${opts.pathAndQuery}\n${opts.date};${opts.host};${opts.contentSha256}`;
  const expected = createHmac("sha256", secret).update(signed).digest("base64");
  const provided = /Signature=([^&\s]+)/.exec(opts.authorization)?.[1] ?? "";
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}
