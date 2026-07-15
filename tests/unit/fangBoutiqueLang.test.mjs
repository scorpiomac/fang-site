import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  transcribeFangBoutique,
  FANG_IDEOGRAM_INPUT,
} from "../../src/content/fangBoutiqueLang.ts";

describe("langue boutique FANG", () => {
  it("utilise les idéogrammes pour les mots-symboles de la planche", () => {
    const out = transcribeFangBoutique("gardien de la maison kamara");
    assert.ok(out.includes(FANG_IDEOGRAM_INPUT.borom));
    assert.ok(out.includes(FANG_IDEOGRAM_INPUT.maison));
    assert.ok(out.includes("k>m>r>"));
  });

  it("tape > pour la voyelle a minuscule", () => {
    assert.equal(transcribeFangBoutique("kamara"), "k>m>r>");
  });

  it("gère les consonnes+ ng et dj", () => {
    assert.equal(transcribeFangBoutique("fang"), "f>ng");
    assert.equal(transcribeFangBoutique("dj"), "dj");
  });
});
