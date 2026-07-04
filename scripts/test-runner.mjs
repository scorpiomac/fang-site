#!/usr/bin/env node
/**
 * Orchestrateur de tests FANG.
 *
 *  1. Sauvegarde data/ (et siteOverrides.json) dans data.testbackup-{ts}/
 *  2. Génère un mot de passe admin éphémère
 *  3. Lance le serveur sur un PORT libre avec FANG_DATA_DIR vide
 *  4. Attend que /api/ping réponde
 *  5. Exécute `node --test` sur tests/unit + tests/integration
 *  6. Tue le serveur
 *  7. Restaure les données originales
 *
 * Codes de sortie :
 *   0 = OK
 *   1 = échec test
 *   2 = échec setup/teardown
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import net from "node:net";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const SITE_OVR = path.join(ROOT, "src/content/siteOverrides.json");

const args = process.argv.slice(2);
const RUN_UNIT = !args.includes("--integration-only");
const RUN_INTEG = !args.includes("--unit-only");

/* ─── Utilitaires ─────────────────────────────────────────────────────── */

async function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

function copyDirSync(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDirSync(s, d);
    else fs.copyFileSync(s, d);
  }
}

function rmDirSync(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

async function waitForHealth(url, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(800) });
      if (res.ok) return true;
    } catch {
      /* not ready */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

async function runChild(cmd, cmdArgs, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, cmdArgs, {
      stdio: "inherit",
      env: { ...process.env, ...env },
      cwd: ROOT,
    });
    child.on("exit", (code) => resolve(code ?? 0));
  });
}

/* ─── Backup & restore ────────────────────────────────────────────────── */

const ts = Date.now();
const BACKUP_DIR = path.join(ROOT, `data.testbackup-${ts}`);
const SITE_OVR_BAK = `${SITE_OVR}.testbackup-${ts}`;

function backupData() {
  console.log(`[runner] Backup data/ → ${path.relative(ROOT, BACKUP_DIR)}/`);
  if (fs.existsSync(DATA_DIR)) {
    copyDirSync(DATA_DIR, BACKUP_DIR);
    rmDirSync(DATA_DIR);
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(SITE_OVR)) {
    fs.copyFileSync(SITE_OVR, SITE_OVR_BAK);
  }
}

function restoreData() {
  console.log("[runner] Restauration data/");
  rmDirSync(DATA_DIR);
  if (fs.existsSync(BACKUP_DIR)) {
    copyDirSync(BACKUP_DIR, DATA_DIR);
    rmDirSync(BACKUP_DIR);
  } else {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(SITE_OVR_BAK)) {
    fs.copyFileSync(SITE_OVR_BAK, SITE_OVR);
    fs.unlinkSync(SITE_OVR_BAK);
  }
}

/* ─── Démarrage serveur ───────────────────────────────────────────────── */

async function startServer({ port, adminEmail, adminPassword }) {
  console.log(`[runner] Spawn server admin sur :${port}…`);
  const child = spawn(
    process.execPath,
    [path.join("server", "admin.mjs")],
    {
      cwd: ROOT,
      env: {
        ...process.env,
        FANG_ADMIN_PORT: String(port),
        NODE_ENV: "test",
        FANG_ADMIN_EMAIL: adminEmail,
        FANG_ADMIN_PASSWORD: adminPassword,
        CHECKOUT_ALLOW_SIMULATED_PAYMENT: "true",
        FANG_DISABLE_BACKUPS: "1",
        FANG_DISABLE_RATE_LIMIT: "1",
        CORS_ORIGIN: "http://localhost:5173",
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  let bootLogs = "";
  const onData = (chunk) => {
    bootLogs += chunk.toString();
  };
  child.stdout.on("data", onData);
  child.stderr.on("data", onData);

  const ready = await waitForHealth(`http://localhost:${port}/api/admin/ping`, 15000);
  child.stdout.off("data", onData);
  child.stderr.off("data", onData);

  if (!ready) {
    console.error("[runner] Le serveur n'a pas démarré dans les temps.");
    console.error(bootLogs);
    child.kill("SIGKILL");
    throw new Error("server_not_ready");
  }
  console.log("[runner] Serveur prêt.");

  // Le serveur reste muet pour le reste du run sauf erreurs critiques
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));

  return child;
}

/* ─── Main ────────────────────────────────────────────────────────────── */

(async function main() {
  const port = await findFreePort();
  const adminEmail = "admin-tests@fang.local";
  const adminPassword = `Test-${crypto.randomBytes(8).toString("hex")}!`;
  const baseUrl = `http://localhost:${port}`;

  backupData();

  let serverChild = null;
  let exitCode = 0;
  const cleanup = () => {
    try {
      if (serverChild && !serverChild.killed) {
        serverChild.kill("SIGTERM");
        setTimeout(() => {
          if (serverChild && !serverChild.killed) serverChild.kill("SIGKILL");
        }, 1000);
      }
    } catch {
      /* ignore */
    }
    restoreData();
  };
  process.on("SIGINT", () => {
    cleanup();
    process.exit(130);
  });
  process.on("uncaughtException", (err) => {
    console.error("[runner] uncaught:", err);
    cleanup();
    process.exit(2);
  });

  try {
    const testEnv = {
      FANG_TEST_BASE_URL: baseUrl,
      FANG_TEST_ADMIN_EMAIL: adminEmail,
      FANG_TEST_ADMIN_PASSWORD: adminPassword,
      NODE_OPTIONS: process.env.NODE_OPTIONS ?? "",
    };

    const unitFiles = fs
      .readdirSync(path.join(ROOT, "tests/unit"))
      .filter((f) => f.endsWith(".test.mjs"))
      .map((f) => path.join("tests/unit", f));
    const integFiles = fs
      .readdirSync(path.join(ROOT, "tests/integration"))
      .filter((f) => f.endsWith(".test.mjs"))
      .map((f) => path.join("tests/integration", f));

    /* 1. Tests unitaires (n'ont pas besoin du serveur) */
    if (RUN_UNIT && unitFiles.length > 0) {
      console.log("\n══════════════════════════════════════");
      console.log("  Tests unitaires (modules)");
      console.log("══════════════════════════════════════");
      const code = await runChild(
        process.execPath,
        ["--test", "--test-reporter=spec", ...unitFiles],
        testEnv
      );
      if (code !== 0) exitCode = code;
    }

    /* 2. Tests d'intégration (besoin du serveur) */
    if (RUN_INTEG && integFiles.length > 0) {
      // Reset data/ entre les phases pour éviter pollution unit → intégration
      rmDirSync(DATA_DIR);
      fs.mkdirSync(DATA_DIR, { recursive: true });
      serverChild = await startServer({ port, adminEmail, adminPassword });
      console.log("\n══════════════════════════════════════");
      console.log(`  Tests d'intégration → ${baseUrl}`);
      console.log("══════════════════════════════════════");
      const code = await runChild(
        process.execPath,
        ["--test", "--test-reporter=spec", ...integFiles],
        testEnv
      );
      if (code !== 0) exitCode = code;
    }
  } catch (e) {
    console.error("[runner] Erreur :", e?.message ?? e);
    exitCode = 2;
  } finally {
    cleanup();
  }

  console.log(exitCode === 0 ? "\n✓ Tests OK" : `\n✗ Tests en échec (code ${exitCode})`);
  process.exit(exitCode);
})();
