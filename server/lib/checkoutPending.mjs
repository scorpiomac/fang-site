import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { readJson, writeJson, ensureFile } from "./jsonStore.mjs";
import { withFileLock } from "./fileLock.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(path.resolve(__dirname, "../../data"), "checkoutPending.json");

const TTL_MS = 6 * 60 * 60 * 1000; // 6 heures
const REF_PREFIX = "CHK";

ensureFile(FILE, { items: {} });

function load() {
  return readJson(FILE, { items: {} });
}

function save(data) {
  writeJson(FILE, data);
}

/**
 * Génère une référence unique de commande pending.
 *   CHK-YYYYMMDDHHMMSS-XXXXXX
 */
export function generateRefCommand() {
  const d = new Date();
  const stamp =
    d.getUTCFullYear().toString() +
    String(d.getUTCMonth() + 1).padStart(2, "0") +
    String(d.getUTCDate()).padStart(2, "0") +
    String(d.getUTCHours()).padStart(2, "0") +
    String(d.getUTCMinutes()).padStart(2, "0") +
    String(d.getUTCSeconds()).padStart(2, "0");
  const hex = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${REF_PREFIX}-${stamp}-${hex}`;
}

/**
 * Stocke un panier en attente. La commande Django/Express n'est PAS encore créée.
 * @param {string} ref - référence unique (CHK-...)
 * @param {object} payload - {provider, amountXof, customer, lines, totals, sessionToken?, promoCode?}
 */
export function savePending(ref, payload) {
  return withFileLock(FILE, () => {
    const data = load();
    data.items[ref] = {
      ref,
      ...payload,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + TTL_MS).toISOString(),
      isProcessed: false,
      processedAt: null,
      orderId: null,
      ipnLogs: [],
      gatewayMeta: null,
    };
    save(data);
    return data.items[ref];
  });
}

export function getPending(ref) {
  const item = load().items[ref];
  if (!item) return null;
  if (new Date(item.expiresAt) < new Date()) return null;
  return item;
}

/**
 * Ajoute une entrée au journal IPN (utile pour debug et idempotence).
 */
export function appendIpnLog(ref, entry) {
  return withFileLock(FILE, () => {
    const data = load();
    const item = data.items[ref];
    if (!item) return null;
    item.ipnLogs = item.ipnLogs ?? [];
    item.ipnLogs.unshift({ at: new Date().toISOString(), ...entry });
    if (item.ipnLogs.length > 20) item.ipnLogs.length = 20;
    save(data);
    return item;
  });
}

/**
 * Marque un pending comme traité (commande créée). Idempotent.
 */
export function markProcessed(ref, orderId, gatewayMeta = null) {
  return withFileLock(FILE, () => {
    const data = load();
    const item = data.items[ref];
    if (!item) return null;
    if (item.isProcessed) return item; // idempotent
    item.isProcessed = true;
    item.processedAt = new Date().toISOString();
    item.orderId = orderId;
    if (gatewayMeta) item.gatewayMeta = gatewayMeta;
    save(data);
    return item;
  });
}

export function listPending({ includeExpired = false } = {}) {
  const items = Object.values(load().items);
  const now = new Date();
  return items.filter((it) => includeExpired || new Date(it.expiresAt) >= now);
}

/**
 * Purge les pending expirés ET traités plus vieux que 30 jours.
 * À appeler périodiquement (au boot).
 */
export function purgePending() {
  return withFileLock(FILE, () => {
    const data = load();
    const now = Date.now();
    const cutoff = now - 30 * 24 * 60 * 60 * 1000;
    for (const [ref, item] of Object.entries(data.items)) {
      const expired = new Date(item.expiresAt).getTime() < now;
      const oldProcessed =
        item.isProcessed && new Date(item.processedAt ?? 0).getTime() < cutoff;
      if (expired || oldProcessed) {
        delete data.items[ref];
      }
    }
    save(data);
  });
}
