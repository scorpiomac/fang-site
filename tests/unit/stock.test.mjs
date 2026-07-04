import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const STOCK_FILE = path.join(ROOT, "data/stock.json");

let stock;

describe("Stock — gestion atomique", () => {
  before(async () => {
    if (fs.existsSync(STOCK_FILE)) fs.unlinkSync(STOCK_FILE);
    stock = await import("../../server/lib/stock.mjs");
  });

  it("setStockQty et getStockQty cohérents", () => {
    stock.setStockQty("test-product", "default", "M", 10);
    assert.equal(stock.getStockQty("test-product", "default", "M"), 10);
  });

  it("isInStock retourne true si quantité suffisante", () => {
    stock.setStockQty("test-product", "default", "M", 5);
    assert.equal(stock.isInStock("test-product", "default", "M", 3), true);
    assert.equal(stock.isInStock("test-product", "default", "M", 5), true);
    assert.equal(stock.isInStock("test-product", "default", "M", 6), false);
  });

  it("reserveStock décrémente la quantité", () => {
    stock.setStockQty("p1", "default", "M", 10);
    const res = stock.reserveStock([
      { productKey: "p1", variationId: "default", size: "M", qty: 3 },
    ]);
    assert.equal(res.ok, true);
    assert.equal(stock.getStockQty("p1", "default", "M"), 7);
  });

  it("reserveStock refuse si stock insuffisant", () => {
    stock.setStockQty("p2", "default", "M", 2);
    const res = stock.reserveStock([
      { productKey: "p2", variationId: "default", size: "M", qty: 5 },
    ]);
    assert.equal(res.ok, false);
    assert.ok(Array.isArray(res.errors));
    assert.equal(res.errors[0].requested, 5);
    assert.equal(res.errors[0].available, 2);
    // Le stock n'a PAS été décrementé (atomicité)
    assert.equal(stock.getStockQty("p2", "default", "M"), 2);
  });

  it("reserveStock ignore les produits non-trackés", () => {
    // Pas de setStockQty → produit absent → considéré comme non tracké → autorise
    const res = stock.reserveStock([
      { productKey: "untracked-product", variationId: "default", size: "M", qty: 999 },
    ]);
    assert.equal(res.ok, true);
  });

  it("reserveStock est atomique sur plusieurs lignes (tout ou rien)", () => {
    stock.setStockQty("multi-1", "default", "M", 5);
    stock.setStockQty("multi-2", "default", "M", 1);
    const res = stock.reserveStock([
      { productKey: "multi-1", variationId: "default", size: "M", qty: 3 },
      { productKey: "multi-2", variationId: "default", size: "M", qty: 5 }, // dépasse
    ]);
    assert.equal(res.ok, false);
    // Aucun stock ne doit avoir bougé
    assert.equal(stock.getStockQty("multi-1", "default", "M"), 5);
    assert.equal(stock.getStockQty("multi-2", "default", "M"), 1);
  });
});
