import crypto from "node:crypto";

/**
 * Wrapper PayDunya — HTTP/JSON.
 * Doc : https://paydunya.com/developers/api
 *
 * Variables .env :
 *   PAYDUNYA_ENABLED=true
 *   PAYDUNYA_MODE=test|live
 *   PAYDUNYA_MASTER_KEY=...
 *   PAYDUNYA_PRIVATE_KEY=...
 *   PAYDUNYA_PUBLIC_KEY=...
 *   PAYDUNYA_TOKEN=...
 *   PAYDUNYA_STORE_NAME=FANG
 *   PAYDUNYA_CALLBACK_URL=https://votre-site/api/store/checkout/paydunya/callback
 *   PAYDUNYA_RETURN_URL=https://votre-site/checkout/paydunya/return
 *   PAYDUNYA_CANCEL_URL=https://votre-site/checkout/paydunya/cancel
 */

const SANDBOX_BASE = "https://app.paydunya.com/sandbox-api/v1";
const LIVE_BASE = "https://app.paydunya.com/api/v1";

export const PAYDUNYA_MIN_CHECKOUT_AMOUNT = 200;

/**
 * Mapping moyen de paiement UI → canal PayDunya.
 * Référence : checkout_providers.py de Tickets Place.
 */
export const PAYDUNYA_CHANNEL_MAP = {
  wave: "wave-senegal",
  orange_money: "orange-money-senegal",
  free_money: "free-money-senegal",
  moov_ci: "moov-ci",
  mtn_ci: "mtn-ci",
  card: "card",
  bank: "card",
};

export function paydunyaConfig() {
  const mode = (process.env.PAYDUNYA_MODE || "test").toLowerCase();
  return {
    enabled: process.env.PAYDUNYA_ENABLED === "true" || process.env.PAYDUNYA_ENABLED === "1",
    mode,
    baseUrl: mode === "live" ? LIVE_BASE : SANDBOX_BASE,
    masterKey: process.env.PAYDUNYA_MASTER_KEY || "",
    privateKey: process.env.PAYDUNYA_PRIVATE_KEY || "",
    publicKey: process.env.PAYDUNYA_PUBLIC_KEY || "",
    token: process.env.PAYDUNYA_TOKEN || "",
    storeName: process.env.PAYDUNYA_STORE_NAME || "FANG",
    callbackUrl: process.env.PAYDUNYA_CALLBACK_URL || "",
    returnUrl: process.env.PAYDUNYA_RETURN_URL || "",
    cancelUrl: process.env.PAYDUNYA_CANCEL_URL || "",
  };
}

export function paydunyaReady() {
  const c = paydunyaConfig();
  return c.enabled && Boolean(c.masterKey && c.privateKey && c.token);
}

function authHeaders() {
  const c = paydunyaConfig();
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "PAYDUNYA-MASTER-KEY": c.masterKey,
    "PAYDUNYA-PRIVATE-KEY": c.privateKey,
    "PAYDUNYA-TOKEN": c.token,
  };
}

/**
 * Crée une facture PayDunya pour un panier pending.
 *
 * @param {object} payload
 *   - refCommand: string (CHK-...)
 *   - amountXof: number (>= 200)
 *   - items: [{ name, quantity, unit_price, total_price, description }]
 *   - customer: { name, email, phone }
 *   - channel?: string (canal PayDunya pré-sélectionné)
 *   - callbackUrl?, returnUrl?, cancelUrl?: string (override)
 * @returns {Promise<{token, redirectUrl, raw} | {error}>}
 */
export async function createPaydunyaInvoice(payload) {
  const cfg = paydunyaConfig();
  if (!paydunyaReady()) return { error: "PayDunya non configuré." };

  if (Number(payload.amountXof) < PAYDUNYA_MIN_CHECKOUT_AMOUNT) {
    return {
      error: `Montant minimum PayDunya : ${PAYDUNYA_MIN_CHECKOUT_AMOUNT} FCFA.`,
    };
  }

  const callbackUrl = payload.callbackUrl || cfg.callbackUrl;
  const returnUrl = payload.returnUrl || cfg.returnUrl;
  const cancelUrl = payload.cancelUrl || cfg.cancelUrl;

  const items = (payload.items || []).reduce((acc, it, i) => {
    acc[`item_${i}`] = {
      name: String(it.name ?? `Article ${i + 1}`).slice(0, 120),
      quantity: Number(it.quantity ?? 1),
      unit_price: String(Math.round(Number(it.unit_price ?? 0))),
      total_price: String(Math.round(Number(it.total_price ?? 0))),
      description: String(it.description ?? "").slice(0, 200),
    };
    return acc;
  }, {});

  const body = {
    invoice: {
      total_amount: Math.round(Number(payload.amountXof)),
      description: `Commande FANG ${payload.refCommand}`,
      items,
    },
    store: {
      name: cfg.storeName,
    },
    custom_data: {
      ref_command: payload.refCommand,
      customer_name: payload.customer?.name ?? "",
      customer_email: payload.customer?.email ?? "",
      customer_phone: payload.customer?.phone ?? "",
      channel: payload.channel ?? "",
    },
    actions: {
      cancel_url: cancelUrl,
      return_url: returnUrl,
      callback_url: callbackUrl,
    },
  };

  if (payload.channel) {
    body.channels = [payload.channel];
  }

  try {
    const res = await fetch(`${cfg.baseUrl}/checkout-invoice/create`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.response_code !== "00") {
      return {
        error:
          data.response_text || data.message || "Erreur PayDunya lors de la création de la facture.",
        raw: data,
      };
    }
    const redirectUrl = data.response_text;
    if (!_isAllowedPaydunyaRedirectUrl(redirectUrl)) {
      return { error: "URL de redirection PayDunya non autorisée.", raw: data };
    }
    return {
      token: data.token,
      redirectUrl,
      raw: data,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Confirme l'état d'une facture PayDunya (pour retour acheteur si l'IPN traîne).
 */
export async function confirmPaydunyaInvoice(token) {
  const cfg = paydunyaConfig();
  if (!paydunyaReady()) return { error: "PayDunya non configuré." };
  try {
    const res = await fetch(`${cfg.baseUrl}/checkout-invoice/confirm/${encodeURIComponent(token)}`, {
      method: "GET",
      headers: authHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.response_text || "Erreur confirm", raw: data };
    return { ...data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Vérifie le hash IPN : sha512(master_key).
 * PayDunya envoie le champ `hash` dans le body du callback.
 */
export function verifyPaydunyaHash(body) {
  const cfg = paydunyaConfig();
  if (!cfg.masterKey) return { ok: false, reason: "Master key absente" };
  const received = String(body.hash ?? "");
  const expected = crypto.createHash("sha512").update(cfg.masterKey).digest("hex");
  try {
    const eq = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
    if (eq) return { ok: true };
  } catch {
    /* fall through */
  }
  return { ok: false, reason: "Hash invalide" };
}

export function paydunyaAmountMatches(expectedXof, body) {
  const received = Number(
    body?.invoice?.total_amount ?? body?.total_amount ?? body?.amount ?? 0
  );
  return Math.round(received) === Math.round(expectedXof);
}

function _isAllowedPaydunyaRedirectUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return u.hostname.endsWith("paydunya.com");
  } catch {
    return false;
  }
}
