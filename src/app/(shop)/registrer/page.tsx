import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/shop/auth-card";
import { RegisterForm } from "@/components/forms/auth-forms";

export const metadata: Metadata = { title: "Opprett konto", robots: { index: false } };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Opprett konto"
      intro={
        <>
          Har du allerede konto?{" "}
          <Link href="/logg-inn" className="font-medium text-foreground underline">
            Logg inn
          </Link>
          . Bedrift? <Link href="/bedrift" className="font-medium text-foreground underline">Registrer bedriftskonto</Link>.
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
