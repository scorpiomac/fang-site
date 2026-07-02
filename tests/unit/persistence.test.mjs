import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  countPublishedSections,
  isCmsDegraded,
} from "../../server/lib/persistence.mjs";

describe("persistence — CMS", () => {
  it("détecte un CMS vidé après publication", () => {
    const golden = {
      published: {
        "home.hero": { video: "/cms-media/home.hero/v.mp4", title: "FANG" },
        brand: { name: "FANG" },
        "home.story": { fragments: ["a"] },
      },
      publishedAt: "2026-06-01T00:00:00.000Z",
    };
    const empty = { published: {}, publishedAt: "2026-06-02T00:00:00.000Z" };
    assert.equal(isCmsDegraded(empty, golden), true);
    assert.equal(isCmsDegraded(golden, golden), false);
  });

  it("détecte la perte de la vidéo hero", () => {
    const golden = {
      published: {
        "home.hero": { video: "/cms-media/home.hero/v.mp4", title: "FANG" },
        brand: { name: "FANG" },
        "home.story": { fragments: ["a"] },
      },
    };
    const degraded = {
      published: {
        "home.hero": { title: "FANG" },
        brand: { name: "FANG" },
        "home.story": { fragments: ["a"] },
      },
    };
    assert.equal(isCmsDegraded(degraded, golden), true);
  });

  it("compte les sections publiées non vides", () => {
    const state = {
      published: {
        "home.hero": { title: "FANG" },
        brand: {},
        "home.story": { fragments: [] },
      },
    };
    assert.equal(countPublishedSections(state), 2);
  });
});
