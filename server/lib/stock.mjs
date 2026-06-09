import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, writeJson, ensureFile } from "./jsonStore.mjs";
import { withFileLock } from "./fileLock.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STOCK_FILE = path.join(path.resolve(__dirname, "../../data"), "stock.json");

/**
 * Structure :
 * {
 *   "chapterId/characterSlug": {
 *     "trackInventory": true,
 *     "variations": {
 *       "default": { "S": 5, "M": 3, "L": 0 },
 *       "veste": { "S": 2, ... }
 *     }
 *   }
 * }
 */

ensureFile(STOCK_FILE, { items: {} });

function load() {
  return readJson(STOCK_FILE, { items: {} });
}

function save(data) {
  writeJson(STOCK_FILE, data);
}

export function getAllStock() {
  return load().items;
}

export function getStockForProduct(productKey) {
  return load().items[productKey] ?? null;
}

export function getStockQty(productKey, variationId, size) {
  const entry = getStockForProduct(productKey);
  if (!entry || !entry.trackInventory) return Infinity;
  const v = entry.variations?.[variationId];
  if (!v) return 0;
  return Math.max(0, Number(v[size] ?? 0));
}

export function isInStock(productKey, variationId, size, qty = 1) {
  return getStockQty(productKey, variationId, size) >= qty;
}

export function setStock(productKey, entry) {
  const data = load();
  if (entry == null) {
    delete data.items[productKey];
  } else {
    data.items[productKey] = {
      trackInventory: Boolean(entry.trackInventory),
      variations: entry.variations ?? {},
    };
  }
  save(data);
  return data.items[productKey] ?? null;
}

export function setStockQty(productKey, variationId, size, qty) {
  const data = load();
  const item = data.items[productKey] ?? { trackInventory: true, variations: {} };
  item.variations[variationId] = item.variations[variationId] ?? {};
  item.variations[variationId][size] = Math.max(0, Math.floor(Number(qty) || 0));
  item.trackInventory = true;
  data.items[productKey] = item;
  save(data);
  return item;
}

/**
 * Validate puis décrément en un seul écriture. Renvoie {ok,errors} sans modifier si pénurie.
 * `lines` : [{productKey, variationId, size, qty}]
 */
export function reserveStock(lines) {
  return withFileLock(STOCK_FILE, () => {
    const data = load();
    const errors = [];
    for (const line of lines) {
      const item = data.items[line.productKey];
      if (!item || !item.trackInventory) continue;
      const available = Number(item.variations?.[line.variationId]?.[line.size] ?? 0);
      if (available < line.qty) {
        errors.push({
          productKey: line.productKey,
          variationId: line.variationId,
          size: line.size,
          requested: line.qty,
          available,
        });
      }
    }
    if (errors.length) return { ok: false, errors };
    for (const line of lines) {
      const item = data.items[line.productKey];
      if (!item || !item.trackInventory) continue;
      item.variations[line.variationId][line.size] -= line.qty;
    }
    save(data);
    return { ok: true };
  });
}

export function getStockSummary() {
  const items = load().items;
  const out = [];
  for (const [key, item] of Object.entries(items)) {
    if (!item.trackInventory) continue;
    let total = 0;
    let outOf = 0;
    let low = 0;
    for (const variation of Object.values(item.variations ?? {})) {
      for (const qty of Object.values(variation ?? {})) {
        total += Number(qty) || 0;
        if (Number(qty) === 0) outOf += 1;
        else if (Number(qty) <= 2) low += 1;
      }
    }
    out.push({ productKey: key, total, outOfStock: outOf, low });
  }
  return out;
}
