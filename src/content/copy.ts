import siteOverridesJson from "./siteOverrides.json";

const baseCopy = {
  brand: "FANG",
  tagline: "Nel Fang Te Dundu",
  taglineFr: "Expose-toi et vis",

  heroEyebrow: "Maison sénégalaise — Saison 01",
  heroTitle: "Le futur a des racines.",
  heroSubtitle:
    "FANG est une maison afro-contemporaine née à Dakar. Saison 01 : sept chapitres, des personnages réels, des pièces produites à Dakar.",
  heroPrimary: "Entrer dans la collection",
  heroSecondary: "Lire le manifeste",

  chaptersEyebrow: "Casting — Nel Fang Te Dundu",
  chaptersTitle: "Sept chapitres,\nune même exposition.",
  chaptersIntro:
    "Sept visages, sept portes : ici on défile le casting. Le récit complet, les images et le lien avec la pièce se vivent sur la page dédiée à chaque personnage.",

  creatorEyebrow: "Le créateur",
  creatorName: "Fallou Ngom",
  creatorRole: "Fondateur & directeur artistique",
  creatorQuote: "Je ne crée pas des vêtements. Je crée des armures de confiance.",

  recognitionEyebrow: "Reconnaissance",
  recognitionTitle: "Top 10 — JOJ Dakar 2026",
  recognitionBody:
    "Sélectionnée parmi les 10 meilleures maisons africaines lors du concours officiel des Jeux Olympiques de la Jeunesse de Dakar 2026, sur 200 participants.",

  manifestEyebrow: "Manifeste",
  manifestLine: "Expose-toi. Tu es beau. Tu es toi. C’est suffisant.",
  manifestBody:
    "FANG s’adapte aux corps, pas l’inverse. Trois piliers : authenticité, culture, afrofuturisme. Trois couleurs : la terre, le sang, l’or. Une promesse : que porter du FANG, ce soit porter la fierté d’être soi.",

  footerTagline: "Dakar — Paris — bientôt partout.",
  newsletter: "Recevoir la lettre",
  newsletterPlaceholder: "votre@email.com",
  contact: "Écrire à l’atelier",
  boutique: "Boutique",
  instagram: "Instagram",

  loading: "Entrée en territoire",

  personnageCinematicLine:
    "Avant que les cartes ne portent les noms des empires, il y avait des voix, des royaumes et des résistances.",
  personnageCinematicSub:
    "Ici, ce n’est pas une biographie froide : c’est une traversée. Un personnage FANG, une scène, une mémoire qui continue de parler.",
  personnageEnterStory: "Entrer dans l’histoire",
  personnageSkipIntro: "Passer l’introduction",
  personnageScrollScenes: "Faites défiler — sept scènes, une même ligne du temps.",
  personnageSceneLedge: "0 · Lisière",
  personnageSceneWorld: "1 · Son monde",
  personnageSceneFiche: "2 · La fiche vivante",
  personnageSceneDecisive: "3 · Le moment décisif",
  personnageSceneGriot: "4 · Voix du griot numérique",
  personnageSceneLegacy: "5 · Ce qui reste",
  personnageSoundOn: "Ambiance",
  personnageSoundOff: "Silence",
  personnageDocScrollHint: "Faire défiler le document",
  personnageShopSeePiece: "Voir la pièce",
  personnageShopBrowseCharacter: "Voir dans la boutique",
  personnageShopDiscover: "Découvrir la boutique",
  productPageContinueCharacterBoutique: "Boutique — ce personnage",
  productPageContinueShopping: "Continuer les achats",
  chapterPanelBoutiqueFilter: "Boutique — ce personnage",

  collectionEyebrow: "Collection",
  collectionPersonnagesLabel: "Personnages",
  collectionCharactersOnly: "Uniquement les personnages de l’atelier",
  collectionSeeChapter: "Explorer le chapitre",
  collectionSeePersonnage: "Voir les produits",
  collectionBackSeason: "Saison 01",
  collectionPersonnagesIntro:
    "Chaque personnage n’existe que s’il est dans le dossier de la collection. Ouvrez un profil pour voir ses produits dans ce chapitre.",
  collectionEmptyChapter: "Ce chapitre arrive bientôt dans l'atelier.",
  collectionPieceCta: "Commander",

  addToCart: "Ajouter au panier",
  addedToCart: "Ajouté ✓",
  selectSize: "Choisir votre taille",
  selectSizeShort: "Taille",
  checkoutDirect: "Commander maintenant",
  shopFromCollection: "Voir toute la collection",
  shopAllPieces: "Toutes les pièces",
  fromPrice: "À partir de",
  chapterShopCta: "Commander une pièce de ce chapitre",
  narrativeAndShop: "Récit & boutique",
  conversionTagline: "De la collection au vêtement — produit à Dakar, commande en quelques clics.",
  collectionHeroImage: "collection/s01/hero-premium.jpg",
  assuranceItems: [
    "Fabrication locale à Dakar",
    "Pièces en série limitée",
    "Paiement sécurisé",
  ],
};

const chapterCardHighlightsBase = [
  { title: "Univers authentique", detail: "Inspiré de la culture" },
  { title: "Pièces uniques", detail: "Finitions soignées" },
  { title: "Personnages variés", detail: "Histoires riches" },
  { title: "Qualité premium", detail: "Conçue pour durer" },
];

const trustItemsBase = [
  { title: "Atelier Dakar", detail: "Coupe & finitions à la main" },
  { title: "2-6 semaines", detail: "Production lente, qualité durable" },
  { title: "Sur mesure", detail: "Morphologies atypiques bienvenues" },
  { title: "WhatsApp", detail: "Paiement & livraison avec l'atelier" },
];

type SiteOverrides = {
  copy?: Partial<Record<keyof typeof baseCopy, string>> & {
    trustItems?: { title: string; detail: string }[];
    assuranceItems?: string[];
    chapterCardHighlights?: { title: string; detail: string }[];
  };
};

const overrides = (siteOverridesJson as SiteOverrides).copy ?? {};
const {
  trustItems: trustItemsOverride,
  assuranceItems: assuranceItemsOverride,
  chapterCardHighlights: chapterCardHighlightsOverride,
  ...textOverrides
} = overrides;

export const copy = {
  ...baseCopy,
  ...textOverrides,
  trustItems:
    trustItemsOverride && trustItemsOverride.length > 0 ? trustItemsOverride : trustItemsBase,
  assuranceItems:
    assuranceItemsOverride && assuranceItemsOverride.length > 0
      ? assuranceItemsOverride
      : baseCopy.assuranceItems,
  chapterCardHighlights:
    chapterCardHighlightsOverride && chapterCardHighlightsOverride.length > 0
      ? chapterCardHighlightsOverride
      : chapterCardHighlightsBase,
};

export const editableCopyKeys = Object.keys(baseCopy) as (keyof typeof baseCopy)[];
export const editableCopyDefaults = baseCopy;

export const storyIntro =
  "Plus qu'un espace d'exposition, FANG est une philosophie. Un appel à l'expression de soi, à l'audace et à la célébration de notre identité.";

export const storyFooterQuote = "FANG, ce n'est pas une norme. C'est une liberté.";

export type StoryPillarIcon = "eye" | "branch" | "mask" | "sun" | "heart";

export type StoryPillar = {
  icon: StoryPillarIcon;
  title: string;
  description: string;
};

export const storyPillars: StoryPillar[] = [
  {
    icon: "eye",
    title: "FANG, en wolof, signifie exposition.",
    description: "Se montrer au monde, partager sa vision, et affirmer son existence.",
  },
  {
    icon: "branch",
    title: "Mais pour nous, c'est une philosophie.",
    description: "Une manière d'habiter le monde avec fierté, créativité et authenticité.",
  },
  {
    icon: "mask",
    title: "Peu importe ta morphologie.",
    description: "Ton genre. Ta culture. Ce qui compte, c'est ton identité, ta lumière.",
  },
  {
    icon: "sun",
    title: "Ose t'exposer.",
    description: "Montre qui tu es, ce que tu fais, ce qui te rend unique.",
  },
  {
    icon: "heart",
    title: "Tu es beau. Tu es toi. C'est suffisant.",
    description: "L'important, c'est d'être vrai, pleinement et sans compromis.",
  },
];

/** @deprecated Utiliser storyPillars — conservé pour le CMS (titres). */
export const storyFragments = storyPillars.map((p) => p.title) as readonly string[];
