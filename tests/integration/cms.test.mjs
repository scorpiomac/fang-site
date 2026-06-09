/**
 * Tests d'intégration du CMS éditorial.
 *
 * Couvre :
 *  - GET /api/store/cms                    (lecture publique = published)
 *  - GET /api/store/cms?preview=TOKEN      (lecture du draft)
 *  - GET /api/admin/cms                    (état complet)
 *  - PATCH /api/admin/cms/:sectionId       (update draft)
 *  - POST /api/admin/cms/publish           (draft → published)
 *  - POST /api/admin/cms/revert            (draft = published)
 *  - POST /api/admin/cms/preview           (génère un token)
 */
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { http, adminLogin, adminFetch } from "../helpers/http.mjs";

let token;

before(async () => {
  token = await adminLogin();
  // S'assure d'un état propre : revert si des modifs traînent
  await adminFetch(token, "/api/admin/cms/revert", { method: "POST" });
});

describe("CMS — schéma & lecture", () => {
  it("GET /api/admin/cms expose le schéma et l'état", async () => {
    const res = await adminFetch(token, "/api/admin/cms");
    assert.equal(res.status, 200);
    assert.ok(res.body.schema);
    assert.ok(Array.isArray(res.body.schema.sections));
    assert.ok(res.body.draft);
    assert.ok(res.body.published);
    assert.equal(typeof res.body.hasUnpublishedChanges, "boolean");
  });

  it("GET /api/store/cms retourne mode published", async () => {
    const res = await http("/api/store/cms");
    assert.equal(res.status, 200);
    assert.equal(res.body.mode, "published");
    assert.ok(res.body.content);
    assert.ok(res.body.content["home.hero"]);
  });

  it("GET /api/store/cms expose les defaults sur une instance vierge", async () => {
    const res = await http("/api/store/cms");
    assert.ok(res.body.content["home.hero"].title);
    assert.ok(res.body.content["home.hero"].subtitle);
  });
});

describe("CMS — édition du brouillon", () => {
  it("PATCH /api/admin/cms/home.hero met à jour le draft", async () => {
    const res = await adminFetch(token, "/api/admin/cms/home.hero", {
      method: "PATCH",
      body: JSON.stringify({ title: "Brouillon — Hero" }),
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.draft["home.hero"].title, "Brouillon — Hero");
  });

  it("PATCH refuse les sections inconnues", async () => {
    const res = await adminFetch(token, "/api/admin/cms/section.inconnue", {
      method: "PATCH",
      body: JSON.stringify({ title: "x" }),
    });
    assert.equal(res.status, 400);
  });

  it("PATCH ignore les champs qui ne sont pas dans le schéma", async () => {
    const res = await adminFetch(token, "/api/admin/cms/home.hero", {
      method: "PATCH",
      body: JSON.stringify({
        title: "Titre OK",
        champInexistant: "doit être ignoré",
      }),
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.draft["home.hero"].title, "Titre OK");
    assert.equal(res.body.draft["home.hero"].champInexistant, undefined);
  });

  it("hasUnpublishedChanges devient true après PATCH", async () => {
    await adminFetch(token, "/api/admin/cms/home.hero", {
      method: "PATCH",
      body: JSON.stringify({ title: "Modif test" }),
    });
    const res = await adminFetch(token, "/api/admin/cms");
    assert.equal(res.body.hasUnpublishedChanges, true);
    assert.ok(res.body.sectionsWithChanges.includes("home.hero"));
  });

  it("GET /api/store/cms public ne reflète PAS encore le draft", async () => {
    await adminFetch(token, "/api/admin/cms/home.hero", {
      method: "PATCH",
      body: JSON.stringify({ title: "Pas encore publié" }),
    });
    const res = await http("/api/store/cms");
    assert.notEqual(res.body.content["home.hero"].title, "Pas encore publié");
  });
});

describe("CMS — preview token", () => {
  it("POST /api/admin/cms/preview génère un token éphémère", async () => {
    const res = await adminFetch(token, "/api/admin/cms/preview", { method: "POST" });
    assert.equal(res.status, 200);
    assert.match(res.body.token, /^[a-f0-9]{32}$/);
    assert.ok(res.body.expiresAt);
  });

  it("Lecture publique avec ?preview=TOKEN expose le draft", async () => {
    // Modifie draft
    await adminFetch(token, "/api/admin/cms/home.hero", {
      method: "PATCH",
      body: JSON.stringify({ title: "Preview draft title" }),
    });
    const tokenRes = await adminFetch(token, "/api/admin/cms/preview", { method: "POST" });
    const previewToken = tokenRes.body.token;

    const res = await http(`/api/store/cms?preview=${previewToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.mode, "draft");
    assert.equal(res.body.content["home.hero"].title, "Preview draft title");
  });

  it("Token preview invalide → mode published", async () => {
    const res = await http("/api/store/cms?preview=invalid-token-xx");
    assert.equal(res.body.mode, "published");
  });
});

describe("CMS — publication", () => {
  it("POST /api/admin/cms/publish copie draft → published", async () => {
    await adminFetch(token, "/api/admin/cms/home.hero", {
      method: "PATCH",
      body: JSON.stringify({ title: "Titre à publier" }),
    });
    const pub = await adminFetch(token, "/api/admin/cms/publish", { method: "POST" });
    assert.equal(pub.status, 200);
    assert.equal(pub.body.published["home.hero"].title, "Titre à publier");

    const publicRes = await http("/api/store/cms");
    assert.equal(publicRes.body.content["home.hero"].title, "Titre à publier");

    const state = await adminFetch(token, "/api/admin/cms");
    assert.equal(state.body.hasUnpublishedChanges, false);
  });

  it("publish génère un audit cms.publish", async () => {
    await adminFetch(token, "/api/admin/cms/publish", { method: "POST" });
    const audit = await adminFetch(token, "/api/admin/audit?action=cms.publish&limit=5");
    assert.equal(audit.status, 200);
    assert.ok(audit.body.entries.length >= 1);
  });
});

describe("CMS — revert", () => {
  it("POST /api/admin/cms/revert annule les modifs non publiées", async () => {
    await adminFetch(token, "/api/admin/cms/publish", { method: "POST" });
    const before = await adminFetch(token, "/api/admin/cms");
    const publishedTitle = before.body.published["home.hero"].title;

    // Modif puis revert
    await adminFetch(token, "/api/admin/cms/home.hero", {
      method: "PATCH",
      body: JSON.stringify({ title: "Modif à annuler" }),
    });
    const dirty = await adminFetch(token, "/api/admin/cms");
    assert.equal(dirty.body.hasUnpublishedChanges, true);

    await adminFetch(token, "/api/admin/cms/revert", { method: "POST" });
    const after = await adminFetch(token, "/api/admin/cms");
    assert.equal(after.body.hasUnpublishedChanges, false);
    assert.equal(after.body.draft["home.hero"].title, publishedTitle);
  });
});

describe("CMS — sécurité", () => {
  it("PATCH sans auth → 401", async () => {
    const res = await http("/api/admin/cms/home.hero", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Hack" }),
    });
    assert.equal(res.status, 401);
  });

  it("POST /publish sans auth → 401", async () => {
    const res = await http("/api/admin/cms/publish", { method: "POST" });
    assert.equal(res.status, 401);
  });

  it("POST /revert sans auth → 401", async () => {
    const res = await http("/api/admin/cms/revert", { method: "POST" });
    assert.equal(res.status, 401);
  });

  it("Token de preview sans auth admin → 401", async () => {
    const res = await http("/api/admin/cms/preview", { method: "POST" });
    assert.equal(res.status, 401);
  });
});

describe("CMS — gestion des listes", () => {
  it("PATCH home.story.fragments accepte une liste", async () => {
    const res = await adminFetch(token, "/api/admin/cms/home.story", {
      method: "PATCH",
      body: JSON.stringify({ fragments: ["A", "B", "C"] }),
    });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.draft["home.story"].fragments, ["A", "B", "C"]);
  });

  it("publish + lecture publique reflète la liste", async () => {
    await adminFetch(token, "/api/admin/cms/home.story", {
      method: "PATCH",
      body: JSON.stringify({ fragments: ["Un", "Deux"] }),
    });
    await adminFetch(token, "/api/admin/cms/publish", { method: "POST" });
    const pub = await http("/api/store/cms");
    assert.deepEqual(pub.body.content["home.story"].fragments, ["Un", "Deux"]);
  });
});
