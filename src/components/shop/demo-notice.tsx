import { isSupabaseConfigured } from "@/lib/env";

/** Vises når butikken kjører uten database – gjør det tydelig at innholdet er demodata. */
export function DemoNotice() {
  if (isSupabaseConfigured()) return null;
  return (
    <div className="bg-gold-light px-4 py-1.5 text-center text-xs text-ink">
      <strong>Demomodus:</strong> Produkter, priser og lagerstatus er fiktive demodata. Bestilling og innlogging krever tilkoblet database og betaling.
    </div>
  );
}
