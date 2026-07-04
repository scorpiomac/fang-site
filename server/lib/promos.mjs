import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { readJson, writeJson, ensureFile } from "./jsonStore.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMOS_FILE = path.join(path.resolve(__dirname, "../../data"), "promoCodes.json");

ensureFile(PROMOS_FILE, { promos: [] });

function load() {
  return readJson(PROMOS_FILE, { promos: [] });
}

function save(data) {
  writeJson(PROMOS_FILE, data);
}

function normalizeCode(code) {
  return String(code).trim().toUpperCase().replace(/\s+/g, "");
}

export function listPromos() {
  return load().promos.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getPromoByCode(code) {
  const normalized = normalizeCode(code);
  return load().promos.find((p) => p.code === normalized) ?? null;
}

export function getPromoById(id) {
  return load().promos.find((p) => p.id === id) ?? null;
}

function computeDiscount(promo, subtotalXof) {
  if (promo.type === "percent") {
    return Math.round(subtotalXof * (Math.min(100, Math.max(0, promo.value)) / 100));
  }
  return Math.min(subtotalXof, Math.max(0, promo.value));
}

export function validatePromo(code, subtotalXof) {
  const promo = getPromoByCode(code);
  if (!promo) return { valid: false, error: "Code promo invalide." };
  if (!promo.active) return { valid: false, error: "Ce code promo n'est plus actif." };
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    return { valid: false, error: "Ce code promo a expiré." };
  }
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
    return { valid: false, error: "Ce code promo a atteint sa limite d'utilisation." };
  }
  if (promo.minSubtotalXof != null && subtotalXof < promo.minSubtotalXof) {
    return {
      valid: false,
      error: `Minimum de commande : ${promo.minSubtotalXof.toLocaleString("fr-SN")} FCFA`,
    };
  }
  const discountXof = computeDiscount(promo, subtotalXof);
  return {
    valid: true,
    promo: {
      id: promo.id,
      code: promo.code,
      label: promo.label,
      type: promo.type,
      value: promo.value,
    },
    discountXof,
    totalXof: Math.max(0, subtotalXof - discountXof),
  };
}

export function incrementPromoUsage(code) {
  const data = load();
  const normalized = normalizeCode(code);
  const promo = data.promos.find((p) => p.code === normalized);
  if (!promo) return;
  promo.usedCount = (promo.usedCount ?? 0) + 1;
  save(data);
}

export function createPromo(body) {
  const data = load();
  const code = normalizeCode(body.code);
  if (!code) return { error: "Code requis." };
  if (data.promos.some((p) => p.code === code)) return { error: "Ce code existe déjà." };
  if (!["percent", "fixed"].includes(body.type)) return { error: "Type invalide." };
  const promo = {
    id: crypto.randomUUID(),
    code,
    label: body.label ?? code,
    type: body.type,
    value: Number(body.value) || 0,
    minSubtotalXof: body.minSubtotalXof != null ? Number(body.minSubtotalXof) : null,
    maxUses: body.maxUses != null ? Number(body.maxUses) : null,
    usedCount: 0,
    active: body.active !== false,
    expiresAt: body.expiresAt ?? null,
    description: body.description ?? "",
    createdAt: new Date().toISOString(),
  };
  data.promos.push(promo);
  save(data);
  return { promo };
}

export function updatePromo(id, patch) {
  const data = load();
  const idx = data.promos.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const promo = data.promos[idx];
  if (patch.code !== undefined) {
    const code = normalizeCode(patch.code);
    if (data.promos.some((p) => p.code === code && p.id !== id)) {
      return { error: "Ce code existe déjà." };
    }
    promo.code = code;
  }
  if (patch.label !== undefined) promo.label = patch.label;
  if (patch.type !== undefined) promo.type = patch.type;
  if (patch.value !== undefined) promo.value = Number(patch.value);
  if (patch.minSubtotalXof !== undefined) promo.minSubtotalXof = patch.minSubtotalXof;
  if (patch.maxUses !== undefined) promo.maxUses = patch.maxUses;
  if (patch.active !== undefined) promo.active = patch.active;
  if (patch.expiresAt !== undefined) promo.expiresAt = patch.expiresAt;
  if (patch.description !== undefined) promo.description = patch.description;
  promo.updatedAt = new Date().toISOString();
  data.promos[idx] = promo;
  save(data);
  return { promo };
}

export function deletePromo(id) {
  const data = load();
  const before = data.promos.length;
  data.promos = data.promos.filter((p) => p.id !== id);
  if (data.promos.length === before) return false;
  save(data);
  return true;
}
