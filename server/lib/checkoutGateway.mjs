import { getSettings } from "./settings.mjs";
import { paytechReady, paytechConfig } from "./paytech.mjs";
import { paydunyaReady, paydunyaConfig, PAYDUNYA_MIN_CHECKOUT_AMOUNT } from "./paydunya.mjs";
import { getPending, markProcessed, appendIpnLog } from "./checkoutPending.mjs";

/**
 * Retourne le provider actif si configuré dans l'admin ET si les clés .env sont présentes.
 * Choix admin : settings.checkout.paymentProvider = "paytech" | "paydunya" | "off".
 */
export function activeCheckoutProvider() {
  const settings = getSettings();
  const choice = (settings.checkout?.paymentProvider || "off").toLowerCase();

  if (choice === "paytech" && paytechReady()) return "paytech";
  if (choice === "paydunya" && paydunyaReady()) return "paydunya";
  return null;
}

export function paymentProvidersStatus() {
  const settings = getSettings();
  const choice = (settings.checkout?.paymentProvider || "off").toLowerCase();
  return {
    selected: choice,
    active: activeCheckoutProvider(),
    paytech: {
      ready: paytechReady(),
      env: paytechConfig().env,
    },
    paydunya: {
      ready: paydunyaReady(),
      mode: paydunyaConfig().mode,
      minAmount: PAYDUNYA_MIN_CHECKOUT_AMOUNT,
    },
    simulatedAllowed: process.env.CHECKOUT_ALLOW_SIMULATED_PAYMENT === "true",
  };
}

/**
 * Finalisation idempotente d'un paiement : crée la commande FANG à partir
 * du pending. Marque le pending comme traité. Retourne {order, alreadyProcessed}.
 *
 * @param {object} deps - { createOrder, mailerVars?, audit? }
 *   - createOrder(payload) => { order, error? }
 *   - audit(action, meta?)  // optionnel : recordAudit
 */
export async function completeCheckoutAfterPayment(ref, { provider, gatewayMeta }, deps) {
  const pending = getPending(ref);
  if (!pending) {
    return { error: "Pending introuvable (expiré ou inexistant)." };
  }

  if (pending.isProcessed) {
    // Idempotent : on retourne juste l'ordre existant si on l'a, sinon ok.
    return { alreadyProcessed: true, orderId: pending.orderId };
  }

  // Construit le payload pour createOrder (cohérent avec /api/store/orders)
  const orderPayload = {
    customer: pending.customer,
    lines: pending.lines,
    subtotalXof: pending.subtotalXof,
    discountXof: pending.discountXof ?? 0,
    shippingXof: pending.shippingXof ?? 0,
    taxXof: pending.taxXof ?? 0,
    totalXof: pending.totalXof,
    promoCode: pending.promoCode ?? null,
    notes: pending.notes ?? "",
    shippingZoneId: pending.shippingZoneId ?? null,
    paymentMethod: provider,
    paymentStatus: "paid",
    status: "confirmed",
    payment: {
      provider,
      ref,
      gatewayMeta: gatewayMeta ?? null,
    },
  };

  if (typeof deps.createOrder !== "function") {
    return { error: "createOrder manquant" };
  }

  let result;
  try {
    result = await deps.createOrder(orderPayload, { customerId: pending.customerId ?? null });
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }

  if (result?.error) {
    return { error: result.error };
  }

  const order = result?.order ?? result;
  if (!order?.id) {
    return { error: "Création de commande sans ID." };
  }

  markProcessed(ref, order.id, gatewayMeta);
  appendIpnLog(ref, { event: "completed", provider, orderId: order.id });

  if (typeof deps.audit === "function") {
    try {
      deps.audit("payment.completed", {
        target: { type: "order", id: order.id },
        meta: { provider, ref },
      });
    } catch {
      /* ignore */
    }
  }

  return { order };
}
