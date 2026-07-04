import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const FILE = path.join(ROOT, "data/orders.json");

let orders;

const basePayload = {
  customer: { name: "X", email: "x@test.com", phone: "1", city: "Dakar", country: "Sénégal" },
  lines: [{ productKey: "p", variationId: "default", size: "M", qty: 1, priceXof: 5000, title: "T" }],
  subtotalXof: 5000,
  discountXof: 0,
  shippingXof: 0,
  totalXof: 5000,
  paymentMethod: "whatsapp",
};

describe("Orders — création et mise à jour", () => {
  before(async () => {
    if (fs.existsSync(FILE)) fs.unlinkSync(FILE);
    orders = await import("../../server/lib/orders.mjs");
  });

  it("createOrder génère un id FANG-...", () => {
    const o = orders.createOrder(basePayload);
    assert.match(o.id, /^FANG-\d{8}-\d+$/);
    assert.equal(o.number, 1);
  });

  it("createOrder incrémente le numéro", () => {
    const o = orders.createOrder(basePayload);
    assert.equal(o.number, 2);
  });

  it("createOrder accepte status et paymentStatus custom (flow paiement en ligne)", () => {
    const o = orders.createOrder({
      ...basePayload,
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: "paytech",
      payment: { provider: "paytech", ref: "CHK-X", initiatedAt: "now" },
    });
    assert.equal(o.status, "pending");
    assert.equal(o.paymentStatus, "pending");
    assert.equal(o.paymentMethod, "paytech");
    assert.equal(o.payment.provider, "paytech");
  });

  it("createOrder valeurs par défaut : pending + pending", () => {
    const o = orders.createOrder({ ...basePayload });
    assert.equal(o.status, "pending");
    assert.equal(o.paymentStatus, "pending");
  });

  it("updateOrder change le status et paymentStatus", () => {
    const o = orders.createOrder(basePayload);
    const updated = orders.updateOrder(o.id, {
      status: "confirmed",
      paymentStatus: "paid",
    });
    assert.equal(updated.status, "confirmed");
    assert.equal(updated.paymentStatus, "paid");
  });

  it("updateOrder ignore les status invalides", () => {
    const o = orders.createOrder(basePayload);
    const updated = orders.updateOrder(o.id, { status: "invalid_xxx" });
    assert.equal(updated.status, "pending");
  });

  it("updateOrder merge le sous-objet payment (flow callback paiement)", () => {
    const o = orders.createOrder({
      ...basePayload,
      payment: { provider: "paytech", ref: "CHK-ABC", initiatedAt: "t1" },
    });
    const updated = orders.updateOrder(o.id, {
      paymentStatus: "paid",
      payment: { confirmedAt: "t2", gatewayMeta: { token: "xx" } },
    });
    // L'ancien payment.provider + ref doivent être conservés
    assert.equal(updated.payment.provider, "paytech");
    assert.equal(updated.payment.ref, "CHK-ABC");
    assert.equal(updated.payment.confirmedAt, "t2");
    assert.deepEqual(updated.payment.gatewayMeta, { token: "xx" });
  });

  it("updateOrder gère internalNote", () => {
    const o = orders.createOrder(basePayload);
    const updated = orders.updateOrder(o.id, { internalNote: "à appeler" });
    assert.equal(updated.internalNote, "à appeler");
  });

  it("updateOrder retourne null si commande introuvable", () => {
    assert.equal(orders.updateOrder("FANG-FAKE-999", { status: "confirmed" }), null);
  });

  it("getOrder retourne la commande", () => {
    const o = orders.createOrder(basePayload);
    assert.deepEqual(orders.getOrder(o.id).id, o.id);
  });

  it("listOrders filtre par status", () => {
    const o = orders.createOrder({ ...basePayload, status: "confirmed", paymentStatus: "paid" });
    const list = orders.listOrders({ status: "confirmed" });
    assert.ok(list.orders.find((x) => x.id === o.id));
  });

  it("orderStats compte par status", () => {
    const stats = orders.orderStats();
    assert.ok(stats.total >= 1);
    assert.ok(typeof stats.byStatus === "object");
  });
});
