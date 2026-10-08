import { PageHeader, Panel } from "@/components/admin/ui";
import { ActionForm, Check, Select, TextInput } from "@/components/admin/form-controls";
import { Alert } from "@/components/ui/alert";
import { getSettings } from "@/lib/data/catalog";
import { integrations } from "@/lib/env";
import { saveSettings } from "../_actions/content";

export const metadata = { title: "Innstillinger" };

const ICONS = ["truck", "gift", "star", "card", "headset", "map", "shield"].map((v) => ({ value: v, label: v }));

export default async function AdminSettings() {
  const s = await getSettings();
  return (
    <div className="space-y-6">
      <PageHeader title="Innstillinger" description="Endringer krever administratorrolle og logges." />

      <Panel title="Leveringstid og fri frakt">
        <ActionForm action={saveSettings}>
          <input type="hidden" name="section" value="delivery" />
          <Alert variant="warning">Ikke lov levering på f.eks. «1–3 dager» før logistikken faktisk støtter dette. Leveringstid vises kun når den er aktivert her.</Alert>
          <div className="grid gap-3 md:grid-cols-3">
            <TextInput label="Leveringstid (tekst)" name="delivery_time_text" defaultValue={s.delivery.delivery_time_text ?? ""} placeholder="F.eks. 2–5 virkedager" />
            <TextInput label="Utsendelse (tekst)" name="dispatch_text" defaultValue={s.delivery.dispatch_text ?? ""} placeholder="F.eks. Sendes innen 1 virkedag" />
            <TextInput label="Fri frakt over (kr) – vises i butikken" name="free_shipping_threshold" defaultValue={s.delivery.free_shipping_threshold_ore ? String(s.delivery.free_shipping_threshold_ore / 100) : ""} />
          </div>
          <Check label="Vis leveringstid i butikken" name="show_delivery_time" defaultChecked={s.delivery.show_delivery_time} />
          <Check label="Jeg bekrefter at leveringstiden er dokumentert av logistikkpartner" name="logistics_confirmed" />
          <p className="text-xs text-muted-foreground">Selve fraktberegningen styres av fraktmetodene under «Frakt».</p>
        </ActionForm>
      </Panel>

      <Panel title="Toppbanner">
        <ActionForm action={saveSettings}>
          <input type="hidden" name="section" value="banner" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="grid gap-3 md:grid-cols-[140px_1fr_1fr]">
              <Select label={`Ikon ${i + 1}`} name={`icon_${i}`} defaultValue={s.banner.items[i]?.icon ?? "star"} options={ICONS} />
              <TextInput label="Tekst" name={`text_${i}`} defaultValue={s.banner.items[i]?.text ?? ""} />
              <TextInput label="Lenke (intern, f.eks. /kontakt)" name={`href_${i}`} defaultValue={s.banner.items[i]?.href ?? ""} />
            </div>
          ))}
        </ActionForm>
      </Panel>

      <Panel title="Betalingsmetoder">
        <ActionForm action={saveSettings}>
          <input type="hidden" name="section" value="payments" />
          <p className="text-sm text-muted-foreground">Tilgjengelige metoder styres av faktisk integrasjon. Metoder uten gyldige nøkler vises ikke i kassen.</p>
          <Check label={`Kort via Stripe ${integrations.stripe() ? "(konfigurert)" : "(mangler nøkler – vises ikke)"}`} name="card_enabled" defaultChecked={s.payments.card_enabled} />
          <Check label={`Vipps ${integrations.vipps() ? "(konfigurert)" : "(ikke konfigurert)"}`} name="vipps_enabled" defaultChecked={s.payments.vipps_enabled} />
          <Check label={`Faktura for godkjente bedriftskunder ${integrations.businessInvoice() ? "" : "(krever FEATURE_BUSINESS_INVOICE=true)"}`} name="invoice_enabled" defaultChecked={s.payments.invoice_enabled} />
        </ActionForm>
      </Panel>

      <Panel title="Firmaopplysninger (vises i bunntekst, kvitteringer og juridiske sider)">
        <ActionForm action={saveSettings}>
          <input type="hidden" name="section" value="company" />
          <Alert variant="info">Fyll inn ekte opplysninger fra Brønnøysundregistrene. Felt som står tomme vises som «ikke registrert ennå».</Alert>
          <div className="grid gap-3 md:grid-cols-3">
            <TextInput label="Juridisk navn" name="legal_name" defaultValue={s.company.legal_name ?? ""} />
            <TextInput label="Organisasjonsnummer" name="org_number" defaultValue={s.company.org_number ?? ""} />
            <TextInput label="Forretningsadresse" name="address" defaultValue={s.company.address ?? ""} />
            <TextInput label="E-post (kundeservice)" name="email" defaultValue={s.company.email ?? ""} />
            <TextInput label="Telefon" name="phone" defaultValue={s.company.phone ?? ""} />
          </div>
          <Check label="Registrert i Merverdiavgiftsregisteret (MVA)" name="vat_registered" defaultChecked={s.company.vat_registered} />
        </ActionForm>
      </Panel>

      <Panel title="Butikk og kundeservice">
        <ActionForm action={saveSettings}>
          <input type="hidden" name="section" value="store" />
          <div className="grid gap-3 md:grid-cols-3">
            <TextInput label="Butikknavn" name="name" defaultValue={s.store.name} />
            <TextInput label="Undertittel" name="tagline" defaultValue={s.store.tagline} />
            <TextInput label="Hovedbudskap" name="main_message" defaultValue={s.store.main_message} />
            <TextInput label="Kundeservice e-post" name="support_email" defaultValue={s.store.support_email ?? ""} />
            <TextInput label="Kundeservice telefon" name="support_phone" defaultValue={s.store.support_phone ?? ""} />
            <TextInput label="Åpningstider" name="support_hours" defaultValue={s.store.support_hours ?? ""} />
          </div>
        </ActionForm>
      </Panel>

      <Panel title="Forsidebilde (hero)">
        <ActionForm action={saveSettings}>
          <input type="hidden" name="section" value="hero" />
          <p className="text-sm text-muted-foreground">Last opp et lisensiert foto av en kunstner som arbeider med oljemaling (f.eks. til Supabase Storage) og lim inn URL-en. Tom = illustrasjon.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput label="Bilde-URL" name="image_url" defaultValue={s.hero.image_url ?? ""} />
            <TextInput label="Alt-tekst" name="image_alt" defaultValue={s.hero.image_alt ?? ""} />
          </div>
        </ActionForm>
      </Panel>
    </div>
  );
}
