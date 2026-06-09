import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const FILE = path.join(ROOT, "data/promos.json");

let promosMod;

describe("Promos — validation et calcul", () => {
  before(async () => {
    if (fs.existsSync(FILE)) fs.unlinkSync(FILE);
    promosMod = await import("../../server/lib/promos.mjs");
  });

  it("createPromo crée un code en majuscules", () => {
    const res = promosMod.createPromo({
      code: "test10",
      label: "10 %",
      type: "percent",
      value: 10,
    });
    assert.ok(res.promo);
    assert.equal(res.promo.code, "TEST10");
    assert.equal(res.promo.usedCount, 0);
  });

  it("createPromo refuse les doublons", () => {
    promosMod.createPromo({ code: "DUP1", type: "percent", value: 5 });
    const res = promosMod.createPromo({ code: "dup1", type: "percent", value: 5 });
    assert.ok(res.error);
  });

  it("createPromo refuse les types invalides", () => {
    const res = promosMod.createPromo({ code: "BADTYPE", type: "weird", value: 10 });
    assert.ok(res.error);
  });

  it("validatePromo calcule la réduction percent correctement", () => {
    promosMod.createPromo({ code: "PCT20", type: "percent", value: 20 });
    const res = promosMod.validatePromo("PCT20", 100000);
    assert.equal(res.valid, true);
    assert.equal(res.discountXof, 20000);
    assert.equal(res.totalXof, 80000);
  });

  it("validatePromo calcule la réduction fixed correctement", () => {
    promosMod.createPromo({ code: "FIX5K", type: "fixed", value: 5000 });
    const res = promosMod.validatePromo("FIX5K", 100000);
    assert.equal(res.valid, true);
    assert.equal(res.discountXof, 5000);
    assert.equal(res.totalXof, 95000);
  });

  it("validatePromo refuse si subtotal < minSubtotalXof", () => {
    promosMod.createPromo({
      code: "MIN50K",
      type: "percent",
      value: 10,
      minSubtotalXof: 50000,
    });
    const res = promosMod.validatePromo("MIN50K", 40000);
    assert.equal(res.valid, false);
    assert.match(res.error, /Minimum/i);
  });

  it("validatePromo refuse si maxUses atteint", () => {
    const created = promosMod.createPromo({
      code: "ONCE",
      type: "percent",
      value: 10,
      maxUses: 1,
    });
    // Simule un usage
    promosMod.incrementPromoUsage("ONCE");
    const res = promosMod.validatePromo("ONCE", 100000);
    assert.equal(res.valid, false);
    assert.match(res.error, /limite/i);
    assert.ok(created.promo);
  });

  it("validatePromo refuse les codes inactifs", () => {
    const created = promosMod.createPromo({
      code: "INACTIVE",
      type: "percent",
      value: 10,
    });
    promosMod.updatePromo(created.promo.id, { active: false });
    const res = promosMod.validatePromo("INACTIVE", 100000);
    assert.equal(res.valid, false);
  });

  it("validatePromo refuse les codes expirés", () => {
    promosMod.createPromo({
      code: "EXPIRED",
      type: "percent",
      value: 10,
      expiresAt: new Date(Date.now() - 86400000).toISOString(),
    });
    const res = promosMod.validatePromo("EXPIRED", 100000);
    assert.equal(res.valid, false);
    assert.match(res.error, /expir/i);
  });

  it("incrementPromoUsage incrémente le compteur", () => {
    const created = promosMod.createPromo({ code: "USE1", type: "percent", value: 5 });
    promosMod.incrementPromoUsage("USE1");
    promosMod.incrementPromoUsage("USE1");
    const promo = promosMod.getPromoByCode("USE1");
    assert.equal(promo.usedCount, 2);
    assert.ok(created.promo);
  });

  it("deletePromo supprime le code", () => {
    const created = promosMod.createPromo({ code: "DELME", type: "fixed", value: 1000 });
    promosMod.deletePromo(created.promo.id);
    assert.equal(promosMod.getPromoByCode("DELME"), null);
  });

  it("réduction percent jamais négative (cap à 0)", () => {
    promosMod.createPromo({ code: "CAP200", type: "fixed", value: 200000 });
    const res = promosMod.validatePromo("CAP200", 10000);
    assert.equal(res.valid, true);
    // total ne doit pas être négatif
    assert.ok(res.totalXof >= 0);
  });
});
