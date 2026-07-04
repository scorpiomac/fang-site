#!/usr/bin/env node
/**
 * Source de vérité : « SAISON 1 neel fang »
 *   Ordre + numérotation ← noms des dossiers chapitres
 *   Personnages ← sous-dossiers
 *   Produits ← images dans chaque personnage
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEFAULT_SOURCE = path.resolve(ROOT, "../SAISON 1  neel fang");
const SOURCE = process.env.FANG_SAISON1_DIR ?? DEFAULT_SOURCE;
const OUT = path.join(ROOT, "public/collection/s01");
const CATALOG = path.join(ROOT, "src/content/atelierCatalog.json");
const MAX_IMAGES = Number(process.env.FANG_CAST_MAX ?? 24);

const SKIP_DIRS = new Set(["VIDEO", "MUSIQUE", "LOGO", ".DS_Store"]);

/** Ids stables pour routes + récit (chapters.ts) — indexés par le numéro atelier */
const SITE_IDS_BY_NUMBER = {
  1: { id: "tambali", slug: "tambali" },
  2: { id: "passage", slug: "passage" },
  3: { id: "exposition", slug: "exposition" },
  4: { id: "feu", slug: "feu" },
  5: { id: "ge-am", slug: "ge-am" },
  6: { id: "racine", slug: "racine" },
  7: { id: "mbougir", slug: "mbougir" },
};

const IMG_RE = /\.(jpe?g|png|webp)$/i;

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function titleCase(value) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Extrait le numéro de chapitre depuis le nom du dossier atelier */
function parseChapterNumber(folderName) {
  const n = folderName.trim();
  let m = n.match(/chapitre\s*(\d+)/i);
  if (m) return Number(m[1]);
  m = n.match(/chap\s*(\d+)/i);
  if (m) return Number(m[1]);
  m = n.match(/^(\d+)\b/);
  if (m) return Number(m[1]);
  return 999;
}

/** Titre affiché dérivé du dossier (sans préfixe chapitre / numéro) */
function parseChapterTitle(folderName) {
  const n = folderName.trim();
  const stripped = n
    .replace(/^chapitre\s*\d+\s*/i, "")
    .replace(/^chap\s*\d+\s*/i, "")
    .replace(/^\d+\s*/, "")
    .trim();
  return titleCase(stripped || n);
}

function chapterMetaFromFolder(folderName) {
  const order = parseChapterNumber(folderName);
  const index = order < 999 ? String(order).padStart(2, "0") : "00";
  const name = parseChapterTitle(folderName);
  const site = SITE_IDS_BY_NUMBER[order];
  const id = site?.id ?? slugify(name) ?? `chapitre-${index}`;
  const slug = site?.slug ?? id;
  return { order, index, name, id, slug, sourceFolder: folderName };
}

function resize(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    execSync(`sips -Z 1400 "${src}" --out "${dest}"`, { stdio: "pipe" });
  } catch {
    fs.copyFileSync(src, dest);
  }
}

function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && IMG_RE.test(d.name))
    .map((d) => path.join(dir, d.name))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function listChapterDirs(root) {
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !SKIP_DIRS.has(d.name) && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort((a, b) => parseChapterNumber(a) - parseChapterNumber(b));
}

function listCharacterDirs(chapterDir) {
  if (!fs.existsSync(chapterDir)) return [];
  const entries = fs.readdirSync(chapterDir, { withFileTypes: true });
  const subdirs = entries
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name);

  if (subdirs.length > 0) {
    return subdirs.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }

  const rootImages = listImages(chapterDir);
  if (rootImages.length > 0) return ["."];
  return [];
}

function publicRel(chapterId, characterSlug, file) {
  return `collection/s01/${chapterId}/personnages/${characterSlug}/${file}`;
}

function scanFromPublicFallback() {
  if (!fs.existsSync(OUT)) return null;
  const chapters = [];

  for (const [num, site] of Object.entries(SITE_IDS_BY_NUMBER)) {
    const chapterId = site.id;
    const persoDir = path.join(OUT, chapterId, "personnages");
    const castDir = path.join(OUT, chapterId, "cast");
    const charRoot = fs.existsSync(persoDir) ? persoDir : castDir;
    const pathPrefix = fs.existsSync(persoDir) ? "personnages" : "cast";
    if (!fs.existsSync(charRoot)) continue;

    const characters = [];
    for (const charSlug of fs.readdirSync(charRoot)) {
      const charDir = path.join(charRoot, charSlug);
      if (!fs.statSync(charDir).isDirectory()) continue;
      const files = fs
        .readdirSync(charDir)
        .filter((f) => IMG_RE.test(f))
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
      if (files.length === 0) continue;
      const sub = `collection/s01/${chapterId}/${pathPrefix}/${charSlug}/`;
      characters.push({
        id: `${chapterId}-${charSlug}`,
        slug: charSlug,
        name: titleCase(charSlug.replace(/-/g, " ")),
        sourceFolder: charSlug,
        cover: `${sub}${files[0]}`,
        images: files.map((f) => `${sub}${f}`),
        productCount: files.length,
      });
    }

    if (characters.length > 0) {
      chapters.push({
        order: Number(num),
        id: site.id,
        slug: site.slug,
        index: String(num).padStart(2, "0"),
        name: site.id,
        sourceFolder: chapterId,
        characters,
      });
    }
  }

  chapters.sort((a, b) => a.order - b.order);
  return chapters.length > 0 ? chapters : null;
}

function writeCatalog(chapters, copied) {
  const ordered = [...chapters].sort((a, b) => a.order - b.order);
  const payload = {
    season: {
      id: "s01",
      slug: "saison-01",
      title: "Nel Fang Te Dundu",
      subtitle: "Saison 01",
      tagline:
        "L’ordre et la numérotation des collections suivent le dossier atelier Saison 01.",
      sourceRoot: "SAISON 1  neel fang",
      chapterOrder: ordered.map((c) => c.id),
    },
    chapters: ordered,
    syncedAt: new Date().toISOString(),
  };
  fs.writeFileSync(CATALOG, JSON.stringify(payload, null, 2));
  console.log(`\n${copied} images → public/collection/s01/`);
  console.log(`Catalogue (${ordered.length} collections, ordre atelier) : ${CATALOG}`);
  for (const c of ordered) {
    console.log(`  ${c.index}. ${c.sourceFolder} → ${c.name} (${c.characters.length} personnages)`);
  }
}

function main() {
  const chapterFolders = listChapterDirs(SOURCE);
  const catalogChapters = [];
  let copied = 0;

  if (chapterFolders.length === 0) {
    console.warn(`Aucun chapitre dans ${SOURCE} — reconstruction depuis public/collection/s01/`);
    const fallback = scanFromPublicFallback();
    if (!fallback) {
      console.error("Source vide et aucun média public — rien à synchroniser.");
      process.exit(1);
    }
    writeCatalog(fallback, 0);
    return;
  }

  for (const folderName of chapterFolders) {
    const meta = chapterMetaFromFolder(folderName);
    const chapterPath = path.join(SOURCE, folderName);
    const characterFolders = listCharacterDirs(chapterPath);
    const characters = [];

    for (const charFolder of characterFolders) {
      const charPath = charFolder === "." ? chapterPath : path.join(chapterPath, charFolder);
      const charSlug = charFolder === "." ? "collection" : slugify(charFolder);
      const charName = charFolder === "." ? meta.name : titleCase(charFolder);
      const files = listImages(charPath).slice(0, MAX_IMAGES);
      if (files.length === 0) continue;

      const outDir = path.join(OUT, meta.id, "personnages", charSlug);
      fs.mkdirSync(outDir, { recursive: true });

      const urls = files.map((src, idx) => {
        const name = idx === 0 ? "cover.jpg" : `produit-${String(idx).padStart(2, "0")}.jpg`;
        resize(src, path.join(outDir, name));
        copied++;
        return publicRel(meta.id, charSlug, name);
      });

      characters.push({
        id: `${meta.id}-${charSlug}`,
        slug: charSlug,
        name: charName,
        sourceFolder: charFolder,
        cover: urls[0],
        images: urls,
        productCount: urls.length,
      });

      console.log(`OK ${meta.index} ${meta.id}/${charSlug} (${urls.length} produits)`);
    }

    catalogChapters.push({
      order: meta.order,
      id: meta.id,
      slug: meta.slug,
      index: meta.index,
      name: meta.name,
      sourceFolder: folderName,
      characters,
    });
  }

  const hasCharacters = catalogChapters.some((c) => c.characters.length > 0);
  if (!hasCharacters) {
    console.warn("Chapitres trouvés mais sans personnages — reconstruction depuis public/collection/s01/");
    const fallback = scanFromPublicFallback();
    if (fallback) {
      writeCatalog(fallback, 0);
      return;
    }
  }

  writeCatalog(catalogChapters, copied);
}

main();
