import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { http } from "../helpers/http.mjs";

describe("Boutique publique — settings & catalogue", () => {
  it("GET /api/store/settings retourne les réglages publics", async () => {
    const res = await http("/api/store/settings");
    assert.equal(res.status, 200);
    assert.ok(res.body.settings);
    assert.ok(res.body.settings.brand);
    assert.ok(res.body.settings.contact);
    assert.ok(res.body.settings.checkout);
  });

  it("settings publics ne révèlent pas les secrets payment provider", async () => {
    const res = await http("/api/store/settings");
    const stringified = JSON.stringify(res.body);
    assert.ok(!stringified.includes("PAYTECH_API_SECRET"));
    assert.ok(!stringified.includes("PAYDUNYA_MASTER_KEY"));
    assert.ok(!stringified.includes("FANG_ADMIN_PASSWORD"));
  });
});

describe("Boutique publique — pages éditoriales", () => {
  it("GET /api/store/pages retourne la liste", async () => {
    const res = await http("/api/store/pages");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.pages));
    assert.ok(res.body.pages.length >= 4);
  });

  it("GET /api/store/pages/cgv retourne la page", async () => {
    const res = await http("/api/store/pages/cgv");
    assert.equal(res.status, 200);
    assert.ok(res.body.page.title);
    assert.ok(res.body.page.body);
  });

  it("GET /api/store/pages/inconnue → 404", async () => {
    const res = await http("/api/store/pages/zzz-fake-slug");
    assert.equal(res.status, 404);
  });
});

describe("Boutique publique — newsletter & contact", () => {
  it("POST /api/store/newsletter/subscribe accepte un email", async () => {
    const res = await http("/api/store/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `test-${Date.now()}@example.com` }),
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
  });

  it("POST /api/store/newsletter/subscribe refuse email invalide", async () => {
    const res = await http("/api/store/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    assert.ok(res.status >= 400);
  });

  it("POST /api/store/contact envoie un message", async () => {
    const res = await http("/api/store/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test",
        email: "test@example.com",
        message: "Bonjour, j'ai une question.",
      }),
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
  });

  it("POST /api/store/contact refuse les champs vides", async () => {
    const res = await http("/api/store/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", email: "x@y.z", message: "" }),
    });
    assert.ok(res.status >= 400);
  });
});

describe("Boutique publique — livraison & promo", () => {
  it("GET /api/store/shipping/zones retourne les zones", async () => {
    const res = await http("/api/store/shipping/zones");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.zones));
  });

  it("POST /api/store/shipping/quote retourne un coût", async () => {
    const res = await http("/api/store/shipping/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        country: "Sénégal",
        city: "Dakar",
        subtotalXof: 50000,
      }),
    });
    assert.equal(res.status, 200);
    assert.ok(typeof res.body.shippingXof === "number");
  });

  it("POST /api/store/promo/validate refuse un code inexistant", async () => {
    const res = await http("/api/store/promo/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "NEXIST", subtotalXof: 50000 }),
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.valid, false);
    assert.ok(res.body.error);
  });
});
