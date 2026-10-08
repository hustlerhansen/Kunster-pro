import type { Metadata } from "next";
import { AuthCard } from "@/components/shop/auth-card";
import { ResetPasswordForm } from "@/components/forms/auth-forms";

export const metadata: Metadata = { title: "Velg nytt passord", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Velg nytt passord">
      <ResetPasswordForm />
    </AuthCard>
  );
}
