import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/components/shop/cart/cart-provider";
import { ConsentProvider } from "@/components/shop/consent/consent-provider";
import { CookieBanner } from "@/components/shop/consent/cookie-banner";
import { Analytics } from "@/components/shop/consent/analytics";
import { SITE } from "@/lib/site";
import { siteUrl } from "@/lib/env";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE.name} – Oljemaling, pensler og lerret til profesjonelle kunstnere`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: SITE.keywords,
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    locale: SITE.locale,
    siteName: SITE.name,
    url: siteUrl,
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nb" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-dvh">
        <ConsentProvider>
          <CartProvider>
            {children}
            <Toaster />
          </CartProvider>
          <CookieBanner />
          <Analytics />
        </ConsentProvider>
      </body>
    </html>
  );
}
