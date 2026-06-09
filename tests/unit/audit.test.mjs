import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const FILE = path.join(ROOT, "data/audit.json");

let audit;

describe("Audit log", () => {
  before(async () => {
    if (fs.existsSync(FILE)) fs.unlinkSync(FILE);
    audit = await import("../../server/lib/audit.mjs");
  });

  it("recordAudit persiste une action", () => {
    audit.recordAudit("test.action", {
      actor: { email: "test@example.com" },
      target: { type: "order", id: "FANG-1" },
      meta: { foo: "bar" },
      ip: "127.0.0.1",
    });
    const list = audit.listAudit({ limit: 10 });
    assert.ok(list.entries.length >= 1);
    const entry = list.entries[0];
    assert.equal(entry.action, "test.action");
    assert.equal(entry.target.id, "FANG-1");
    assert.equal(entry.meta.foo, "bar");
    assert.equal(entry.ip, "127.0.0.1");
  });

  it("listAudit filtre par action", () => {
    audit.recordAudit("filter.match", {});
    audit.recordAudit("filter.other", {});
    const matched = audit.listAudit({ action: "filter.match", limit: 100 });
    assert.ok(matched.entries.every((e) => e.action === "filter.match"));
  });

  it("listAudit applique limit et offset", () => {
    for (let i = 0; i < 5; i++) {
      audit.recordAudit("paging.test", { meta: { i } });
    }
    const first = audit.listAudit({ action: "paging.test", limit: 2, offset: 0 });
    const next = audit.listAudit({ action: "paging.test", limit: 2, offset: 2 });
    assert.equal(first.entries.length, 2);
    assert.equal(next.entries.length, 2);
    assert.notDeepEqual(first.entries[0].id, next.entries[0].id);
  });

  it("actionsSummary renvoie un comptage par action", () => {
    const summary = audit.actionsSummary();
    assert.ok(typeof summary === "object");
    assert.ok(summary["paging.test"] >= 5);
  });
});
