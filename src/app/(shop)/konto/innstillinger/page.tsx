import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm, DeleteAccountForm } from "@/components/shop/settings-forms";
import { ResetPasswordForm } from "@/components/forms/auth-forms";
import { CookieSettingsLink } from "@/components/shop/consent/cookie-banner";
import { getCurrentProfile } from "@/lib/auth";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Kontoinnstillinger</h2>
      <Card>
        <CardHeader>
          <CardTitle>Kontaktinformasjon og samtykker</CardTitle>
        </CardHeader>
        <CardContent>
          {profile && <ProfileForm profile={profile} />}
          <p className="mt-4 text-sm">
            Informasjonskapsler: <CookieSettingsLink className="underline" />
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Endre passord</CardTitle>
        </CardHeader>
        <CardContent className="max-w-md">
          <ResetPasswordForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Dine personopplysninger</CardTitle>
          <CardDescription>
            Du har rett til innsyn i, og eksport av, opplysningene vi har om deg (GDPR art. 15 og 20).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a href="/konto/eksport" className="inline-flex h-10 items-center rounded-md border bg-white px-4 text-sm font-medium hover:bg-secondary" download>
            Last ned mine data (JSON)
          </a>
        </CardContent>
      </Card>
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle>Slett konto</CardTitle>
          <CardDescription>
            Kontoen, adresser, favoritter og samtykker slettes. Ordre og fakturaer må etter bokføringsloven oppbevares i 5 år, og blir derfor
            anonymisert i stedet for slettet. Kontoen kan ikke slettes mens du har ordre under behandling eller ubetalte fakturaer.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-md">
          <DeleteAccountForm />
        </CardContent>
      </Card>
    </div>
  );
}
