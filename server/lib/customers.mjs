import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, writeJson, ensureFile } from "./jsonStore.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CUSTOMERS_FILE = path.join(path.resolve(__dirname, "../../data"), "customers.json");
const ORDERS_FILE = path.join(path.resolve(__dirname, "../../data"), "orders.json");

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

ensureFile(CUSTOMERS_FILE, { customers: [] });

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64, SCRYPT_PARAMS).toString("hex");
}

function timingSafeEqual(a, b) {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function load() {
  return readJson(CUSTOMERS_FILE, { customers: [] });
}

function save(data) {
  writeJson(CUSTOMERS_FILE, data);
}

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

export function toPublicCustomer(customer) {
  if (!customer) return null;
  return {
    id: customer.id,
    email: customer.email,
    name: customer.name,
    phone: customer.phone ?? "",
    city: customer.city ?? "",
    country: customer.country ?? "Sénégal",
    createdAt: customer.createdAt,
    lastLoginAt: customer.lastLoginAt ?? null,
  };
}

export function getCustomerById(id) {
  return load().customers.find((c) => c.id === id) ?? null;
}

export function getCustomerByEmail(email) {
  const normalized = normalizeEmail(email);
  return load().customers.find((c) => c.email === normalized) ?? null;
}

export function verifyCustomerPassword(email, password) {
  const customer = getCustomerByEmail(email);
  if (!customer || !customer.active) return null;
  const hash = hashPassword(String(password), customer.salt);
  if (!timingSafeEqual(hash, customer.passwordHash)) return null;
  return customer;
}

export function touchCustomerLogin(customerId) {
  const data = load();
  const customer = data.customers.find((c) => c.id === customerId);
  if (!customer) return;
  customer.lastLoginAt = new Date().toISOString();
  save(data);
}

export function registerCustomer(body) {
  const data = load();
  const email = normalizeEmail(body.email);
  if (!email.includes("@")) return { error: "E-mail invalide." };
  if (data.customers.some((c) => c.email === email)) {
    return { error: "Un compte existe déjà avec cet e-mail." };
  }
  if (!body.password || String(body.password).length < 8) {
    return { error: "Mot de passe min. 8 caractères." };
  }
  if (!body.name?.trim()) return { error: "Nom requis." };

  const salt = crypto.randomBytes(16).toString("hex");
  const customer = {
    id: crypto.randomUUID(),
    email,
    name: String(body.name).trim(),
    phone: String(body.phone ?? "").trim(),
    city: String(body.city ?? "").trim(),
    country: String(body.country ?? "Sénégal").trim() || "Sénégal",
    passwordHash: hashPassword(String(body.password), salt),
    salt,
    active: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  };
  data.customers.push(customer);
  save(data);
  linkPastOrdersToCustomer(customer.id, email);
  return { customer: toPublicCustomer(customer) };
}

function linkPastOrdersToCustomer(customerId, email) {
  const ordersData = readJson(ORDERS_FILE, { orders: [], lastNumber: 0 });
  let changed = false;
  for (const order of ordersData.orders) {
    if (!order.customerId && normalizeEmail(order.customer?.email) === email) {
      order.customerId = customerId;
      changed = true;
    }
  }
  if (changed) writeJson(ORDERS_FILE, ordersData);
}

export function updateCustomerProfile(customerId, patch) {
  const data = load();
  const idx = data.customers.findIndex((c) => c.id === customerId);
  if (idx === -1) return { error: "Compte introuvable." };

  const customer = data.customers[idx];
  if (patch.name !== undefined) customer.name = String(patch.name).trim() || customer.name;
  if (patch.phone !== undefined) customer.phone = String(patch.phone).trim();
  if (patch.city !== undefined) customer.city = String(patch.city).trim();
  if (patch.country !== undefined) {
    customer.country = String(patch.country).trim() || customer.country;
  }
  customer.updatedAt = new Date().toISOString();
  data.customers[idx] = customer;
  save(data);
  return { customer: toPublicCustomer(customer) };
}

export function changeCustomerPassword(customerId, currentPassword, newPassword) {
  const data = load();
  const customer = data.customers.find((c) => c.id === customerId);
  if (!customer) return { ok: false, error: "Compte introuvable." };
  const hash = hashPassword(String(currentPassword), customer.salt);
  if (!timingSafeEqual(hash, customer.passwordHash)) {
    return { ok: false, error: "Mot de passe actuel incorrect." };
  }
  if (!newPassword || String(newPassword).length < 8) {
    return { ok: false, error: "Nouveau mot de passe min. 8 caractères." };
  }
  customer.salt = crypto.randomBytes(16).toString("hex");
  customer.passwordHash = hashPassword(String(newPassword), customer.salt);
  customer.updatedAt = new Date().toISOString();
  save(data);
  return { ok: true };
}

/* ─── Adresses multiples ─── */

export function listAddresses(customerId) {
  const customer = getCustomerById(customerId);
  if (!customer) return [];
  return [...(customer.addresses ?? [])];
}

export function addAddress(customerId, address) {
  const data = load();
  const customer = data.customers.find((c) => c.id === customerId);
  if (!customer) return { error: "Compte introuvable." };
  customer.addresses = customer.addresses ?? [];
  const entry = {
    id: crypto.randomUUID(),
    label: String(address.label ?? "Adresse").slice(0, 50),
    fullName: String(address.fullName ?? customer.name).trim(),
    line1: String(address.line1 ?? "").trim(),
    line2: String(address.line2 ?? "").trim(),
    city: String(address.city ?? "").trim(),
    postalCode: String(address.postalCode ?? "").trim(),
    country: String(address.country ?? "Sénégal").trim() || "Sénégal",
    phone: String(address.phone ?? customer.phone ?? "").trim(),
    type: ["shipping", "billing", "both"].includes(address.type) ? address.type : "shipping",
    isDefault: Boolean(address.isDefault),
    createdAt: new Date().toISOString(),
  };
  // Si défaut, désactiver les autres défauts du même type
  if (entry.isDefault) {
    customer.addresses = customer.addresses.map((a) =>
      a.type === entry.type || a.type === "both" || entry.type === "both"
        ? { ...a, isDefault: false }
        : a
    );
  }
  customer.addresses.push(entry);
  // Si c'est la première adresse du type, en faire le défaut
  const sameType = customer.addresses.filter(
    (a) => a.type === entry.type || a.type === "both" || entry.type === "both"
  );
  if (sameType.length === 1) entry.isDefault = true;
  save(data);
  return { address: entry };
}

export function updateAddress(customerId, addressId, patch) {
  const data = load();
  const customer = data.customers.find((c) => c.id === customerId);
  if (!customer) return { error: "Compte introuvable." };
  const addrs = customer.addresses ?? [];
  const idx = addrs.findIndex((a) => a.id === addressId);
  if (idx === -1) return { error: "Adresse introuvable." };
  const next = { ...addrs[idx] };
  for (const k of [
    "label",
    "fullName",
    "line1",
    "line2",
    "city",
    "postalCode",
    "country",
    "phone",
  ]) {
    if (patch[k] !== undefined) next[k] = String(patch[k]).trim();
  }
  if (patch.type !== undefined && ["shipping", "billing", "both"].includes(patch.type)) {
    next.type = patch.type;
  }
  if (patch.isDefault === true) {
    next.isDefault = true;
    for (const a of addrs) {
      if (a.id !== addressId && (a.type === next.type || a.type === "both" || next.type === "both")) {
        a.isDefault = false;
      }
    }
  } else if (patch.isDefault === false) {
    next.isDefault = false;
  }
  addrs[idx] = next;
  customer.addresses = addrs;
  save(data);
  return { address: next };
}

export function deleteAddress(customerId, addressId) {
  const data = load();
  const customer = data.customers.find((c) => c.id === customerId);
  if (!customer) return { error: "Compte introuvable." };
  const before = (customer.addresses ?? []).length;
  customer.addresses = (customer.addresses ?? []).filter((a) => a.id !== addressId);
  if (customer.addresses.length === before) return { error: "Adresse introuvable." };
  save(data);
  return { ok: true };
}

export function getDefaultShippingAddress(customerId) {
  const list = listAddresses(customerId);
  return (
    list.find((a) => a.isDefault && (a.type === "shipping" || a.type === "both")) ??
    list.find((a) => a.type === "shipping" || a.type === "both") ??
    null
  );
}

export function resetCustomerPassword(customerId, newPassword) {
  if (!newPassword || String(newPassword).length < 8) {
    return { ok: false, error: "Nouveau mot de passe min. 8 caractères." };
  }
  const data = load();
  const customer = data.customers.find((c) => c.id === customerId);
  if (!customer) return { ok: false, error: "Compte introuvable." };
  customer.salt = crypto.randomBytes(16).toString("hex");
  customer.passwordHash = hashPassword(String(newPassword), customer.salt);
  customer.updatedAt = new Date().toISOString();
  save(data);
  return { ok: true };
}

export function listCustomers() {
  return load()
    .customers.map(toPublicCustomer)
    .sort((a, b) => a.email.localeCompare(b.email));
}
