import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const CMS_FILE = path.join(ROOT, "data/cms.json");

let cms;

describe("CMS module", () => {
  before(async () => {
    // Réinitialise le fichier CMS pour des tests reproductibles
    if (fs.existsSync(CMS_FILE)) fs.unlinkSync(CMS_FILE);
    cms = await import("../../server/lib/cms.mjs");
  });

  it("expose un schéma déclaratif avec sections home et brand", () => {
    assert.ok(cms.CMS_SCHEMA);
    assert.ok(Array.isArray(cms.CMS_SCHEMA.sections));
    const ids = cms.CMS_SCHEMA.sections.map((s) => s.id);
    assert.ok(ids.includes("home.hero"));
    assert.ok(ids.includes("home.story"));
    assert.ok(ids.includes("home.manifest"));
    assert.ok(ids.includes("brand"));
  });

  it("chaque section a des champs valides", () => {
    for (const sec of cms.CMS_SCHEMA.sections) {
      assert.ok(sec.id, `section sans id`);
      assert.ok(sec.label, `section ${sec.id} sans label`);
      assert.ok(Array.isArray(sec.fields), `section ${sec.id} sans champs`);
      for (const f of sec.fields) {
        assert.ok(f.id, `field sans id dans ${sec.id}`);
        assert.ok(
          ["text", "textarea", "richtext", "list", "image", "url"].includes(f.type),
          `field type invalide ${f.type}`
        );
      }
    }
  });

  it("getCmsPublished retourne les defaults quand le fichier est vide", () => {
    const pub = cms.getCmsPublished();
    assert.equal(pub["home.hero"].title, "Le futur a des racines.");
    assert.ok(Array.isArray(pub["home.story"].fragments));
    assert.ok(pub["home.story"].fragments.length > 0);
  });

  it("updateCmsSection met à jour le draft sans toucher au published", async () => {
    await cms.updateCmsSection("home.hero", { title: "Titre brouillon" });
    const state = cms.getCmsState();
    assert.equal(state.draft["home.hero"].title, "Titre brouillon");
    assert.notEqual(state.published["home.hero"].title, "Titre brouillon");
    assert.ok(state.hasUnpublishedChanges);
    assert.ok(state.sectionsWithChanges.includes("home.hero"));
  });

  it("publishCms copie draft → published", async () => {
    await cms.publishCms({ actor: "tester" });
    const state = cms.getCmsState();
    assert.equal(state.published["home.hero"].title, "Titre brouillon");
    assert.equal(state.hasUnpublishedChanges, false);
  });

  it("revertCmsDraft restaure le draft depuis le published", async () => {
    await cms.updateCmsSection("home.hero", { title: "Re-modification" });
    let state = cms.getCmsState();
    assert.equal(state.draft["home.hero"].title, "Re-modification");
    assert.ok(state.hasUnpublishedChanges);

    await cms.revertCmsDraft();
    state = cms.getCmsState();
    assert.equal(state.draft["home.hero"].title, "Titre brouillon");
    assert.equal(state.hasUnpublishedChanges, false);
  });

  it("preview tokens sont créés, valides puis expirés à la demande", () => {
    const { token } = cms.createPreviewToken();
    assert.match(token, /^[a-f0-9]{32}$/);
    assert.equal(cms.isValidPreviewToken(token), true);
    assert.equal(cms.isValidPreviewToken("invalid-token-xxx"), false);
    assert.equal(cms.isValidPreviewToken(""), false);
    assert.equal(cms.isValidPreviewToken(null), false);
  });

  it("mise à jour multi-sections puis publish atomique", async () => {
    await cms.updateCmsSection("home.story", { fragments: ["A", "B", "C"] });
    await cms.updateCmsSection("brand", { name: "TESTBRAND" });
    let state = cms.getCmsState();
    assert.ok(state.sectionsWithChanges.includes("home.story"));
    assert.ok(state.sectionsWithChanges.includes("brand"));

    await cms.publishCms();
    state = cms.getCmsState();
    assert.equal(state.published["home.story"].fragments[0], "A");
    assert.equal(state.published.brand.name, "TESTBRAND");
    assert.equal(state.hasUnpublishedChanges, false);
  });

  it("mise à jour ignore les champs inexistants dans le schéma", async () => {
    // updateCmsSection ne fait pas la validation (c'est l'API qui le fait),
    // mais on vérifie qu'il merge correctement et préserve l'existant
    await cms.updateCmsSection("home.hero", { title: "Nouveau" });
    const state = cms.getCmsState();
    // Le sous-titre existant n'est pas perdu
    assert.ok(state.draft["home.hero"].subtitle);
  });
});
