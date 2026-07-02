/**
 * Persistance critique FANG — CMS, médias hero, backups hors projet.
 * Objectif : ne plus perdre cms.json ni cms-media après rebuild / accident.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../");
const DATA_DIR = path.join(ROOT, "data");
const CMS_FILE = path.join(DATA_DIR, "cms.json");
const CMS_MEDIA_ROOT = path.join(ROOT, "cms-media");
const LOCAL_BACKUP_DIR = path.join(ROOT, "backups");

const EXTERNAL_ROOT =
  process.env.FANG_BACKUP_ROOT || "/var/backups/fang-site";

const GOLDEN_CMS = path.join(EXTERNAL_ROOT, "golden/cms.json");
const CMS_HISTORY_DIR = path.join(EXTERNAL_ROOT, "cms-history");
const MEDIA_BACKUP_DIR = path.join(EXTERNAL_ROOT, "media");
const EXTERNAL_DATA_DIR = path.join(EXTERNAL_ROOT, "data");
const LOCAL_CMS_HISTORY = path.join(DATA_DIR, "cms.history");

const CMS_HISTORY_KEEP = 200;
const LOCAL_CMS_HISTORY_KEEP = 50;
const MEDIA_BACKUP_KEEP_DAYS = 30;

function ensureDirs() {
  for (const dir of [
    EXTERNAL_ROOT,
    path.dirname(GOLDEN_CMS),
    CMS_HISTORY_DIR,
    MEDIA_BACKUP_DIR,
    EXTERNAL_DATA_DIR,
    LOCAL_CMS_HISTORY,
    LOCAL_BACKUP_DIR,
  ]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

function rotateFiles(dir, keep, pattern = null) {
  if (!fs.existsSync(dir)) return;
  const files = fs
    .readdirSync(dir)
    .filter((n) => !pattern || pattern.test(n))
    .sort()
    .reverse();
  for (const name of files.slice(keep)) {
    try {
      fs.unlinkSync(path.join(dir, name));
    } catch {
      /* ignore */
    }
  }
}

function rotateMediaBackups() {
  if (!fs.existsSync(MEDIA_BACKUP_DIR)) return;
  const cutoff = Date.now() - MEDIA_BACKUP_KEEP_DAYS * 24 * 60 * 60 * 1000;
  for (const name of fs.readdirSync(MEDIA_BACKUP_DIR)) {
    if (!name.startsWith("cms-media-")) continue;
    const full = path.join(MEDIA_BACKUP_DIR, name);
    try {
      const st = fs.statSync(full);
      if (st.mtimeMs < cutoff) fs.unlinkSync(full);
    } catch {
      /* ignore */
    }
  }
}

export function countPublishedSections(state) {
  const pub = state?.published ?? {};
  return Object.keys(pub).filter((k) => {
    const sec = pub[k];
    return sec && typeof sec === "object" && Object.keys(sec).length > 0;
  }).length;
}

export function loadGoldenCms() {
  if (!fs.existsSync(GOLDEN_CMS)) return null;
  try {
    return JSON.parse(fs.readFileSync(GOLDEN_CMS, "utf8"));
  } catch {
    return null;
  }
}

/** Détecte une régression (CMS vidé ou hero sans vidéo alors qu'on avait une copie saine). */
export function isCmsDegraded(state, golden = loadGoldenCms()) {
  if (!state || typeof state !== "object") return true;

  const pub = state.published ?? {};
  const pubCount = countPublishedSections(state);
  const goldenCount = golden ? countPublishedSections(golden) : 0;

  if (state.publishedAt && pubCount === 0) return true;
  if (goldenCount >= 3 && pubCount === 0) return true;
  if (goldenCount >= 3 && pubCount < Math.ceil(goldenCount / 2)) return true;

  const gHero = golden?.published?.["home.hero"];
  const pHero = pub["home.hero"];
  if (gHero?.video && !pHero?.video) return true;
  if (gHero?.poster && !pHero?.poster) return true;

  return false;
}

export function updateGoldenCms(state) {
  if (!state?.published || countPublishedSections(state) === 0) return;
  ensureDirs();
  fs.writeFileSync(GOLDEN_CMS, JSON.stringify(state, null, 2));
  if (fs.existsSync(CMS_FILE)) {
    fs.copyFileSync(CMS_FILE, path.join(EXTERNAL_ROOT, "golden/cms-live.json"));
  }
}

export function archiveCmsState(state, reason = "write") {
  ensureDirs();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const safeReason = String(reason).replace(/[^\w.-]/g, "_").slice(0, 40);
  const name = `${stamp}-${safeReason}.json`;
  const payload = JSON.stringify(state, null, 2);

  fs.writeFileSync(path.join(CMS_HISTORY_DIR, name), payload);
  rotateFiles(CMS_HISTORY_DIR, CMS_HISTORY_KEEP);

  fs.writeFileSync(path.join(LOCAL_CMS_HISTORY, name), payload);
  rotateFiles(LOCAL_CMS_HISTORY, LOCAL_CMS_HISTORY_KEEP);
}

export function findBestCmsBackup() {
  const golden = loadGoldenCms();
  if (golden && countPublishedSections(golden) > 0) {
    return { source: "golden/cms.json", state: golden };
  }

  if (fs.existsSync(CMS_HISTORY_DIR)) {
    const files = fs.readdirSync(CMS_HISTORY_DIR).sort().reverse();
    for (const file of files) {
      try {
        const state = JSON.parse(fs.readFileSync(path.join(CMS_HISTORY_DIR, file), "utf8"));
        if (countPublishedSections(state) > 0) return { source: `cms-history/${file}`, state };
      } catch {
        /* ignore */
      }
    }
  }

  if (fs.existsSync(LOCAL_CMS_HISTORY)) {
    const files = fs.readdirSync(LOCAL_CMS_HISTORY).sort().reverse();
    for (const file of files) {
      try {
        const state = JSON.parse(fs.readFileSync(path.join(LOCAL_CMS_HISTORY, file), "utf8"));
        if (countPublishedSections(state) > 0) return { source: `data/cms.history/${file}`, state };
      } catch {
        /* ignore */
      }
    }
  }

  const dirs = [LOCAL_BACKUP_DIR, EXTERNAL_DATA_DIR];
  let best = null;
  let bestScore = 0;

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.startsWith("fang-data-") || !name.endsWith(".json.gz")) continue;
      try {
        const gz = fs.readFileSync(path.join(dir, name));
        const payload = JSON.parse(zlib.gunzipSync(gz).toString("utf8"));
        const cms = payload.cms;
        if (!cms) continue;
        const score = JSON.stringify(cms.published ?? {}).length;
        if (score > bestScore) {
          bestScore = score;
          best = { source: `backup/${name}`, state: cms };
        }
      } catch {
        /* ignore */
      }
    }
  }

  return best;
}

/** Restaure cms.json depuis golden / historique / backup si état dégradé. */
export function repairCmsIfNeeded() {
  ensureDirs();

  let current = null;
  if (fs.existsSync(CMS_FILE)) {
    try {
      current = JSON.parse(fs.readFileSync(CMS_FILE, "utf8"));
    } catch {
      current = null;
    }
  }

  const golden = loadGoldenCms();

  if (current && !isCmsDegraded(current, golden)) {
    if (countPublishedSections(current) > countPublishedSections(golden ?? {})) {
      updateGoldenCms(current);
    }
    return { repaired: false };
  }

  const best = findBestCmsBackup();
  if (!best) {
    return { repaired: false, reason: "aucune sauvegarde CMS disponible" };
  }

  if (current) archiveCmsState(current, "pre-repair");
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CMS_FILE, JSON.stringify(best.state, null, 2));
  updateGoldenCms(best.state);

  console.warn(`[persist] CMS réparé automatiquement depuis ${best.source}`);
  return { repaired: true, source: best.source };
}

/** Snapshot tar.gz de cms-media/ (vidéos hero, posters). */
export function backupCmsMedia({ force = false } = {}) {
  if (!fs.existsSync(CMS_MEDIA_ROOT)) return null;
  ensureDirs();

  const stamp = new Date().toISOString().slice(0, 10);
  const out = path.join(MEDIA_BACKUP_DIR, `cms-media-${stamp}.tar.gz`);
  if (!force && fs.existsSync(out)) return out;

  const parent = path.dirname(CMS_MEDIA_ROOT);
  const base = path.basename(CMS_MEDIA_ROOT);
  execSync(`tar -czf "${out}" -C "${parent}" "${base}"`, { stdio: "pipe" });
  rotateMediaBackups();
  return out;
}

export function mirrorDataBackup(srcFile) {
  if (!srcFile || !fs.existsSync(srcFile)) return null;
  ensureDirs();
  const dest = path.join(EXTERNAL_DATA_DIR, path.basename(srcFile));
  fs.copyFileSync(srcFile, dest);
  return dest;
}

export function listExternalBackups() {
  ensureDirs();
  if (!fs.existsSync(EXTERNAL_DATA_DIR)) return [];
  return fs
    .readdirSync(EXTERNAL_DATA_DIR)
    .filter((n) => n.startsWith("fang-data-"))
    .map((name) => {
      const stat = fs.statSync(path.join(EXTERNAL_DATA_DIR, name));
      return { name, size: stat.size, createdAt: stat.mtime.toISOString(), location: "external" };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Au boot : réparer CMS, snapshot médias, initialiser golden si absent. */
export function ensurePersistenceOnBoot() {
  ensureDirs();
  const repair = repairCmsIfNeeded();

  try {
    if (fs.existsSync(CMS_FILE)) {
      const state = JSON.parse(fs.readFileSync(CMS_FILE, "utf8"));
      if (!loadGoldenCms() && countPublishedSections(state) > 0) {
        updateGoldenCms(state);
        console.log("[persist] Golden CMS initialisé depuis l'état actuel.");
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const media = backupCmsMedia();
    if (media) console.log(`[persist] Snapshot cms-media : ${path.basename(media)}`);
  } catch (err) {
    console.warn("[persist] backup cms-media échoué:", err.message);
  }

  return repair;
}

/** Après publication CMS : historique + golden + backup data + médias. */
export function onCmsPublished(state) {
  archiveCmsState(state, "publish");
  updateGoldenCms(state);

  import("./backup.mjs")
    .then(({ createBackup }) => createBackup())
    .catch((err) => console.warn("[persist] backup post-publish échoué:", err.message));

  try {
    backupCmsMedia({ force: true });
  } catch (err) {
    console.warn("[persist] backup cms-media post-publish échoué:", err.message);
  }
}

/** Avant chaque écriture cms.json. */
export function onCmsWrite(state, reason = "write") {
  archiveCmsState(state, reason);
}
