"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface Consent {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
  version: 1;
}

interface ConsentContextValue {
  consent: Consent | null;
  ready: boolean;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  save: (c: { analytics: boolean; marketing: boolean }) => void;
}

const COOKIE = "kp_consent";
const ConsentContext = createContext<ConsentContextValue | null>(null);

function readCookie(): Consent | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw.slice(COOKIE.length + 1)));
    return parsed?.version === 1 ? (parsed as Consent) : null;
  } catch {
    return null;
  }
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leser cookie etter hydrering
    setConsent(readCookie());
    setReady(true);
  }, []);

  const save = useCallback((c: { analytics: boolean; marketing: boolean }) => {
    const value: Consent = { necessary: true, analytics: c.analytics, marketing: c.marketing, decidedAt: new Date().toISOString(), version: 1 };
    // Samtykket lagres i 12 måneder, deretter spør vi på nytt
    document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(value))}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    setConsent(value);
    setSettingsOpen(false);
    window.dispatchEvent(new CustomEvent("kp:consent", { detail: value }));
  }, []);

  const value = useMemo(
    () => ({
      consent,
      ready,
      settingsOpen,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
      save,
    }),
    [consent, ready, settingsOpen, save],
  );
  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent må brukes innenfor ConsentProvider");
  return ctx;
}
