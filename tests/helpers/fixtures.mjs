/**
 * Données et helpers communs pour les tests.
 *
 * Note : par défaut on utilise un pays/ville sans zone explicite ("Mars", "Cratère")
 * pour que la zone soit "international" et le shipping facile à prévoir.
 * Si besoin d'une zone précise, surcharger customer.country / customer.city.
 */
import { http } from "./http.mjs";

export const sampleCustomer = {
  name: "Aïssatou Test",
  email: "aissatou.test@example.com",
  phone: "+221770000000",
  city: "Dakar",
  country: "Sénégal",
};

export function sampleLine(overrides = {}) {
  return {
    lineId: "line-1",
    productKey: "test-product",
    variationId: "default",
    title: "Pièce test",
    size: "M",
    variationLabel: "Pièce",
    priceXof: 50000,
    qty: 1,
    ...overrides,
  };
}

/**
 * Construit un payload de commande avec shipping calculé via /shipping/quote
 * pour respecter la validation côté serveur (qui re-calcule).
 */
export async function buildOrderPayload(overrides = {}) {
  const lines = overrides.lines ?? [sampleLine()];
  const subtotal = lines.reduce((s, l) => s + l.priceXof * l.qty, 0);
  const customer = { ...sampleCustomer, ...(overrides.customer ?? {}) };

  const quoteRes = await http("/api/store/shipping/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      country: customer.country,
      city: customer.city,
      subtotalXof: subtotal,
    }),
  });
  const shippingXof = quoteRes.body?.shippingXof ?? 0;
  const shippingZoneId = quoteRes.body?.zone?.id ?? null;

  return {
    customer,
    lines,
    subtotalXof: subtotal,
    discountXof: 0,
    shippingXof,
    shippingZoneId,
    totalXof: subtotal + shippingXof,
    paymentMethod: "whatsapp",
    ...overrides,
  };
}

/** Version synchrone simple — totalXof = subtotalXof, à n'utiliser que pour tester les erreurs. */
export function sampleOrderPayload(overrides = {}) {
  const lines = overrides.lines ?? [sampleLine()];
  const subtotal = lines.reduce((s, l) => s + l.priceXof * l.qty, 0);
  return {
    customer: sampleCustomer,
    lines,
    subtotalXof: subtotal,
    discountXof: 0,
    shippingXof: 0,
    totalXof: subtotal,
    paymentMethod: "whatsapp",
    ...overrides,
  };
}
