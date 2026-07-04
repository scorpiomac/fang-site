/**
 * Helpers HTTP pour les tests d'intégration.
 * Utilise les variables d'env injectées par scripts/test-runner.mjs :
 *   FANG_TEST_BASE_URL, FANG_TEST_ADMIN_EMAIL, FANG_TEST_ADMIN_PASSWORD
 */
const BASE = process.env.FANG_TEST_BASE_URL ?? "http://localhost:5170";
const ADMIN_EMAIL = process.env.FANG_TEST_ADMIN_EMAIL ?? "admin-tests@fang.local";
const ADMIN_PASSWORD = process.env.FANG_TEST_ADMIN_PASSWORD ?? "";

export const baseUrl = BASE;
export const adminEmail = ADMIN_EMAIL;
export const adminPassword = ADMIN_PASSWORD;

export async function http(pathname, init = {}) {
  const url = pathname.startsWith("http") ? pathname : `${BASE}${pathname}`;
  const res = await fetch(url, init);
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { _raw: text };
  }
  return { status: res.status, headers: res.headers, body, text };
}

export async function adminLogin() {
  const res = await http("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (res.status !== 200 || !res.body?.sessionToken) {
    throw new Error(`adminLogin failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.sessionToken;
}

export function adminAuth(token) {
  return {
    Authorization: `Bearer ${token}`,
    "x-session-token": token,
    "Content-Type": "application/json",
  };
}

export function customerAuth(token) {
  return {
    Authorization: `Bearer ${token}`,
    "x-customer-token": token,
    "Content-Type": "application/json",
  };
}

export async function adminFetch(token, pathname, init = {}) {
  return http(pathname, {
    ...init,
    headers: { ...adminAuth(token), ...(init.headers ?? {}) },
  });
}

export async function storeFetch(pathname, init = {}) {
  return http(pathname, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

/** Génère un email unique pour éviter les collisions de tests parallèles. */
export function uniqueEmail(prefix = "client") {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
}
