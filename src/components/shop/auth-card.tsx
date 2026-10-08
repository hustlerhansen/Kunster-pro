import { isSupabaseConfigured } from "@/lib/env";
import { Alert } from "@/components/ui/alert";

export function AuthCard({ title, intro, children }: { title: string; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="container-page flex justify-center py-12 sm:py-16">
      <div className="w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-semibold">{title}</h1>
        {intro && <div className="mt-2 text-sm text-muted-foreground">{intro}</div>}
        {!isSupabaseConfigured() && (
          <Alert variant="warning" className="mt-5">
            Kontofunksjoner krever at Supabase er koblet til (se README). I demomodus kan du handle og teste handlekurven, men ikke logge inn.
          </Alert>
        )}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
