import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  verifyPaydunyaHash,
  paydunyaAmountMatches,
  PAYDUNYA_MIN_CHECKOUT_AMOUNT,
  PAYDUNYA_CHANNEL_MAP,
} from "../../server/lib/paydunya.mjs";

describe("PayDunya — vérification hash", () => {
  it("hash valide SHA512(master_key) passe", () => {
    process.env.PAYDUNYA_MASTER_KEY = "test_master_key";
    const expected = crypto
      .createHash("sha512")
      .update("test_master_key")
      .digest("hex");
    const res = verifyPaydunyaHash({ hash: expected });
    assert.equal(res.ok, true);
  });

  it("hash invalide rejette", () => {
    process.env.PAYDUNYA_MASTER_KEY = "test_master_key";
    const res = verifyPaydunyaHash({ hash: "0".repeat(128) });
    assert.equal(res.ok, false);
  });

  it("hash absent rejette", () => {
    process.env.PAYDUNYA_MASTER_KEY = "test_master_key";
    const res = verifyPaydunyaHash({});
    assert.equal(res.ok, false);
  });

  it("master_key absente rejette", () => {
    delete process.env.PAYDUNYA_MASTER_KEY;
    const expected = crypto.createHash("sha512").update("x").digest("hex");
    const res = verifyPaydunyaHash({ hash: expected });
    assert.equal(res.ok, false);
    assert.match(res.reason, /Master key absente/i);
  });
});

describe("PayDunya — vérification montant", () => {
  it("invoice.total_amount OK", () => {
    assert.equal(
      paydunyaAmountMatches(5000, { invoice: { total_amount: 5000 } }),
      true
    );
  });

  it("total_amount à racine OK", () => {
    assert.equal(paydunyaAmountMatches(5000, { total_amount: 5000 }), true);
  });

  it("amount à racine OK", () => {
    assert.equal(paydunyaAmountMatches(5000, { amount: 5000 }), true);
  });

  it("montant différent rejette", () => {
    assert.equal(
      paydunyaAmountMatches(5000, { invoice: { total_amount: 4999 } }),
      false
    );
  });
});

describe("PayDunya — constantes", () => {
  it("MIN_CHECKOUT_AMOUNT = 200 FCFA", () => {
    assert.equal(PAYDUNYA_MIN_CHECKOUT_AMOUNT, 200);
  });

  it("CHANNEL_MAP mappe les moyens connus", () => {
    assert.ok(PAYDUNYA_CHANNEL_MAP);
    assert.ok(Object.keys(PAYDUNYA_CHANNEL_MAP).length > 0);
  });
});
