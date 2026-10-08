"use client";

import Script from "next/script";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useConsent } from "./consent-provider";
import { gaMeasurementId } from "@/lib/env";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Sender e-handelshendelser til GA4 – gjør ingenting uten samtykke/konfigurasjon. */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}

function PageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    trackEvent("page_view", { page_location: window.location.href, page_path: pathname });
  }, [pathname, searchParams]);
  return null;
}

/**
 * Google Analytics 4 lastes KUN etter samtykke til statistikk (GDPR / ekomloven § 3-15).
 * Consent Mode v2 settes til «denied» som standard.
 */
export function Analytics() {
  const { consent } = useConsent();
  const allowed = Boolean(gaMeasurementId && consent?.analytics);

  useEffect(() => {
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: consent?.analytics ? "granted" : "denied",
        ad_storage: consent?.marketing ? "granted" : "denied",
        ad_user_data: consent?.marketing ? "granted" : "denied",
        ad_personalization: consent?.marketing ? "granted" : "denied",
      });
    }
  }, [consent]);

  if (!allowed) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: '${consent?.marketing ? "granted" : "denied"}', ad_user_data: '${consent?.marketing ? "granted" : "denied"}', ad_personalization: '${consent?.marketing ? "granted" : "denied"}' });
gtag('js', new Date());
gtag('config', '${gaMeasurementId}', { send_page_view: false, anonymize_ip: true });`}
      </Script>
      <Suspense fallback={null}>
        <PageViews />
      </Suspense>
    </>
  );
}
