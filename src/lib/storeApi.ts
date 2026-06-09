import type { CartLine } from "@/context/cartTypes";
import { customerAuthHeaders } from "@/lib/customerApi";

export type CreateOrderPayload = {
  customer: {
    name: string;
    email: string;
    phone: string;
    city: string;
    country: string;
  };
  lines: CartLine[];
  subtotalXof: number;
  discountXof: number;
  shippingXof?: number;
  taxXof?: number;
  totalXof: number;
  promoCode?: string | null;
  notes?: string;
  shippingZoneId?: string | null;
  paymentMethod?: string | null;
};

export type ShippingZoneOption = {
  id: string;
  name: string;
  etaDays: string;
  priceXof: number;
  freeAboveXof: number | null;
  countries: string[];
};

export type ShippingQuote = {
  zone: { id: string; name: string; etaDays: string; freeAboveXof: number | null } | null;
  shippingXof: number;
  free: boolean;
  message?: string;
};

export async function fetchShippingZones(): Promise<ShippingZoneOption[]> {
  try {
    const res = await fetch("/api/store/shipping/zones");
    if (!res.ok) return [];
    const { zones } = (await res.json()) as { zones: ShippingZoneOption[] };
    return zones;
  } catch {
    return [];
  }
}

export async function quoteShipping(payload: {
  zoneId?: string | null;
  country?: string;
  city?: string;
  subtotalXof: number;
}): Promise<ShippingQuote> {
  const res = await fetch("/api/store/shipping/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { zone: null, shippingXof: 0, free: false };
  return (await res.json()) as ShippingQuote;
}

export type PromoValidation = {
  valid: boolean;
  error?: string;
  promo?: { id: string; code: string; label: string; type: string; value: number };
  discountXof?: number;
  totalXof?: number;
};

export async function validatePromoCode(
  code: string,
  subtotalXof: number
): Promise<PromoValidation> {
  const res = await fetch("/api/store/promo/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, subtotalXof }),
  });
  const body = (await res.json()) as PromoValidation;
  if (!res.ok) return { valid: false, error: body.error ?? "Code invalide" };
  return body;
}

export type StorePage = {
  slug: string;
  title: string;
  intro?: string;
  body: string;
  enabled?: boolean;
  updatedAt?: string | null;
};

export async function fetchPages(): Promise<StorePage[]> {
  try {
    const res = await fetch("/api/store/pages");
    if (!res.ok) return [];
    const { pages } = (await res.json()) as { pages: StorePage[] };
    return pages;
  } catch {
    return [];
  }
}

export async function fetchPage(slug: string): Promise<StorePage | null> {
  try {
    const res = await fetch(`/api/store/pages/${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    const { page } = (await res.json()) as { page: StorePage };
    return page;
  } catch {
    return null;
  }
}

export async function submitContactMessage(payload: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<{ ok: boolean; message?: string; error?: string }> {
  const res = await fetch("/api/store/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: body.error ?? "Erreur d'envoi" };
  return body;
}

export async function subscribeNewsletter(email: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/store/newsletter/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: body.error ?? "Erreur" };
  return { ok: true };
}

export type CheckoutStartResponse =
  | {
      provider: "paytech";
      ref: string;
      orderId: string;
      mode: "popup";
      ipnUrl: string;
      env: "test" | "prod";
    }
  | {
      provider: "paydunya";
      ref: string;
      orderId: string;
      mode: "redirect";
      redirectUrl: string;
      token: string;
    }
  | {
      provider: "simulated";
      ref: string;
      order: { id: string; totalXof: number; status: string; paymentStatus: string };
    };

export async function startCheckout(
  payload: CreateOrderPayload
): Promise<CheckoutStartResponse> {
  const res = await fetch("/api/store/checkout/start", {
    method: "POST",
    headers: customerAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "Impossible de démarrer le paiement.");
  return body as CheckoutStartResponse;
}

export async function requestPaytechToken(ref: string): Promise<{ token: string; redirectUrl?: string }> {
  const res = await fetch("/api/store/checkout/paytech/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ref }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "Token PayTech indisponible.");
  return body;
}

export async function fetchPendingStatus(ref: string): Promise<{
  ref: string;
  provider: string;
  isProcessed: boolean;
  orderId: string | null;
  totalXof: number;
  expiresAt: string;
  paymentStatus: string | null;
  orderStatus: string | null;
}> {
  const res = await fetch(`/api/store/checkout/pending/${encodeURIComponent(ref)}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "Pending introuvable.");
  return body;
}

export async function submitOrder(payload: CreateOrderPayload): Promise<{
  id: string;
  totalXof: number;
  status: string;
}> {
  const res = await fetch("/api/store/orders", {
    method: "POST",
    headers: customerAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Impossible d'enregistrer la commande.");
  }
  const { order } = (await res.json()) as {
    order: { id: string; totalXof: number; status: string };
  };
  return order;
}
