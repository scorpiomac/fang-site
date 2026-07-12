import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, writeJson, ensureFile } from "./jsonStore.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SETTINGS_FILE = path.join(path.resolve(__dirname, "../../data"), "settings.json");

export const DEFAULT_SETTINGS = {
  brand: {
    name: "FANG",
    tagline: "Nel Fang Te Dundu",
    legalName: "FANG — Fallou Ngom",
    address: "Dakar, Sénégal",
    siteUrl: "",
  },
  contact: {
    email: "elhadjifalloungom7@gmail.com",
    phone: "+221 78 187 97 38",
    whatsapp: "221781879738",
    supportHours: "Lun–Ven · 9h–18h GMT",
  },
  social: {
    instagram: "https://www.instagram.com/fanglamarque/",
    facebook: "",
    tiktok: "",
    youtube: "",
  },
  currency: {
    code: "XOF",
    label: "FCFA",
    symbol: "FCFA",
    locale: "fr-SN",
  },
  tax: {
    enabled: false,
    rate: 18,
    included: true,
    label: "TVA",
  },
  production: {
    leadTime: "2 à 6 semaines",
    showLeadTime: true,
  },
  payments: {
    methods: [
      { id: "whatsapp", label: "WhatsApp atelier", active: true, instructions: "L'atelier vous contacte pour Mobile Money, virement ou espèces." },
      { id: "bank", label: "Virement bancaire", active: false, instructions: "" },
      { id: "wave", label: "Wave", active: false, instructions: "" },
      { id: "orange_money", label: "Orange Money", active: false, instructions: "" },
      { id: "card", label: "Carte bancaire", active: false, instructions: "" },
    ],
  },
  checkout: {
    paymentProvider: "off", // "off" | "paytech" | "paydunya"
    allowSimulated: false,
    minOnlineAmount: 200,
  },
  maintenance: {
    enabled: false,
    message: "Le site est en maintenance. Revenez très bientôt.",
  },
  mail: {
    from: "FANG Atelier <elhadjifalloungom7@gmail.com>",
    notifyAdmins: true,
    adminRecipients: "",
  },
  legal: {
    siret: "",
    rcs: "",
    vatNumber: "",
  },
  updatedAt: null,
};

function deepMerge(target, source) {
  if (!source || typeof source !== "object") return target;
  const out = Array.isArray(target) ? [...target] : { ...target };
  for (const key of Object.keys(source)) {
    const v = source[key];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[key] = deepMerge(target?.[key] ?? {}, v);
    } else if (v !== undefined) {
      out[key] = v;
    }
  }
  return out;
}

ensureFile(SETTINGS_FILE, DEFAULT_SETTINGS);

export function getSettings() {
  const stored = readJson(SETTINGS_FILE, {});
  return deepMerge(DEFAULT_SETTINGS, stored);
}

export function updateSettings(patch) {
  const current = getSettings();
  const next = deepMerge(current, patch ?? {});
  next.updatedAt = new Date().toISOString();
  writeJson(SETTINGS_FILE, next);
  return next;
}

/** Subset exposé côté boutique publique (sans données sensibles) */
export function getPublicSettings() {
  const s = getSettings();
  return {
    brand: s.brand,
    contact: {
      email: s.contact.email,
      phone: s.contact.phone,
      whatsapp: s.contact.whatsapp,
      supportHours: s.contact.supportHours,
    },
    social: s.social,
    currency: s.currency,
    tax: {
      enabled: s.tax.enabled,
      rate: s.tax.rate,
      included: s.tax.included,
      label: s.tax.label,
    },
    production: s.production,
    payments: {
      methods: s.payments.methods
        .filter((m) => m.active)
        .map((m) => ({ id: m.id, label: m.label, instructions: m.instructions })),
    },
    maintenance: s.maintenance,
    legal: s.legal,
    checkout: {
      paymentProvider: s.checkout?.paymentProvider ?? "off",
      minOnlineAmount: s.checkout?.minOnlineAmount ?? 200,
    },
  };
}
