import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");
const BACKUP_DIR = path.resolve(__dirname, "../../backups");
const KEEP_DAYS = 7;

const BACKUP_TARGETS = [
  "settings.json",
  "shippingZones.json",
  "stock.json",
  "orders.json",
  "users.json",
  "customers.json",
  "promos.json",
  "products.json",
  "promoCodes.json",
  "reviews.json",
  "wishlists.json",
  "pages.json",
  "mailTemplates.json",
  "audit.json",
  "newsletter.json",
];

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function backupName() {
  const d = new Date();
  const stamp = d.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `fang-data-${stamp}.json.gz`;
}

/**
 * Crée un backup gzipé de tout le contenu data/ (les fichiers cibles seulement).
 * Renvoie le chemin du fichier créé.
 */
export async function createBackup() {
  ensureBackupDir();
  const payload = {};
  for (const file of BACKUP_TARGETS) {
    const p = path.join(DATA_DIR, file);
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, "utf8");
        payload[file] = JSON.parse(raw);
      } catch (err) {
        console.warn(`[backup] skip ${file}:`, err.message);
      }
    }
  }

  const outFile = path.join(BACKUP_DIR, backupName());
  const json = Buffer.from(JSON.stringify(payload, null, 2), "utf8");
  const gz = zlib.gzipSync(json);
  fs.writeFileSync(outFile, gz);

  rotateBackups();
  return outFile;
}

function rotateBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return;
  const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
  for (const name of fs.readdirSync(BACKUP_DIR)) {
    if (!name.startsWith("fang-data-")) continue;
    const stat = fs.statSync(path.join(BACKUP_DIR, name));
    if (stat.mtimeMs < cutoff) {
      fs.unlinkSync(path.join(BACKUP_DIR, name));
    }
  }
}

export function listBackups() {
  ensureBackupDir();
  return fs
    .readdirSync(BACKUP_DIR)
    .filter((n) => n.startsWith("fang-data-"))
    .map((name) => {
      const stat = fs.statSync(path.join(BACKUP_DIR, name));
      return { name, size: stat.size, createdAt: stat.mtime.toISOString() };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function restoreBackup(name) {
  const file = path.join(BACKUP_DIR, name);
  if (!fs.existsSync(file)) throw new Error("Backup introuvable");
  const gz = fs.readFileSync(file);
  const json = zlib.gunzipSync(gz).toString("utf8");
  const payload = JSON.parse(json);

  // Snapshot des fichiers existants avant restore
  const snapshotDir = path.join(BACKUP_DIR, `pre-restore-${Date.now()}`);
  fs.mkdirSync(snapshotDir, { recursive: true });

  for (const [filename, data] of Object.entries(payload)) {
    const dest = path.join(DATA_DIR, filename);
    if (fs.existsSync(dest)) {
      fs.copyFileSync(dest, path.join(snapshotDir, filename));
    }
    fs.writeFileSync(dest, JSON.stringify(data, null, 2));
  }
  return { restoredFiles: Object.keys(payload), snapshotDir };
}

/**
 * Démarre un timer quotidien pour créer un backup automatique.
 * À appeler une fois au boot du serveur.
 */
export function scheduleDailyBackup() {
  // Backup immédiat au boot si aucun backup du jour
  const todayStr = new Date().toISOString().slice(0, 10);
  const existing = listBackups();
  const hasToday = existing.some((b) => b.createdAt.startsWith(todayStr));
  if (!hasToday) {
    createBackup()
      .then((p) => console.log(`[backup] created at boot: ${path.basename(p)}`))
      .catch((err) => console.warn("[backup] boot failed:", err.message));
  }

  // Re-tick toutes les 24h
  setInterval(() => {
    createBackup()
      .then((p) => console.log(`[backup] created: ${path.basename(p)}`))
      .catch((err) => console.warn("[backup] daily failed:", err.message));
  }, 24 * 60 * 60 * 1000);
}
