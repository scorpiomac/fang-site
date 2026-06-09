import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  verifyPaytechIpn,
  paytechAmountMatches,
  paytechConfig,
} from "../../server/lib/paytech.mjs";

describe("PayTech — vérification IPN", () => {
  it("retourne ok:false si pas configuré", () => {
    // En environnement de test on n'a pas de credentials → doit refuser
    delete process.env.PAYTECH_API_KEY;
    delete process.env.PAYTECH_API_SECRET;
    const res = verifyPaytechIpn({});
    assert.equal(res.ok, false);
    assert.match(res.reason, /non configuré/i);
  });

  it("HMAC SHA256 valide passe la vérification", () => {
    process.env.PAYTECH_API_KEY = "test_api_key";
    process.env.PAYTECH_API_SECRET = "test_api_secret";
    const cfg = paytechConfig();
    const body = { item_price: 5000, ref_command: "CHK-ABC", final_item_price: 5000 };
    const message = `${body.item_price}|${body.ref_command}|${cfg.apiKey}`;
    body.hmac_compute = crypto
      .createHmac("sha256", cfg.apiSecret)
      .update(message)
      .digest("hex");
    const res = verifyPaytechIpn(body);
    assert.equal(res.ok, true);
  });

  it("HMAC invalide rejette", () => {
    process.env.PAYTECH_API_KEY = "test_api_key";
    process.env.PAYTECH_API_SECRET = "test_api_secret";
    const body = {
      item_price: 5000,
      ref_command: "CHK-ABC",
      hmac_compute: "0".repeat(64),
    };
    const res = verifyPaytechIpn(body);
    assert.equal(res.ok, false);
  });

  it("HMAC tampered ref_command rejette", () => {
    process.env.PAYTECH_API_KEY = "test_api_key";
    process.env.PAYTECH_API_SECRET = "test_api_secret";
    const cfg = paytechConfig();
    const message = `5000|CHK-VRAIE|${cfg.apiKey}`;
    const hmac = crypto.createHmac("sha256", cfg.apiSecret).update(message).digest("hex");
    // On signe CHK-VRAIE mais on envoie CHK-FAKE
    const res = verifyPaytechIpn({
      item_price: 5000,
      ref_command: "CHK-FAKE",
      hmac_compute: hmac,
    });
    assert.equal(res.ok, false);
  });

  it("fallback legacy SHA256 des clés", () => {
    process.env.PAYTECH_API_KEY = "test_api_key";
    process.env.PAYTECH_API_SECRET = "test_api_secret";
    const cfg = paytechConfig();
    const body = {
      item_price: 5000,
      ref_command: "CHK-ABC",
      api_key_sha256: crypto.createHash("sha256").update(cfg.apiKey).digest("hex"),
      api_secret_sha256: crypto.createHash("sha256").update(cfg.apiSecret).digest("hex"),
    };
    const res = verifyPaytechIpn(body);
    assert.equal(res.ok, true);
    assert.equal(res.legacy, true);
  });

  it("signature manquante rejette", () => {
    process.env.PAYTECH_API_KEY = "test_api_key";
    process.env.PAYTECH_API_SECRET = "test_api_secret";
    const res = verifyPaytechIpn({ item_price: 5000, ref_command: "CHK-ABC" });
    assert.equal(res.ok, false);
    assert.match(res.reason, /Signature manquante/i);
  });
});

describe("PayTech — vérification montant", () => {
  it("montant exact OK", () => {
    assert.equal(paytechAmountMatches(5000, { item_price: 5000 }), true);
  });

  it("montant différent rejette", () => {
    assert.equal(paytechAmountMatches(5000, { item_price: 4999 }), false);
    assert.equal(paytechAmountMatches(5000, { item_price: 5001 }), false);
  });

  it("supporte final_item_price comme fallback", () => {
    assert.equal(paytechAmountMatches(5000, { final_item_price: 5000 }), true);
  });

  it("body sans montant rejette", () => {
    assert.equal(paytechAmountMatches(5000, {}), false);
  });
});
