export const ORDER_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "info" | "gold" | "outline" }> = {
  pending_payment: { label: "Venter på betaling", variant: "warning" },
  paid: { label: "Betalt", variant: "info" },
  processing: { label: "Under behandling", variant: "info" },
  shipped: { label: "Sendt", variant: "gold" },
  delivered: { label: "Levert", variant: "success" },
  cancelled: { label: "Kansellert", variant: "secondary" },
  refunded: { label: "Refundert", variant: "secondary" },
};

export const PAYMENT_STATUS: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "info" }> = {
  unpaid: { label: "Ikke betalt", variant: "warning" },
  pending: { label: "Venter", variant: "warning" },
  paid: { label: "Betalt", variant: "success" },
  failed: { label: "Feilet/avbrutt", variant: "destructive" },
  refunded: { label: "Refundert", variant: "secondary" },
  partially_refunded: { label: "Delvis refundert", variant: "secondary" },
  invoiced: { label: "Fakturert", variant: "info" },
};

export const PAYMENT_METHOD: Record<string, string> = {
  card: "Kort (Stripe)",
  vipps: "Vipps",
  invoice: "Faktura (handlekonto)",
};

export const SHIPMENT_STATUS: Record<string, string> = {
  created: "Opprettet",
  in_transit: "Under transport",
  ready_for_pickup: "Klar til henting",
  delivered: "Levert",
  returned: "Returnert",
  exception: "Avvik",
};

export const RETURN_STATUS: Record<string, { label: string; variant: "warning" | "info" | "success" | "destructive" | "secondary" }> = {
  requested: { label: "Mottatt forespørsel", variant: "warning" },
  approved: { label: "Godkjent – send varen", variant: "info" },
  rejected: { label: "Avslått", variant: "destructive" },
  received: { label: "Vare mottatt", variant: "info" },
  refunded: { label: "Refundert", variant: "success" },
  closed: { label: "Avsluttet", variant: "secondary" },
};

export const INVOICE_STATUS: Record<string, { label: string; variant: "warning" | "success" | "destructive" | "secondary" }> = {
  open: { label: "Åpen", variant: "warning" },
  paid: { label: "Betalt", variant: "success" },
  overdue: { label: "Forfalt", variant: "destructive" },
  cancelled: { label: "Kansellert", variant: "secondary" },
  credited: { label: "Kreditert", variant: "secondary" },
};

export const CREDIT_STATUS: Record<string, { label: string; variant: "warning" | "success" | "destructive" | "secondary" | "info" }> = {
  pending: { label: "Venter på aktivering", variant: "warning" },
  active: { label: "Aktiv", variant: "success" },
  suspended: { label: "Sperret", variant: "destructive" },
  closed: { label: "Avsluttet", variant: "secondary" },
};

export const APPLICATION_STATUS: Record<string, { label: string; variant: "warning" | "success" | "destructive" | "secondary" | "info" }> = {
  submitted: { label: "Mottatt", variant: "info" },
  under_review: { label: "Under behandling", variant: "warning" },
  approved: { label: "Godkjent", variant: "success" },
  rejected: { label: "Avslått", variant: "destructive" },
  withdrawn: { label: "Trukket", variant: "secondary" },
};
