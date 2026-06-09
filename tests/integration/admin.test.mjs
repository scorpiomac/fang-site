/**
 * Tests d'intégration des endpoints admin centraux.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { http, adminLogin, adminFetch } from "../helpers/http.mjs";

describe("Admin — catalogue & contenu", () => {
  it("GET /api/admin/catalog retourne un catalogue", async () => {
    const token = await adminLogin();
    const res = await adminFetch(token, "/api/admin/catalog");
    assert.equal(res.status, 200);
    assert.ok(res.body.catalog);
    assert.ok(Array.isArray(res.body.catalog.chapters));
  });

  it("GET /api/admin/media retourne la médiathèque", async () => {
    const token = await adminLogin();
    const res = await adminFetch(token, "/api/admin/media");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.items));
  });

  it("GET /api/admin/stats retourne les compteurs", async () => {
    const token = await adminLogin();
    const res = await adminFetch(token, "/api/admin/stats");
    assert.equal(res.status, 200);
    assert.ok(res.body.orders);
  });

  it("GET /api/admin/users liste au moins l'admin owner", async () => {
    const token = await adminLogin();
    const res = await adminFetch(token, "/api/admin/users");
    assert.equal(res.status, 200);
    assert.ok(res.body.users.length >= 1);
    assert.ok(res.body.users.find((u) => u.role === "owner"));
  });
});

describe("Admin — settings", () => {
  it("PATCH /api/admin/settings persiste les changements", async () => {
    const token = await adminLogin();
    const res = await adminFetch(token, "/api/admin/settings", {
      method: "PATCH",
      body: JSON.stringify({ brand: { name: "FANG-TEST" } }),
    });
    assert.equal(res.status, 200);
    // Vérification publique
    const pub = await http("/api/store/settings");
    assert.equal(pub.body.settings.brand.name, "FANG-TEST");
    // Reset
    await adminFetch(token, "/api/admin/settings", {
      method: "PATCH",
      body: JSON.stringify({ brand: { name: "FANG" } }),
    });
  });

  it("PATCH /api/admin/settings change le payment provider", async () => {
    const token = await adminLogin();
    const res = await adminFetch(token, "/api/admin/settings", {
      method: "PATCH",
      body: JSON.stringify({ checkout: { paymentProvider: "paytech" } }),
    });
    assert.equal(res.status, 200);
    await adminFetch(token, "/api/admin/settings", {
      method: "PATCH",
      body: JSON.stringify({ checkout: { paymentProvider: "off" } }),
    });
  });
});

describe("Admin — rapports", () => {
  it("GET /api/admin/reports retourne les KPI", async () => {
    const token = await adminLogin();
    const res = await adminFetch(token, "/api/admin/reports");
    assert.equal(res.status, 200);
    assert.ok(res.body);
  });
});

describe("Admin — audit log", () => {
  it("GET /api/admin/audit retourne des entrées", async () => {
    const token = await adminLogin();
    const res = await adminFetch(token, "/api/admin/audit?limit=20");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.entries));
  });

  it("admin.login est tracé dans l'audit", async () => {
    const token = await adminLogin();
    const res = await adminFetch(token, "/api/admin/audit?action=admin.login&limit=5");
    assert.equal(res.status, 200);
    assert.ok(res.body.entries.length >= 1);
  });

  it("audit log filtre par action exacte", async () => {
    const token = await adminLogin();
    const res = await adminFetch(
      token,
      "/api/admin/audit?action=cms.publish&limit=10"
    );
    assert.equal(res.status, 200);
    assert.ok(res.body.entries.every((e) => e.action.startsWith("cms.publish")));
  });
});

describe("Admin — notifications", () => {
  it("GET /api/admin/notifications retourne les nouvelles commandes", async () => {
    const token = await adminLogin();
    const res = await adminFetch(token, "/api/admin/notifications");
    assert.equal(res.status, 200);
    assert.equal(typeof res.body.pending, "number");
    assert.equal(typeof res.body.confirmedToday, "number");
    assert.ok(Array.isArray(res.body.newOrders));
  });
});

describe("Admin — backups", () => {
  it("GET /api/admin/backups liste les backups", async () => {
    const token = await adminLogin();
    const res = await adminFetch(token, "/api/admin/backups");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.backups));
  });

  it("POST /api/admin/backups crée un backup", async () => {
    const token = await adminLogin();
    const res = await adminFetch(token, "/api/admin/backups", { method: "POST" });
    assert.equal(res.status, 200);
    assert.ok(res.body.file);
  });
});
