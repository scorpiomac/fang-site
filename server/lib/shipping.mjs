import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { readJson, writeJson, ensureFile } from "./jsonStore.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHIPPING_FILE = path.join(path.resolve(__dirname, "../../data"), "shippingZones.json");

const DEFAULT_ZONES = {
  zones: [
    {
      id: "dakar",
      name: "Dakar (livraison express)",
      countries: ["Sénégal"],
      cities: ["Dakar", "Almadies", "Plateau", "Sacré-Cœur", "Ouakam", "Mermoz"],
      priceXof: 2000,
      freeAboveXof: 150000,
      etaDays: "24–48 h",
      active: true,
    },
    {
      id: "senegal",
      name: "Reste du Sénégal",
      countries: ["Sénégal"],
      cities: [],
      priceXof: 5000,
      freeAboveXof: 250000,
      etaDays: "3–5 jours",
      active: true,
    },
    {
      id: "international",
      name: "International",
      countries: [],
      cities: [],
      priceXof: 25000,
      freeAboveXof: null,
      etaDays: "7–14 jours",
      active: true,
    },
  ],
};

ensureFile(SHIPPING_FILE, DEFAULT_ZONES);

function load() {
  return readJson(SHIPPING_FILE, DEFAULT_ZONES);
}

function save(data) {
  writeJson(SHIPPING_FILE, data);
}

export function listZones({ includeInactive = false } = {}) {
  const { zones } = load();
  return includeInactive ? zones : zones.filter((z) => z.active);
}

function norm(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Cherche la meilleure zone pour un pays + ville donnés.
 * Priorité : match ville > match pays exact > zone internationale (sans pays = catch-all).
 */
export function matchZone({ country, city }) {
  const zones = listZones();
  const c = norm(country);
  const v = norm(city);
  if (v) {
    const byCity = zones.find(
      (z) =>
        z.cities.some((cz) => norm(cz) === v) &&
        (z.countries.length === 0 || z.countries.some((co) => norm(co) === c))
    );
    if (byCity) return byCity;
  }
  if (c) {
    const byCountry = zones.find(
      (z) => z.countries.length > 0 && z.countries.some((co) => norm(co) === c)
    );
    if (byCountry) return byCountry;
  }
  return zones.find((z) => z.countries.length === 0) ?? null;
}

export function quoteShipping({ zoneId, country, city, subtotalXof }) {
  let zone = null;
  if (zoneId) {
    zone = listZones().find((z) => z.id === zoneId) ?? null;
  }
  if (!zone) zone = matchZone({ country, city });
  if (!zone) {
    return { zone: null, shippingXof: 0, free: false, message: "Aucune zone définie." };
  }
  const free =
    zone.freeAboveXof != null && Number(subtotalXof) >= Number(zone.freeAboveXof);
  return {
    zone: {
      id: zone.id,
      name: zone.name,
      etaDays: zone.etaDays,
      freeAboveXof: zone.freeAboveXof,
    },
    shippingXof: free ? 0 : Number(zone.priceXof) || 0,
    free,
  };
}

export function getZone(id) {
  return load().zones.find((z) => z.id === id) ?? null;
}

export function createZone(body) {
  const data = load();
  const zone = {
    id: body.id || crypto.randomUUID(),
    name: String(body.name ?? "Zone").slice(0, 80),
    countries: Array.isArray(body.countries) ? body.countries.map(String) : [],
    cities: Array.isArray(body.cities) ? body.cities.map(String) : [],
    priceXof: Math.max(0, Number(body.priceXof) || 0),
    freeAboveXof:
      body.freeAboveXof == null || body.freeAboveXof === ""
        ? null
        : Math.max(0, Number(body.freeAboveXof)),
    etaDays: body.etaDays ?? "",
    active: body.active !== false,
  };
  if (data.zones.some((z) => z.id === zone.id)) {
    return { error: "Cette zone existe déjà." };
  }
  data.zones.push(zone);
  save(data);
  return { zone };
}

export function updateZone(id, patch) {
  const data = load();
  const idx = data.zones.findIndex((z) => z.id === id);
  if (idx === -1) return null;
  const z = data.zones[idx];
  const next = { ...z };
  if (patch.name !== undefined) next.name = String(patch.name);
  if (patch.countries !== undefined)
    next.countries = Array.isArray(patch.countries) ? patch.countries.map(String) : z.countries;
  if (patch.cities !== undefined)
    next.cities = Array.isArray(patch.cities) ? patch.cities.map(String) : z.cities;
  if (patch.priceXof !== undefined)
    next.priceXof = Math.max(0, Number(patch.priceXof) || 0);
  if (patch.freeAboveXof !== undefined)
    next.freeAboveXof =
      patch.freeAboveXof == null || patch.freeAboveXof === ""
        ? null
        : Math.max(0, Number(patch.freeAboveXof));
  if (patch.etaDays !== undefined) next.etaDays = String(patch.etaDays);
  if (patch.active !== undefined) next.active = Boolean(patch.active);
  data.zones[idx] = next;
  save(data);
  return { zone: next };
}

export function deleteZone(id) {
  const data = load();
  const before = data.zones.length;
  data.zones = data.zones.filter((z) => z.id !== id);
  if (data.zones.length === before) return false;
  save(data);
  return true;
}
