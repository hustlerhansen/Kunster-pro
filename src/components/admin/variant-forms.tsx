"use client";

import { useMemo, useState } from "react";
import { ActionForm, Check, TextArea, TextInput } from "./form-controls";
import { saveVariant, saveVariantCost, addProductImage } from "@/app/admin/_actions/products";
import { landedCostOre, profit, suggestPrice, formatPercent } from "@/lib/pricing/profit";
import { formatPriceExact } from "@/lib/money";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface VariantRow {
  id: string;
  name: string;
  sku: string;
  price_ore: number;
  vat_rate: number;
  weight_g: number | null;
  min_stock: number;
  reorder_quantity: number | null;
  color_hex: string | null;
  barcode: string | null;
  is_active: boolean;
  sort_order: number;
  options: Record<string, string | number>;
  stock_on_hand: number;
  stock_reserved: number;
  stock_available: number;
}

export interface CostRow {
  supplier_id: string | null;
  purchase_price: number;
  currency: string;
  exchange_rate: number;
  freight_per_unit_ore: number;
  duty_per_unit_ore: number;
  other_per_unit_ore: number;
  packaging_per_unit_ore: number;
  payment_fee_percent: number;
  landed_cost_ore: number;
  is_demo: boolean;
  notes: string | null;
}

export function VariantForm({ productId, variant }: { productId: string; variant?: VariantRow }) {
  return (
    <ActionForm action={saveVariant} submitLabel={variant ? "Lagre variant" : "Legg til variant"}>
      <input type="hidden" name="product_id" value={productId} />
      {variant && <input type="hidden" name="id" value={variant.id} />}
      <div className="grid gap-3 md:grid-cols-4">
        <TextInput label="Variantnavn *" name="name" defaultValue={variant?.name} placeholder="F.eks. 37 ml" required />
        <TextInput label="SKU *" name="sku" defaultValue={variant?.sku} required />
        <TextInput label="Pris inkl. MVA (kr) *" name="price" defaultValue={variant ? String(variant.price_ore / 100) : ""} inputMode="decimal" required />
        <TextInput label="MVA %" name="vat_rate" defaultValue={String(variant?.vat_rate ?? 25)} inputMode="decimal" />
        <TextInput label="Vekt (g)" name="weight_g" defaultValue={variant?.weight_g ?? ""} type="number" />
        <TextInput label="Minimumsbeholdning" name="min_stock" defaultValue={variant?.min_stock ?? 0} type="number" />
        <TextInput label="Standard bestillingsantall" name="reorder_quantity" defaultValue={variant?.reorder_quantity ?? ""} type="number" />
        <TextInput label="Fargekode (#RRGGBB)" name="color_hex" defaultValue={variant?.color_hex ?? ""} />
        <TextInput label="Strekkode (EAN)" name="barcode" defaultValue={variant?.barcode ?? ""} />
        <TextInput label="Sortering" name="sort_order" defaultValue={variant?.sort_order ?? 0} type="number" />
      </div>
      <TextArea
        label="Variantspesifikasjoner (én per linje: nøkkel=verdi)"
        name="options"
        rows={3}
        defaultValue={Object.entries(variant?.options ?? {}).map(([k, v]) => `${k}=${v}`).join("\n")}
        hint="Gyldige nøkler: volume_ml, width_cm, height_cm, depth_cm, size, pack_count, weight_g …"
      />
      <Check label="Aktiv" name="is_active" defaultChecked={variant?.is_active ?? true} />
      {!variant && <p className="text-xs text-muted-foreground">Lagerbeholdning registreres via Lager eller varemottak (sporbart).</p>}
    </ActionForm>
  );
}

/** Kostprofil med live beregning av landed cost, DB, DG, påslag og margin. */
export function CostForm({
  productId,
  variant,
  cost,
  suppliers,
  vatRegistered,
}: {
  productId: string;
  variant: VariantRow;
  cost: CostRow | null;
  suppliers: { id: string; name: string; currency: string }[];
  vatRegistered: boolean;
}) {
  const [v, setV] = useState({
    purchase_price: String(cost?.purchase_price ?? ""),
    currency: cost?.currency ?? "NOK",
    exchange_rate: String(cost?.exchange_rate ?? 1),
    freight: String((cost?.freight_per_unit_ore ?? 0) / 100),
    duty: String((cost?.duty_per_unit_ore ?? 0) / 100),
    other: String((cost?.other_per_unit_ore ?? 0) / 100),
    packaging: String((cost?.packaging_per_unit_ore ?? 0) / 100),
    payment_fee_percent: String(cost?.payment_fee_percent ?? 0),
  });
  const [target, setTarget] = useState("50");
  const n = (s: string) => Number(s.replace(",", ".")) || 0;

  const calc = useMemo(() => {
    const landed = landedCostOre({
      purchasePrice: n(v.purchase_price),
      exchangeRate: n(v.exchange_rate) || 1,
      freightPerUnitOre: Math.round(n(v.freight) * 100),
      dutyPerUnitOre: Math.round(n(v.duty) * 100),
      otherPerUnitOre: Math.round(n(v.other) * 100),
      vatRegistered,
    });
    const p = profit({
      priceInclVatOre: variant.price_ore,
      vatRate: variant.vat_rate,
      landedCostOre: landed,
      packagingPerUnitOre: Math.round(n(v.packaging) * 100),
      paymentFeePercent: n(v.payment_fee_percent),
    });
    let suggestion: ReturnType<typeof suggestPrice> | null = null;
    try {
      suggestion = suggestPrice({
        variableCostOre: landed + Math.round(n(v.packaging) * 100),
        targetContributionRatio: n(target) / 100,
        vatRate: variant.vat_rate,
        paymentFeePercent: n(v.payment_fee_percent),
        roundToNine: true,
      });
    } catch {
      suggestion = null;
    }
    return { landed, p, suggestion };
  }, [v, target, variant, vatRegistered]);

  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((s) => ({ ...s, [k]: e.target.value }));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <ActionForm action={saveVariantCost} submitLabel="Lagre kostprofil">
        <input type="hidden" name="variant_id" value={variant.id} />
        <input type="hidden" name="product_id" value={productId} />
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor={`sup-${variant.id}`}>Leverandør</Label>
            <select id={`sup-${variant.id}`} name="supplier_id" defaultValue={cost?.supplier_id ?? ""} className="h-10 w-full rounded-md border bg-white px-3 text-sm">
              <option value="">– Ingen –</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.currency})
                </option>
              ))}
            </select>
          </div>
          <TextInput label="Innkjøpspris (valuta)" name="purchase_price" value={v.purchase_price} onChange={set("purchase_price")} inputMode="decimal" />
          <TextInput label="Valuta" name="currency" value={v.currency} onChange={set("currency")} maxLength={3} />
          <TextInput label="Valutakurs (NOK)" name="exchange_rate" value={v.exchange_rate} onChange={set("exchange_rate")} inputMode="decimal" />
          <TextInput label="Frakt per enhet (kr)" name="freight" value={v.freight} onChange={set("freight")} inputMode="decimal" />
          <TextInput label="Toll/import per enhet (kr)" name="duty" value={v.duty} onChange={set("duty")} inputMode="decimal" hint="Ekskl. fradragsberettiget import-MVA" />
          <TextInput label="Andre innkjøpskost. (kr)" name="other" value={v.other} onChange={set("other")} inputMode="decimal" />
          <TextInput label="Emballasje per enhet (kr)" name="packaging" value={v.packaging} onChange={set("packaging")} inputMode="decimal" />
          <TextInput label="Betalingsgebyr %" name="payment_fee_percent" value={v.payment_fee_percent} onChange={set("payment_fee_percent")} inputMode="decimal" />
          <TextInput label="Notat" name="notes" defaultValue={cost?.notes ?? ""} className="md:col-span-3" />
        </div>
      </ActionForm>
      <div className="space-y-3 rounded-md border bg-secondary/40 p-4 text-sm">
        <p className="font-semibold">Beregning ved pris {formatPriceExact(variant.price_ore)}</p>
        <dl className="space-y-1">
          <Row k="Pris ekskl. MVA" v={formatPriceExact(calc.p.priceExVatOre)} />
          <Row k="Landed cost" v={formatPriceExact(calc.landed)} />
          <Row k="Bruttofortjeneste" v={formatPriceExact(calc.p.grossProfitOre)} />
          <Row k="Variable kostnader" v={formatPriceExact(calc.p.variableCostsOre)} />
          <Row k="Dekningsbidrag (DB)" v={formatPriceExact(calc.p.contributionOre)} strong />
          <Row k="Dekningsgrad (DG)" v={formatPercent(calc.p.contributionRatio)} strong />
          <Row k="Bruttomargin" v={formatPercent(calc.p.grossMargin)} />
          <Row k="Påslag på kostpris" v={formatPercent(calc.p.markup)} />
        </dl>
        <p className="text-xs text-muted-foreground">Påslag måles mot kostpris, margin mot salgspris (ekskl. MVA). 100 % påslag = 50 % margin.</p>
        <div className="border-t pt-3">
          <Label htmlFor={`dg-${variant.id}`}>Prisforslag for ønsket DG (%)</Label>
          <Input id={`dg-${variant.id}`} value={target} onChange={(e) => setTarget(e.target.value)} inputMode="decimal" className="mt-1.5 h-8" />
          {calc.suggestion ? (
            <p className="mt-2">
              {formatPriceExact(calc.suggestion.exVatOre)} ekskl. MVA · <strong>{formatPriceExact(calc.suggestion.inclVatOre)} inkl. MVA</strong>
              {calc.suggestion.roundedInclVatOre && <span className="block text-xs text-muted-foreground">Avrundet: {formatPriceExact(calc.suggestion.roundedInclVatOre)}</span>}
            </p>
          ) : (
            <p className="mt-2 text-destructive">Ugyldig dekningsgrad.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-2 ${strong ? "font-semibold" : ""}`}>
      <dt>{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  );
}

export function ImageUploadForm({ productId }: { productId: string }) {
  return (
    <ActionForm action={addProductImage} submitLabel="Legg til bilde">
      <input type="hidden" name="product_id" value={productId} />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="img-file">Last opp (JPG/PNG/WebP, maks 5 MB)</Label>
          <Input id="img-file" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" />
        </div>
        <TextInput label="…eller bilde-URL (https)" name="url" placeholder="https://" />
        <TextInput label="Alternativ tekst (alt)" name="alt" placeholder="Beskriv bildet" />
      </div>
    </ActionForm>
  );
}
