import crypto from "node:crypto";

/**
 * Wrapper PayTech (Sénégal) — Web SDK + IPN.
 * Doc : https://docs.paytech.sn/
 *
 * Variables .env :
 *   PAYTECH_ENABLED=true
 *   PAYTECH_BASE_URL=https://paytech.sn/api
 *   PAYTECH_API_KEY=...
 *   PAYTECH_API_SECRET=...
 *   PAYTECH_ENV=test|prod
 *   PAYTECH_IPN_URL=https://votre-site/api/store/checkout/paytech/ipn
 *   PAYTECH_SUCCESS_URL=https://votre-site/checkout/paytech/success
 *   PAYTECH_CANCEL_URL=https://votre-site/checkout/paytech/cancel
 */

const DEFAULT_BASE = "https://paytech.sn/api";

export function paytechConfig() {
  return {
    enabled: process.env.PAYTECH_ENABLED === "true" || process.env.PAYTECH_ENABLED === "1",
    baseUrl: process.env.PAYTECH_BASE_URL || DEFAULT_BASE,
    apiKey: process.env.PAYTECH_API_KEY || "",
    apiSecret: process.env.PAYTECH_API_SECRET || "",
    env: process.env.PAYTECH_ENV || "test",
    ipnUrl: process.env.PAYTECH_IPN_URL || "",
    successUrl: process.env.PAYTECH_SUCCESS_URL || "",
    cancelUrl: process.env.PAYTECH_CANCEL_URL || "",
  };
}

export function paytechReady() {
  const c = paytechConfig();
  return c.enabled && Boolean(c.apiKey && c.apiSecret);
}

/**
 * Demande un token de paiement à PayTech.
 * IMPORTANT : la requête doit être en application/x-www-form-urlencoded
 * (le JSON peut faire ignorer item_price côté PayTech).
 *
 * @param {object} payload
 *   - refCommand: string (CHK-...)
 *   - amountXof: number entier
 *   - itemName: string
 *   - customerName, customerEmail, customerPhone?: string
 *   - targetPayment?: string  // "Wave,OrangeMoney,Card" optionnel
 *   - ipnUrl, successUrl, cancelUrl?: string  // override
 * @returns {Promise<{token, redirectUrl} | {error}>}
 */
export async function requestPaytechToken(payload) {
  const cfg = paytechConfig();
  if (!paytechReady()) return { error: "PayTech non configuré." };

  const ipnUrl = payload.ipnUrl || cfg.ipnUrl;
  const successUrl = payload.successUrl || cfg.successUrl;
  const cancelUrl = payload.cancelUrl || cfg.cancelUrl;

  const params = new URLSearchParams();
  params.set("item_name", payload.itemName || "Commande FANG");
  params.set("item_price", String(Math.max(1, Math.floor(payload.amountXof))));
  params.set("currency", "XOF");
  params.set("ref_command", payload.refCommand);
  params.set("command_name", `Commande ${payload.refCommand}`);
  params.set("env", cfg.env);
  if (ipnUrl) params.set("ipn_url", ipnUrl);
  if (successUrl) params.set("success_url", successUrl);
  if (cancelUrl) params.set("cancel_url", cancelUrl);

  if (payload.customerName) params.set("custom_field", JSON.stringify({
    customerName: payload.customerName,
    customerEmail: payload.customerEmail || "",
    customerPhone: payload.customerPhone || "",
  }));

  if (payload.targetPayment) params.set("target_payment", payload.targetPayment);

  try {
    const res = await fetch(`${cfg.baseUrl}/payment/request-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        API_KEY: cfg.apiKey,
        API_SECRET: cfg.apiSecret,
      },
      body: params.toString(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false || data.success === 0) {
      return { error: data.message || data.error || "Erreur PayTech", raw: data };
    }
    // PayTech retourne { token, redirect_url, success: 1 }
    return {
      token: data.token,
      redirectUrl: data.redirect_url || data.redirectUrl,
      raw: data,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Vérifie l'IPN PayTech.
 * PayTech envoie un POST avec entre autres :
 *   - type_event (sale_complete, sale_canceled...)
 *   - ref_command
 *   - item_price (montant final encaissé)
 *   - api_key_sha256, api_secret_sha256 (anciens), ou
 *   - hmac_compute (signature HMAC SHA256, recommandée)
 *
 * Algorithme HMAC :
 *   message = `${item_price}|${ref_command}|${api_key}`
 *   secret = api_secret
 *   expected = HMAC_SHA256(secret, message).hex
 *
 * @returns {{ok: boolean, reason?: string}}
 */
export function verifyPaytechIpn(body) {
  const cfg = paytechConfig();
  if (!cfg.apiKey || !cfg.apiSecret) {
    return { ok: false, reason: "PayTech non configuré" };
  }

  // Champ HMAC moderne
  if (body.hmac_compute) {
    const message = `${body.item_price}|${body.ref_command}|${cfg.apiKey}`;
    const expected = crypto
      .createHmac("sha256", cfg.apiSecret)
      .update(message)
      .digest("hex");
    try {
      const eq = crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(String(body.hmac_compute))
      );
      if (eq) return { ok: true };
    } catch {
      /* fall through */
    }
    return { ok: false, reason: "HMAC invalide" };
  }

  // Fallback ancien : double SHA256 des clés
  if (body.api_key_sha256 && body.api_secret_sha256) {
    const keyHash = crypto.createHash("sha256").update(cfg.apiKey).digest("hex");
    const secretHash = crypto.createHash("sha256").update(cfg.apiSecret).digest("hex");
    if (
      body.api_key_sha256 === keyHash &&
      body.api_secret_sha256 === secretHash
    ) {
      return { ok: true, legacy: true };
    }
    return { ok: false, reason: "Signature legacy invalide" };
  }

  return { ok: false, reason: "Signature manquante" };
}

/**
 * Vérifie que le montant reçu correspond au montant attendu (en XOF, entier).
 */
export function paytechAmountMatches(expectedXof, body) {
  const received = Number(body.item_price ?? body.final_item_price ?? 0);
  return Math.round(received) === Math.round(expectedXof);
}
