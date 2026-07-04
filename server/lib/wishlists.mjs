import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, writeJson, ensureFile } from "./jsonStore.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(path.resolve(__dirname, "../../data"), "wishlists.json");

ensureFile(FILE, { items: {} });

function load() {
  return readJson(FILE, { items: {} });
}
function save(data) {
  writeJson(FILE, data);
}

export function listWishlist(customerId) {
  const data = load();
  return data.items[customerId] ?? [];
}

export function addWishlist(customerId, productSlug) {
  const data = load();
  const list = data.items[customerId] ?? [];
  if (!list.includes(productSlug)) list.push(productSlug);
  data.items[customerId] = list;
  save(data);
  return list;
}

export function removeWishlist(customerId, productSlug) {
  const data = load();
  const list = (data.items[customerId] ?? []).filter((s) => s !== productSlug);
  data.items[customerId] = list;
  save(data);
  return list;
}

export function clearWishlist(customerId) {
  const data = load();
  data.items[customerId] = [];
  save(data);
}
