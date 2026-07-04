export const ORDER_STATUS_FLOW = [
  "pending",
  "confirmed",
  "in_production",
  "ready",
  "shipped",
  "delivered",
] as const;

export type OrderStatus = (typeof ORDER_STATUS_FLOW)[number] | "cancelled";

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  in_production: "En production",
  ready: "Prête à expédier",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Paiement en attente",
  partial: "Paiement partiel",
  paid: "Payée",
  refunded: "Remboursée",
};

export function orderStatusLabel(status: string) {
  return ORDER_STATUS_LABELS[status] ?? status;
}

export function paymentStatusLabel(status: string) {
  return PAYMENT_STATUS_LABELS[status] ?? status;
}

export function orderStatusIndex(status: string) {
  if (status === "cancelled") return -1;
  return ORDER_STATUS_FLOW.indexOf(status as (typeof ORDER_STATUS_FLOW)[number]);
}
