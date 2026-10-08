import Link from "next/link";
import { SiteHeader } from "@/components/shop/site-header";
import { SiteFooter } from "@/components/shop/site-footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="container-page py-24 text-center">
        <p className="text-sm font-semibold tracking-[0.3em] text-gold-dark">404</p>
        <h1 className="mt-3 text-4xl font-semibold">Siden finnes ikke</h1>
        <p className="mt-4 text-muted-foreground">Siden kan være flyttet eller slettet.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild>
            <Link href="/">Til forsiden</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/produkter">Se produkter</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
