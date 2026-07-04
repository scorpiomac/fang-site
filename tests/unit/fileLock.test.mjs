import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { withFileLock } from "../../server/lib/fileLock.mjs";

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "fang-lock-"));
const FILE = path.join(TMP, "test.txt");

before(() => {
  fs.writeFileSync(FILE, "init");
});

describe("withFileLock — verrou de fichier", () => {
  it("exécute la fonction et retourne sa valeur", () => {
    const result = withFileLock(FILE, () => 42);
    assert.equal(result, 42);
  });

  it("supprime le fichier .lock après exécution", () => {
    withFileLock(FILE, () => null);
    assert.ok(!fs.existsSync(`${FILE}.lock`));
  });

  it("supprime le .lock même si fn throw", () => {
    assert.throws(() => {
      withFileLock(FILE, () => {
        throw new Error("boom");
      });
    }, /boom/);
    assert.ok(!fs.existsSync(`${FILE}.lock`));
  });

  it("isolation : deux appels successifs ne s'entremêlent pas", () => {
    let counter = 0;
    const results = [];
    for (let i = 0; i < 10; i++) {
      withFileLock(FILE, () => {
        const c = counter++;
        // Simule du "travail" en attendant
        const end = Date.now() + 2;
        while (Date.now() < end) {
          /* spin */
        }
        results.push(c);
      });
    }
    // Le compteur doit être strictement croissant
    for (let i = 1; i < results.length; i++) {
      assert.ok(results[i] > results[i - 1]);
    }
  });

  it("lock orphelin trop ancien est récupéré", () => {
    // Crée un lock manuellement avec un mtime très ancien
    fs.writeFileSync(`${FILE}.lock`, "99999");
    const veryOld = Date.now() / 1000 - 3600; // 1h ago
    fs.utimesSync(`${FILE}.lock`, veryOld, veryOld);
    const result = withFileLock(FILE, () => "recovered", { timeoutMs: 200 });
    assert.equal(result, "recovered");
  });
});
