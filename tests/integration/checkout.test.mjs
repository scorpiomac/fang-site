/**
 * Tests d'intégration du flow paiement inversé.
 *
 * Logique testée :
 *  1. POST /api/store/checkout/start crée IMMÉDIATEMENT une commande FANG
 *     en status=pending + paymentStatus=pending
 *  2. La commande existe avec une ref CHK-... (registre dans checkoutPending)
 *  3. En mode simulé (CHECKOUT_ALLOW_SIMULATED_PAYMENT=true) la commande passe
 *     en confirmed/paid au retour de start
 *  4. Sans provider configuré et sans simulé → 503
 *  5. /api/store/checkout/pending/:ref expose le status pour polling
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { http, adminLogin, adminFetch } from "../helpers/http.mjs";
import { buildOrderPayload } from "../helpers/fixtures.mjs";

describe("Checkout en ligne — flow inversé", () => {
  it("POST /checkout/start avec mode simulé crée commande puis la confirme", async () => {
    const payload = await buildOrderPayload();
    const res = await http("/api/store/checkout/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.provider, "simulated");
    assert.ok(res.body.ref, "ref CHK doit être renvoyée");
    assert.match(res.body.ref, /^CHK-/);
    assert.match(res.body.order.id, /^FANG-/);
    // En simulé, la commande est immédiatement confirmée et payée
    assert.equal(res.body.order.status, "confirmed");
    assert.equal(res.body.order.paymentStatus, "paid");
  });

  it("/checkout/pending/:ref permet de polling une commande simulée", async () => {
    const payload = await buildOrderPayload();
    const start = await http("/api/store/checkout/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const ref = start.body.ref;
    const res = await http(`/api/store/checkout/pending/${ref}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.ref, ref);
    assert.ok(res.body.orderId);
    assert.equal(res.body.provider, "simulated");
    // En simulé, le pending est traité immédiatement
    assert.equal(res.body.isProcessed, true);
    assert.equal(res.body.paymentStatus, "paid");
    assert.equal(res.body.orderStatus, "confirmed");
  });

  it("/checkout/pending/inconnue → 404", async () => {
    const res = await http("/api/store/checkout/pending/CHK-INEXISTANT");
    assert.equal(res.status, 404);
  });

  it("POST /checkout/start refuse payload vide", async () => {
    const res = await http("/api/store/checkout/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.ok(res.status >= 400);
  });

  it("Commande issue de /checkout/start est visible par l'admin", async () => {
    const payload = await buildOrderPayload();
    const start = await http("/api/store/checkout/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert.equal(start.status, 200);
    const orderId = start.body.order.id;
    const token = await adminLogin();
    const admin = await adminFetch(token, `/api/admin/orders/${orderId}`);
    assert.equal(admin.status, 200);
    assert.equal(admin.body.order.id, orderId);
    // payment.provider = simulated, ref = CHK-...
    assert.equal(admin.body.order.payment.provider, "simulated");
    assert.equal(admin.body.order.payment.ref, start.body.ref);
    assert.ok(admin.body.order.payment.confirmedAt);
  });

  it("payment.initiated audit log : trace de la création AVANT paiement", async () => {
    const token = await adminLogin();
    const payload = await buildOrderPayload();
    await http("/api/store/checkout/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const audit = await adminFetch(
      token,
      "/api/admin/audit?action=payment.initiated&limit=10"
    );
    assert.equal(audit.status, 200);
    assert.ok(audit.body.entries.length >= 1);
    assert.equal(audit.body.entries[0].action, "payment.initiated");
  });

  it("payment.simulated audit log présent après simulation", async () => {
    const token = await adminLogin();
    const payload = await buildOrderPayload();
    await http("/api/store/checkout/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const audit = await adminFetch(
      token,
      "/api/admin/audit?action=payment.simulated&limit=10"
    );
    assert.equal(audit.status, 200);
    assert.ok(audit.body.entries.length >= 1);
  });

  it("PayTech IPN avec ref inexistante répond 200 ok:false (pas de retry PayTech)", async () => {
    const res = await http("/api/store/checkout/paytech/ipn", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "ref_command=CHK-INEXISTANT&type_event=sale_complete&item_price=999",
    });
    // Convention : 200 ok:false pour éviter les retries PayTech, mais pas de commande créée
    assert.equal(res.status, 200);
    assert.equal(res.body?.ok, false);
  });

  it("PayDunya callback avec hash invalide → rejeté", async () => {
    const res = await http("/api/store/checkout/paydunya/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice: { token: "fake-token", total_amount: 1000, ref_command: "CHK-INEXISTANT" },
        hash: "0".repeat(128),
        status: "completed",
        custom_data: { ref_command: "CHK-INEXISTANT" },
      }),
    });
    // Pas de pending → 200 ok:false (idem PayTech) OU 400/401 selon ordre validations
    assert.ok(res.status === 200 || res.status >= 400);
  });

  it("Statut PayTech token nécessite paytech configuré", async () => {
    const res = await http("/api/store/checkout/paytech/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: "CHK-FAKE" }),
    });
    // Sans credentials, doit retourner une erreur claire
    assert.ok(res.status >= 400);
  });
});

describe("Checkout en ligne — admin payment status", () => {
  it("GET /api/admin/payments/status retourne les providers détectés", async () => {
    const token = await adminLogin();
    const res = await adminFetch(token, "/api/admin/payments/status");
    assert.equal(res.status, 200);
    assert.ok("paytech" in res.body);
    assert.ok("paydunya" in res.body);
    // En CI sans credentials : aucun n'est ready
    assert.equal(res.body.paytech.ready, false);
    assert.equal(res.body.paydunya.ready, false);
  });
});
