import { SiteHeader } from "@/components/shop/site-header";
import { SiteFooter } from "@/components/shop/site-footer";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#innhold" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2">
        Hopp til innhold
      </a>
      <SiteHeader />
      <main id="innhold">{children}</main>
      <SiteFooter />
    </>
  );
}
