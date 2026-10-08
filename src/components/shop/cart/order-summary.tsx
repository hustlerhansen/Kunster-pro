import { formatPrice } from "@/lib/money";
import type { CartTotals } from "@/lib/pricing/cart";

export function OrderSummary({ totals }: { totals: CartTotals }) {
  return (
    <dl className="space-y-2 text-sm" data-testid="order-summary">
      <Row label="Varer" value={formatPrice(totals.subtotal_before_discounts_ore)} />
      {totals.volume_discount_ore > 0 && <Row label="Mengderabatt" value={`−${formatPrice(totals.volume_discount_ore)}`} accent />}
      {totals.code_discount_ore > 0 && <Row label={`Rabattkode ${totals.code?.code ?? ""}`} value={`−${formatPrice(totals.code_discount_ore)}`} accent />}
      <Row
        label={`Frakt${totals.shipping ? ` – ${totals.shipping.name}` : ""}`}
        value={totals.shipping ? (totals.shipping.is_free ? "Gratis" : formatPrice(totals.shipping_ore)) : "–"}
      />
      <div className="flex items-baseline justify-between border-t pt-3 text-lg font-semibold">
        <dt>Totalt</dt>
        <dd data-testid="order-total">{formatPrice(totals.total_ore)}</dd>
      </div>
      <Row label="Herav MVA (25 %)" value={formatPrice(totals.vat_ore)} muted />
      <Row label="Sum ekskl. MVA" value={formatPrice(totals.total_ex_vat_ore)} muted />
    </dl>
  );
}

function Row({ label, value, accent, muted }: { label: string; value: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${muted ? "text-muted-foreground" : ""}`}>
      <dt>{label}</dt>
      <dd className={accent ? "font-medium text-success" : ""}>{value}</dd>
    </div>
  );
}
