/**
 * CMS éditorial pour les pages du site (Home en premier).
 *
 * Architecture :
 *  - data/cms.json : { draft, published, draftUpdatedAt, publishedAt }
 *  - schéma déclaratif (sections + champs typés) côté serveur
 *  - api publique sert `published` (ou `draft` si preview token valide)
 *  - api admin permet : update draft → publier → restaurer
 *
 * Valeurs : structure libre par section. Côté front, on lit via
 * `useCmsText("home.hero.title", fallback)`. Si la valeur est vide
 * ou undefined, on tombe sur le fallback statique.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { withFileLock } from "./fileLock.mjs";
import {
  repairCmsIfNeeded,
  onCmsWrite,
  onCmsPublished,
} from "./persistence.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../data");
const FILE = path.join(DATA_DIR, "cms.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

/* ───────── Schéma déclaratif des sections éditables ─────────
 *
 * Chaque section a :
 *   - id : "home.hero" (utilisé comme préfixe pour les champs : "home.hero.title")
 *   - label : titre humain
 *   - icon : caractère unicode pour l'UI admin
 *   - lede : aide contextuelle
 *   - fields : [{ id, label, type, hint?, rows? }]
 *
 * Types supportés : "text" | "textarea" | "richtext" | "list" | "image" | "url"
 */
export const CMS_SCHEMA = {
  sections: [
    {
      id: "home.hero",
      label: "Accueil — Hero",
      icon: "✦",
      lede: "La première vue. Sur-titre, titre, sous-titre et boutons d'action.",
      fields: [
        {
          id: "video",
          label: "Vidéo hero",
          type: "video",
          hint: "MP4/WebM — stocké hors build (cms-media/)",
        },
        {
          id: "poster",
          label: "Image poster",
          type: "image",
          hint: "Affichée avant lecture et si la vidéo ne charge pas",
        },
        { id: "eyebrow", label: "Sur-titre", type: "text", hint: "Petit texte au-dessus du titre" },
        { id: "title", label: "Titre principal", type: "text" },
        { id: "subtitle", label: "Sous-titre", type: "textarea", rows: 3 },
        { id: "ctaPrimary", label: "Bouton principal", type: "text" },
        { id: "ctaSecondary", label: "Bouton secondaire", type: "text" },
      ],
    },
    {
      id: "home.story",
      label: "Accueil — Récit",
      icon: "✺",
      lede: "Les fragments narratifs qui défilent (un par ligne).",
      fields: [
        {
          id: "fragments",
          label: "Fragments du récit",
          type: "list",
          itemLabel: "Fragment",
          hint: "Chaque entrée est une ligne du récit. Une ligne vide est ignorée.",
        },
      ],
    },
    {
      id: "home.chapters",
      label: "Accueil — Casting / Chapitres",
      icon: "✦",
      lede: "Bloc d'introduction du casting.",
      fields: [
        { id: "eyebrow", label: "Sur-titre", type: "text" },
        { id: "title", label: "Titre", type: "textarea", rows: 2 },
        { id: "intro", label: "Introduction", type: "textarea", rows: 3 },
      ],
    },
    {
      id: "home.creator",
      label: "Accueil — Le créateur",
      icon: "❖",
      lede: "Présentation du fondateur.",
      fields: [
        {
          id: "portrait",
          label: "Portrait",
          type: "image",
          hint: "Photo du créateur",
        },
        { id: "eyebrow", label: "Sur-titre", type: "text" },
        { id: "name", label: "Nom", type: "text" },
        { id: "role", label: "Rôle", type: "text" },
        { id: "quote", label: "Citation", type: "textarea", rows: 3 },
      ],
    },
    {
      id: "home.recognition",
      label: "Accueil — Reconnaissance",
      icon: "✧",
      lede: "Bloc JOJ / distinctions.",
      fields: [
        { id: "eyebrow", label: "Sur-titre", type: "text" },
        { id: "title", label: "Titre", type: "text" },
        { id: "body", label: "Corps", type: "textarea", rows: 3 },
      ],
    },
    {
      id: "home.manifest",
      label: "Accueil — Manifeste",
      icon: "★",
      lede: "Bloc manifeste.",
      fields: [
        { id: "eyebrow", label: "Sur-titre", type: "text" },
        { id: "line", label: "Phrase d'accroche", type: "textarea", rows: 2 },
        { id: "body", label: "Texte du manifeste", type: "textarea", rows: 4 },
      ],
    },
    {
      id: "home.featured",
      label: "Accueil — Pièces phares",
      icon: "❉",
      lede: "Titre du bloc qui présente quelques pièces de la collection.",
      fields: [
        { id: "eyebrow", label: "Sur-titre", type: "text" },
        { id: "title", label: "Titre", type: "text" },
        { id: "tagline", label: "Phrase de conversion", type: "textarea", rows: 2 },
      ],
    },
    {
      id: "brand",
      label: "Marque & identité",
      icon: "◉",
      lede: "Nom, tagline, slogans globaux.",
      fields: [
        { id: "name", label: "Nom de marque", type: "text" },
        { id: "tagline", label: "Tagline (wolof)", type: "text" },
        { id: "taglineFr", label: "Tagline (français)", type: "text" },
        { id: "footerTagline", label: "Tagline pied de page", type: "text" },
      ],
    },
  ],
};

export const CMS_DEFAULTS = {
  "home.hero": {
    eyebrow: "Maison sénégalaise — Saison 0 — Neel Fang",
    title: "Le futur a des racines.",
    subtitle:
      "FANG est une maison afro-contemporaine née à Dakar. Saison 0 — Neel Fang : sept chapitres, des personnages réels, des pièces produites à Dakar.",
    ctaPrimary: "Entrer dans la collection",
    ctaSecondary: "Nos personnages",
  },
  "home.story": {
    fragments: [
      "FANG, en wolof, signifie exposition.",
      "Mais pour nous, c’est une philosophie.",
      "Peu importe ta morphologie. Ton genre. Ta culture.",
      "Ose t’exposer.",
      "Tu es beau. Tu es toi. C’est suffisant.",
    ],
  },
  "home.chapters": {
    eyebrow: "Casting — Nel Fang Te Dundu",
    title: "Sept chapitres,\nune même exposition.",
    intro:
      "Sept visages, sept portes : ici on défile le casting. Le récit complet, les images et le lien avec la pièce se vivent sur la page dédiée à chaque personnage.",
  },
  "home.creator": {
    eyebrow: "Le créateur",
    name: "Fallou Ngom",
    role: "Fondateur & directeur artistique",
    quote: "Je ne crée pas des vêtements. Je crée des armures de confiance.",
  },
  "home.recognition": {
    eyebrow: "Reconnaissance",
    title: "Top 10 — JOJ Dakar 2026",
    body:
      "Sélectionnée parmi les 10 meilleures maisons africaines lors du concours officiel des Jeux Olympiques de la Jeunesse de Dakar 2026, sur 200 participants.",
  },
  "home.manifest": {
    eyebrow: "Manifeste",
    line: "Expose-toi. Tu es beau. Tu es toi. C’est suffisant.",
    body:
      "FANG s’adapte aux corps, pas l’inverse. Trois piliers : authenticité, culture, afrofuturisme. Trois couleurs : la terre, le sang, l’or. Une promesse : que porter du FANG, ce soit porter la fierté d’être soi.",
  },
  "home.featured": {
    eyebrow: "",
    title: "",
    tagline:
      "De la collection au vêtement — produit à Dakar, commande en quelques clics.",
  },
  brand: {
    name: "FANG",
    tagline: "Nel Fang Te Dundu",
    taglineFr: "Expose-toi et vis",
    footerTagline: "Dakar — Paris — bientôt partout.",
  },
};

function load() {
  repairCmsIfNeeded();

  if (!fs.existsSync(FILE)) {
    const empty = {
      draft: {},
      published: {},
      draftUpdatedAt: null,
      publishedAt: null,
      draftUpdatedBy: null,
      publishedBy: null,
    };
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(empty, null, 2));
    return empty;
  }
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    const repaired = repairCmsIfNeeded();
    if (repaired.repaired && fs.existsSync(FILE)) {
      try {
        return JSON.parse(fs.readFileSync(FILE, "utf8"));
      } catch {
        /* ignore */
      }
    }
    return {
      draft: {},
      published: {},
      draftUpdatedAt: null,
      publishedAt: null,
      draftUpdatedBy: null,
      publishedBy: null,
    };
  }
}

function save(state, reason = "write") {
  onCmsWrite(state, reason);
  fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
}

/** Fusionne defaults + valeurs stockées pour exposition au front. */
function mergedWithDefaults(stored) {
  const out = {};
  for (const [sectionId, defaults] of Object.entries(CMS_DEFAULTS)) {
    const overrides = stored?.[sectionId] ?? {};
    out[sectionId] = { ...defaults, ...overrides };
  }
  // Préserve les sections potentiellement personnalisées non listées dans defaults
  for (const [sectionId, val] of Object.entries(stored ?? {})) {
    if (!out[sectionId]) out[sectionId] = val;
  }
  return out;
}

export function getCmsPublished() {
  const state = load();
  return mergedWithDefaults(state.published);
}

export function getCmsDraft() {
  const state = load();
  return mergedWithDefaults(state.draft && Object.keys(state.draft).length ? state.draft : state.published);
}

export function getCmsState() {
  const state = load();
  // Calcule combien de sections ont des différences entre draft et published
  const draft = state.draft ?? {};
  const published = state.published ?? {};
  const sectionsWithChanges = [];
  for (const sec of CMS_SCHEMA.sections) {
    const d = JSON.stringify(draft[sec.id] ?? {});
    const p = JSON.stringify(published[sec.id] ?? {});
    if (d !== p && d !== "{}") sectionsWithChanges.push(sec.id);
  }
  return {
    schema: CMS_SCHEMA,
    draft: mergedWithDefaults(state.draft),
    published: mergedWithDefaults(state.published),
    draftUpdatedAt: state.draftUpdatedAt,
    publishedAt: state.publishedAt,
    sectionsWithChanges,
    hasUnpublishedChanges: sectionsWithChanges.length > 0,
  };
}

/** Met à jour une section du draft (merge sur les champs définis seulement). */
export async function updateCmsSection(sectionId, patch, { actor } = {}) {
  return withFileLock(FILE, () => {
    const state = load();
    if (!state.draft) state.draft = {};
    // Si jamais aucun draft n'existait, partir du published comme base
    if (Object.keys(state.draft).length === 0 && state.published) {
      state.draft = JSON.parse(JSON.stringify(state.published));
    }
    state.draft[sectionId] = { ...(state.draft[sectionId] ?? {}), ...patch };
    state.draftUpdatedAt = new Date().toISOString();
    state.draftUpdatedBy = actor ?? null;
    save(state);
    return mergedWithDefaults(state.draft);
  });
}

/** Publie le draft (draft → published). Conserve le draft pour pouvoir continuer à éditer. */
export async function publishCms({ actor } = {}) {
  return withFileLock(FILE, () => {
    const state = load();
    const draft = state.draft && Object.keys(state.draft).length ? state.draft : state.published;
    state.published = JSON.parse(JSON.stringify(draft ?? {}));
    state.publishedAt = new Date().toISOString();
    state.publishedBy = actor ?? null;
    save(state, "publish");
    onCmsPublished(state);
    return mergedWithDefaults(state.published);
  });
}

/** Restaure le draft depuis le published (annule les modifs non publiées). */
export async function revertCmsDraft() {
  return withFileLock(FILE, () => {
    const state = load();
    state.draft = JSON.parse(JSON.stringify(state.published ?? {}));
    state.draftUpdatedAt = new Date().toISOString();
    save(state);
    return mergedWithDefaults(state.draft);
  });
}

/* ───── Tokens d'aperçu éphémères (10 min) ─────
 * Stockés en mémoire process — suffisant car éphémères.
 */
const previewTokens = new Map(); // token → expiresAt

export function createPreviewToken() {
  const token = crypto.randomBytes(16).toString("hex");
  const expiresAt = Date.now() + 10 * 60 * 1000;
  previewTokens.set(token, expiresAt);
  // Nettoyage opportuniste
  for (const [t, exp] of previewTokens) {
    if (exp < Date.now()) previewTokens.delete(t);
  }
  return { token, expiresAt: new Date(expiresAt).toISOString() };
}

export function isValidPreviewToken(token) {
  if (!token) return false;
  const exp = previewTokens.get(token);
  if (!exp) return false;
  if (exp < Date.now()) {
    previewTokens.delete(token);
    return false;
  }
  return true;
}
