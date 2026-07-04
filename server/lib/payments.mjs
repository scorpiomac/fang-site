import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, writeJson, ensureFile } from "./jsonStore.mjs";
import { getSettings } from "./settings.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INTENTS_FILE = path.join(path.resolve(__dirname, "../../data"), "paymentIntents.json");

ensureFile(INTENTS_FILE, []);

function loadIntents() {
  return readJson(INTENTS_FILE, []);
}

function saveIntents(list) {
  writeJson(INTENTS_FILE, list);
}

/**
 * Liste des providers en ligne disponibles. Lecture de settings + .env pour les clés.
 */
export function listOnlineProviders() {
  const settings = getSettings();
  const stripeKey = process.env.FANG_STRIPE_SECRET_KEY ?? "";
  const waveKey = process.env.FANG_WAVE_API_KEY ?? "";
  const omKey = process.env.FANG_ORANGEMONEY_API_KEY ?? "";

  const methods = settings.payments?.methods ?? [];
  return methods
    .filter((m) => m.active)
    .map((m) => {
      let configured = false;
      if (m.id === "stripe" || m.id === "card") configured = Boolean(stripeKey);
      else if (m.id === "wave") configured = Boolean(waveKey);
      else if (m.id === "orange_money") configured = Boolean(omKey);
      return { id: m.id, label: m.label, configured };
    });
}

/**
 * Crée une "intention" de paiement.
 * Pour un MVP : on enregistre l'intent localement et on renvoie une URL de checkout.
 * Si Stripe est configuré, on pourra plus tard appeler l'API Stripe ici.
 */
export function createPaymentIntent({ orderId, provider, amountXof, customer }) {
  const settings = getSettings();
  const method = (settings.payments?.methods ?? []).find((m) => m.id === provider);
  if (!method || !method.active) {
    return { error: "Méthode de paiement indisponible." };
  }

  const id = crypto.randomUUID();
  const intent = {
    id,
    orderId,
    provider,
    amountXof,
    customer: customer ?? null,
    status: "pending",
    createdAt: new Date().toISOString(),
    // URL de redirection pour finaliser le paiement.
    // Pour un vrai provider, on récupérerait l'URL depuis leur SDK.
    redirectUrl:
      method.checkoutUrl?.replace("{orderId}", orderId).replace("{intentId}", id) ?? null,
  };

  const list = loadIntents();
  list.unshift(intent);
  saveIntents(list);
  return { intent };
}

export function getIntent(id) {
  return loadIntents().find((i) => i.id === id) ?? null;
}

export function markIntentPaid(id, meta = {}) {
  const list = loadIntents();
  const idx = list.findIndex((i) => i.id === id);
  if (idx < 0) return null;
  list[idx] = {
    ...list[idx],
    status: "paid",
    paidAt: new Date().toISOString(),
    providerMeta: meta,
  };
  saveIntents(list);
  return list[idx];
}

/**
 * Vérifie une signature de webhook. Le secret est configuré dans .env :
 *   FANG_WEBHOOK_SECRET_<PROVIDER>
 */
export function verifyWebhookSignature(provider, rawBody, signature) {
  const secret = process.env[`FANG_WEBHOOK_SECRET_${provider.toUpperCase()}`];
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(signature)));
  } catch {
    return false;
  }
}
