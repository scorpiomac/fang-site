import { orderStatusLabel, paymentStatusLabel } from "@/lib/orderStatus";

export { orderStatusLabel, paymentStatusLabel };

const SESSION_KEY = "fang-customer-session";
const CUSTOMER_KEY = "fang-customer-profile";

export type Customer = {
  id: string;
  email: string;
  name: string;
  phone: string;
  city: string;
  country: string;
  createdAt: string;
  lastLoginAt?: string | null;
};

export type OrderLine = {
  title: string;
  size: string;
  variationLabel: string;
  qty: number;
  priceXof: number;
  image?: string | null;
};

export type CustomerOrder = {
  id: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt?: string;
  totalXof: number;
  subtotalXof?: number;
  discountXof: number;
  promoCode: string | null;
  lineCount?: number;
  lines: OrderLine[];
  notes?: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
    city: string;
    country: string;
  };
};

export type AccountSummary = {
  totalOrders: number;
  totalSpentXof: number;
  pendingOrders: number;
  activeOrders: number;
  lastOrderId: string | null;
};

export function getCustomerToken(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function setCustomerSession(token: string, customer: Customer) {
  localStorage.setItem(SESSION_KEY, token);
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
}

export function getStoredCustomer(): Customer | null {
  try {
    const raw = localStorage.getItem(CUSTOMER_KEY);
    return raw ? (JSON.parse(raw) as Customer) : null;
  } catch {
    return null;
  }
}

export function clearCustomerSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(CUSTOMER_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getCustomerToken() ?? "";
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "x-customer-token": token,
    "Content-Type": "application/json",
  };
}

async function customerRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/store${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers as Record<string, string>) },
  });
  if (res.status === 401) {
    clearCustomerSession();
    throw new Error("Session expirée. Reconnectez-vous.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Erreur HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function registerCustomer(body: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  city?: string;
  country?: string;
}) {
  const res = await fetch("/api/store/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Inscription impossible.");
  }
  const data = (await res.json()) as { sessionToken: string; customer: Customer };
  setCustomerSession(data.sessionToken, data.customer);
  return data.customer;
}

export async function loginCustomer(email: string, password: string) {
  const res = await fetch("/api/store/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Connexion impossible.");
  }
  const data = (await res.json()) as { sessionToken: string; customer: Customer };
  setCustomerSession(data.sessionToken, data.customer);
  return data.customer;
}

export async function logoutCustomer() {
  const token = getCustomerToken();
  if (token) {
    try {
      await fetch("/api/store/auth/logout", { method: "POST", headers: authHeaders() });
    } catch {
      /* ignore */
    }
  }
  clearCustomerSession();
}

export async function trackGuestOrder(orderId: string, email: string) {
  const res = await fetch("/api/store/orders/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: orderId.trim(), email: email.trim() }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Commande introuvable.");
  }
  return (await res.json()) as { order: CustomerOrder };
}

export type CustomerAddress = {
  id: string;
  label: string;
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  type: "shipping" | "billing" | "both";
  isDefault: boolean;
  createdAt: string;
};

export const customerApi = {
  fetchMe: () => customerRequest<{ customer: Customer }>("/auth/me"),
  fetchSummary: () => customerRequest<{ summary: AccountSummary }>("/account/summary"),
  updateProfile: (patch: Partial<Pick<Customer, "name" | "phone" | "city" | "country">>) =>
    customerRequest<{ customer: Customer }>("/account/profile", {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    customerRequest<{ ok: boolean; message: string }>("/account/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  fetchOrders: () => customerRequest<{ orders: CustomerOrder[] }>("/account/orders"),
  fetchOrder: (id: string) => customerRequest<{ order: CustomerOrder }>(`/account/orders/${id}`),
  fetchAddresses: () =>
    customerRequest<{ addresses: CustomerAddress[] }>("/account/addresses"),
  addAddress: (address: Partial<CustomerAddress>) =>
    customerRequest<{ address: CustomerAddress }>("/account/addresses", {
      method: "POST",
      body: JSON.stringify(address),
    }),
  updateAddress: (id: string, patch: Partial<CustomerAddress>) =>
    customerRequest<{ address: CustomerAddress }>(`/account/addresses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteAddress: (id: string) =>
    customerRequest<{ ok: boolean }>(`/account/addresses/${id}`, { method: "DELETE" }),
};

export function customerAuthHeaders(): Record<string, string> {
  return authHeaders();
}
