"use client";

import Link from "next/link";
import { useState } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useConsent } from "./consent-provider";

export function CookieBanner() {
  const { consent, ready, settingsOpen, openSettings, closeSettings, save } = useConsent();
  const [analytics, setAnalytics] = useState(consent?.analytics ?? false);
  const [marketing, setMarketing] = useState(consent?.marketing ?? false);

  const showBanner = ready && !consent && !settingsOpen;

  return (
    <>
      {showBanner && (
        <div role="dialog" aria-live="polite" aria-label="Informasjonskapsler" className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-ink p-4 text-white shadow-2xl sm:p-5">
          <div className="container-page flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-3">
              <Cookie className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
              <p className="text-sm text-white/85">
                Vi bruker nødvendige informasjonskapsler for at nettbutikken skal fungere (handlekurv, innlogging og sikkerhet).
                Med ditt samtykke bruker vi også informasjonskapsler til statistikk og markedsføring.{" "}
                <Link href="/informasjonskapsler" className="text-gold underline underline-offset-2">
                  Les mer
                </Link>
                .
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="outline-light" size="sm" onClick={() => save({ analytics: false, marketing: false })}>
                Kun nødvendige
              </Button>
              <Button variant="outline-light" size="sm" onClick={openSettings}>
                Innstillinger
              </Button>
              <Button variant="gold" size="sm" onClick={() => save({ analytics: true, marketing: true })}>
                Godta alle
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={settingsOpen} onOpenChange={(o) => (o ? openSettings() : closeSettings())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Innstillinger for informasjonskapsler</DialogTitle>
            <DialogDescription>Du kan når som helst endre samtykket ditt via lenken «Informasjonskapsler» nederst på siden.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="flex items-start justify-between gap-4 rounded-md border p-3">
              <div>
                <p className="font-medium">Nødvendige</p>
                <p className="text-muted-foreground">Handlekurv, innlogging, sikkerhet og lagring av samtykket ditt. Kan ikke slås av.</p>
              </div>
              <Switch checked disabled aria-label="Nødvendige informasjonskapsler" />
            </div>
            <div className="flex items-start justify-between gap-4 rounded-md border p-3">
              <div>
                <Label htmlFor="consent-analytics" className="font-medium">Statistikk</Label>
                <p className="mt-1 text-muted-foreground">Google Analytics 4 – hjelper oss å forstå hvordan nettbutikken brukes.</p>
              </div>
              <Switch id="consent-analytics" checked={analytics} onCheckedChange={setAnalytics} />
            </div>
            <div className="flex items-start justify-between gap-4 rounded-md border p-3">
              <div>
                <Label htmlFor="consent-marketing" className="font-medium">Markedsføring</Label>
                <p className="mt-1 text-muted-foreground">Måling av annonser og relevante tilbud.</p>
              </div>
              <Switch id="consent-marketing" checked={marketing} onCheckedChange={setMarketing} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => save({ analytics: false, marketing: false })}>
              Kun nødvendige
            </Button>
            <Button onClick={() => save({ analytics, marketing })}>Lagre valg</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CookieSettingsLink({ className }: { className?: string }) {
  const { openSettings } = useConsent();
  return (
    <button type="button" onClick={openSettings} className={className}>
      Endre samtykke
    </button>
  );
}
