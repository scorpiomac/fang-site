/**
 * Tests SEO : robots.txt et sitemap.xml.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { http } from "../helpers/http.mjs";

describe("SEO — robots.txt", () => {
  it("GET /robots.txt répond en text/plain", async () => {
    const res = await http("/robots.txt");
    assert.equal(res.status, 200);
    const ct = res.headers.get("content-type") ?? "";
    assert.ok(ct.includes("text/plain"));
  });

  it("robots.txt contient User-agent et Sitemap", async () => {
    const res = await http("/robots.txt");
    assert.match(res.text, /User-agent:/);
    assert.match(res.text, /Sitemap:/i);
  });
});

describe("SEO — sitemap.xml", () => {
  it("GET /sitemap.xml répond en XML", async () => {
    const res = await http("/sitemap.xml");
    assert.equal(res.status, 200);
    const ct = res.headers.get("content-type") ?? "";
    assert.ok(ct.includes("xml"));
  });

  it("sitemap.xml contient les URLs canoniques", async () => {
    const res = await http("/sitemap.xml");
    assert.match(res.text, /<urlset/);
    assert.match(res.text, /<url>/);
    assert.match(res.text, /<loc>/);
  });

  it("sitemap.xml inclut les pages éditoriales publiques", async () => {
    const res = await http("/sitemap.xml");
    // Au moins une page /pages/... doit apparaître (cgv etc.)
    assert.match(res.text, /\/pages\//);
  });
});
