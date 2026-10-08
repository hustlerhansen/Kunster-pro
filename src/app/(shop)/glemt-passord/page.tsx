import type { Metadata } from "next";
import { AuthCard } from "@/components/shop/auth-card";
import { ForgotPasswordForm } from "@/components/forms/auth-forms";

export const metadata: Metadata = { title: "Glemt passord", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Glemt passord" intro="Skriv inn e-postadressen din, så sender vi en lenke for å velge nytt passord.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
