import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const FILE = path.join(ROOT, "data/checkoutPending.json");

let mod;

describe("CheckoutPending", () => {
  before(async () => {
    if (fs.existsSync(FILE)) fs.unlinkSync(FILE);
    mod = await import("../../server/lib/checkoutPending.mjs");
  });

  it("generateRefCommand produit un identifiant CHK-...", () => {
    const ref = mod.generateRefCommand();
    assert.match(ref, /^CHK-/);
    const ref2 = mod.generateRefCommand();
    assert.notEqual(ref, ref2);
  });

  it("savePending puis getPending retourne le payload", () => {
    const ref = mod.generateRefCommand();
    mod.savePending(ref, { totalXof: 5000, customer: { email: "a@b.c" } });
    const p = mod.getPending(ref);
    assert.ok(p);
    assert.equal(p.ref, ref);
    assert.equal(p.totalXof, 5000);
    assert.equal(p.isProcessed, false);
  });

  it("getPending renvoie null pour ref inconnue", () => {
    assert.equal(mod.getPending("CHK-INEXISTANT"), null);
  });

  it("appendIpnLog s'accumule dans ipnLogs (plus récent en premier)", () => {
    const ref = mod.generateRefCommand();
    mod.savePending(ref, { totalXof: 1000 });
    mod.appendIpnLog(ref, { event: "ipn.received" });
    mod.appendIpnLog(ref, { event: "ipn.verified" });
    const p = mod.getPending(ref);
    assert.equal(p.ipnLogs.length, 2);
    // Le plus récent (verified) est en tête
    assert.equal(p.ipnLogs[0].event, "ipn.verified");
    assert.equal(p.ipnLogs[1].event, "ipn.received");
  });

  it("markProcessed marque le pending traité (idempotence)", () => {
    const ref = mod.generateRefCommand();
    mod.savePending(ref, { totalXof: 1000 });
    mod.markProcessed(ref, "FANG-XXX", { token: "abc" });
    const p = mod.getPending(ref);
    assert.equal(p.isProcessed, true);
    assert.equal(p.orderId, "FANG-XXX");
    assert.deepEqual(p.gatewayMeta, { token: "abc" });
  });

  it("listPending filtre les expirés par défaut", () => {
    const ref = mod.generateRefCommand();
    mod.savePending(ref, { totalXof: 100 });
    // Manipule directement l'expiration en lecture/écriture du fichier
    const raw = JSON.parse(fs.readFileSync(FILE, "utf8"));
    raw.items[ref].expiresAt = new Date(Date.now() - 1000).toISOString();
    fs.writeFileSync(FILE, JSON.stringify(raw, null, 2));

    const valid = mod.listPending();
    const all = mod.listPending({ includeExpired: true });
    assert.ok(!valid.find((x) => x.ref === ref));
    assert.ok(all.find((x) => x.ref === ref));
  });

  it("purgePending supprime les expirés", () => {
    const ref = mod.generateRefCommand();
    mod.savePending(ref, { totalXof: 100 });
    const raw = JSON.parse(fs.readFileSync(FILE, "utf8"));
    raw.items[ref].expiresAt = new Date(Date.now() - 1000).toISOString();
    fs.writeFileSync(FILE, JSON.stringify(raw, null, 2));

    mod.purgePending();
    const after = JSON.parse(fs.readFileSync(FILE, "utf8"));
    assert.ok(!after.items[ref]);
  });
});
