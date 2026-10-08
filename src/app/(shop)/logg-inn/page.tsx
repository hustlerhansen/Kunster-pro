import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/shop/auth-card";
import { LoginForm } from "@/components/forms/auth-forms";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Logg inn", robots: { index: false } };

const ERRORS: Record<string, string> = {
  lenke: "Lenken er ugyldig eller utløpt. Prøv igjen.",
  sperret: "Kontoen er sperret. Kontakt kundeservice.",
};

export default async function LoginPage({ searchParams }: PageProps<"/logg-inn">) {
  const sp = await searchParams;
  const next = typeof sp.neste === "string" && sp.neste.startsWith("/") && !sp.neste.startsWith("//") ? sp.neste : "/konto";
  const error = typeof sp.feil === "string" ? ERRORS[sp.feil] : undefined;
  return (
    <AuthCard
      title="Logg inn"
      intro={
        <>
          Ny kunde?{" "}
          <Link href="/registrer" className="font-medium text-foreground underline">
            Opprett konto
          </Link>
        </>
      }
    >
      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}
      <LoginForm next={next} />
    </AuthCard>
  );
}
