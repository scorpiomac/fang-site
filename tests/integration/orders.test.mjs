import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  http,
  adminLogin,
  adminFetch,
  customerAuth,
  uniqueEmail,
} from "../helpers/http.mjs";
import { buildOrderPayload, sampleOrderPayload, sampleCustomer } from "../helpers/fixtures.mjs";

async function createCustomer() {
  const email = uniqueEmail("ord");
  const res = await http("/api/store/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: "OrdersPass2026!",
      name: "Client Cmds",
      phone: "+221770000000",
      city: "Dakar",
    }),
  });
  return { email, token: res.body.sessionToken, customer: res.body.customer };
}

describe("Commandes — création (flow hors-ligne)", () => {
  it("POST /api/store/orders crée une commande invité", async () => {
    const payload = await buildOrderPayload();
    const res = await http("/api/store/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.match(res.body.order.id, /^FANG-\d{8}-\d+$/);
    assert.equal(res.body.order.status, "pending");
  });

  it("POST /api/store/orders refuse total incohérent", async () => {
    const payload = await buildOrderPayload();
    payload.totalXof = 999;
    const res = await http("/api/store/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert.equal(res.status, 400);
  });

  it("POST /api/store/orders refuse payload vide", async () => {
    const res = await http("/api/store/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.ok(res.status >= 400);
  });

  it("POST /api/store/orders refuse panier vide", async () => {
    const payload = await buildOrderPayload();
    payload.lines = [];
    const res = await http("/api/store/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert.equal(res.status, 400);
  });

  it("POST /api/store/orders refuse coordonnées manquantes", async () => {
    const payload = await buildOrderPayload();
    payload.customer = { name: "", email: "", phone: "" };
    const res = await http("/api/store/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert.equal(res.status, 400);
  });
});

describe("Commandes — flow client connecté", () => {
  it("Commande créée avec session client est liée au customerId", async () => {
    const { email, token, customer } = await createCustomer();
    const payload = await buildOrderPayload({
      customer: { ...sampleCustomer, email },
    });
    const res = await http("/api/store/orders", {
      method: "POST",
      headers: customerAuth(token),
      body: JSON.stringify(payload),
    });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    // La réponse client est minimaliste ; on vérifie côté admin que customerId est lié
    const adminToken = await adminLogin();
    const adminRes = await adminFetch(adminToken, `/api/admin/orders/${res.body.order.id}`);
    assert.equal(adminRes.body.order.customerId, customer.id);
  });

  it("GET /api/store/account/orders liste les commandes du client", async () => {
    const { email, token } = await createCustomer();
    const payload = await buildOrderPayload({
      customer: { ...sampleCustomer, email },
    });
    await http("/api/store/orders", {
      method: "POST",
      headers: customerAuth(token),
      body: JSON.stringify(payload),
    });
    const list = await http("/api/store/account/orders", {
      headers: customerAuth(token),
    });
    assert.equal(list.status, 200);
    assert.ok(list.body.orders.length >= 1);
  });

  it("POST /api/store/orders/track retrouve une commande invité", async () => {
    const email = `track-${Date.now()}@example.com`;
    const payload = await buildOrderPayload({ customer: { ...sampleCustomer, email } });
    const order = await http("/api/store/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert.equal(order.status, 201, JSON.stringify(order.body));
    const res = await http("/api/store/orders/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.body.order.id, email }),
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.order.id, order.body.order.id);
  });

  it("Track avec mauvais e-mail → 404", async () => {
    const payload = await buildOrderPayload();
    const order = await http("/api/store/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const res = await http("/api/store/orders/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.body.order.id,
        email: "wrong@example.com",
      }),
    });
    assert.equal(res.status, 404);
  });
});

describe("Commandes — admin", () => {
  it("PATCH /api/admin/orders/:id change le status", async () => {
    const token = await adminLogin();
    const payload = await buildOrderPayload();
    const order = await http("/api/store/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const id = order.body.order.id;
    const updated = await adminFetch(token, `/api/admin/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "confirmed" }),
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.order.status, "confirmed");
  });

  it("GET /api/admin/orders liste avec filtre status", async () => {
    const token = await adminLogin();
    const res = await adminFetch(token, "/api/admin/orders?status=pending");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.orders));
    assert.ok(res.body.orders.every((o) => o.status === "pending"));
  });

  it("GET /api/admin/orders.csv exporte au format CSV", async () => {
    const token = await adminLogin();
    const res = await adminFetch(token, "/api/admin/orders.csv");
    assert.equal(res.status, 200);
    const ct = res.headers.get("content-type") ?? "";
    assert.ok(ct.includes("csv"));
    assert.ok(res.text.length > 0);
  });

  it("GET /api/admin/orders/:id/invoice.html retourne du HTML", async () => {
    const token = await adminLogin();
    const payload = await buildOrderPayload();
    const created = await http("/api/store/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const id = created.body.order.id;
    const res = await adminFetch(token, `/api/admin/orders/${id}/invoice.html`);
    assert.equal(res.status, 200);
    const ct = res.headers.get("content-type") ?? "";
    assert.ok(ct.includes("html"));
    assert.ok(res.text.includes(id));
  });
});
