import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const FILE = path.join(ROOT, "data/pages.json");

let pagesMod;

describe("Pages éditoriales", () => {
  before(async () => {
    if (fs.existsSync(FILE)) fs.unlinkSync(FILE);
    pagesMod = await import("../../server/lib/pages.mjs");
  });

  it("DEFAULT_PAGES contient les pages clés", () => {
    assert.ok(pagesMod.DEFAULT_PAGES);
    const slugs = Object.keys(pagesMod.DEFAULT_PAGES);
    for (const required of ["cgv", "mentions-legales", "confidentialite", "faq"]) {
      assert.ok(slugs.includes(required), `slug requis manquant: ${required}`);
    }
  });

  it("listPages retourne au moins les defaults", () => {
    const list = pagesMod.listPages();
    assert.ok(Array.isArray(list));
    assert.ok(list.length >= 4);
  });

  it("getPage retourne un objet avec title/body", () => {
    const p = pagesMod.getPage("cgv");
    assert.ok(p);
    assert.ok(p.title);
    assert.ok(typeof p.body === "string");
  });

  it("getPage retourne null pour slug inconnu", () => {
    assert.equal(pagesMod.getPage("zzz-inconnu"), null);
  });

  it("updatePage écrit un override (sans détruire les defaults)", () => {
    const before = pagesMod.getPage("cgv");
    const res = pagesMod.updatePage("cgv", {
      title: "CGV modifiée",
      body: "Nouveau corps",
    });
    assert.ok(res.page, "updatePage doit retourner { page }");
    assert.equal(res.page.title, "CGV modifiée");
    assert.equal(res.page.body, "Nouveau corps");
    assert.equal(res.page.slug, "cgv");
    const re = pagesMod.getPage("cgv");
    assert.equal(re.title, "CGV modifiée");

    // Reset
    pagesMod.updatePage("cgv", { title: before.title, body: before.body });
  });

  it("updatePage retourne une erreur pour slug inconnu", () => {
    const res = pagesMod.updatePage("zz-fake-slug", { title: "x" });
    assert.ok(res.error);
  });

  it("updatePage gère le flag enabled (visibilité publique)", () => {
    pagesMod.updatePage("faq", { enabled: false });
    const p = pagesMod.getPage("faq");
    assert.equal(p.enabled, false);
    pagesMod.updatePage("faq", { enabled: true });
  });
});
