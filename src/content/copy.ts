import siteOverridesJson from "./siteOverrides.json";

const baseCopy = {
  brand: "FANG",
  tagline: "louné Fang kénn douko jééx",
  taglineFr: "sois conciliant comme le sable, expose toi comme le sable",

  heroEyebrow: "Maison sénégalaise — Saison 0 — Neel Fang",
  heroTitle: "Le futur a des racines.",
  heroSubtitle:
    "FANG est une maison afro-contemporaine née à Dakar. Saison 0 — Neel Fang : sept chapitres, des archétypes réels, des pièces produites à Dakar.",
  heroPrimary: "Entrer dans la boutique",
  heroSecondary: "Lire l'Archétype",

  chaptersEyebrow: "Saison 0",
  chaptersTitle: "Nel Fang Te Dundu",
  chaptersIntro:
    "La saison zéro s'appelle Neel Fang. Une saison dure dix chapitres — dix capsules, dix fragments d'une même histoire. Aujourd'hui, on est au septième sur dix. La fin approche, mais tu ne sais pas encore ce qu'elle révèle.",

  creatorEyebrow: "Le créateur",
  creatorName: "Fallou Ngom",
  creatorRole: "Fondateur, directeur artistique & couturier",
  creatorQuote: "Je ne crée pas des vêtements. Je crée des armures de confiance.",

  recognitionEyebrow: "Reconnaissance",
  recognitionTitle: "Top 10 — JOJ Dakar 2026",
  recognitionBody:
    "Sélectionnée parmi les 10 meilleures maisons africaines lors du concours officiel des Jeux Olympiques de la Jeunesse de Dakar 2026, sur 200 participants.",

  manifestEyebrow: "Manifeste",
  manifestLine: "Expose-toi. Tu es beau. Tu es toi. C’est suffisant.",
  manifestBody:
    "Mes inspirations, c'est les gens de la vraie vie — leur façon de penser, de s'habiller, de chercher à exister confortablement dans leur peau. Ce n'est pas à vous de vous adapter à FANG, c'est FANG qui s'adapte à vous.",

  footerTagline: "Gué am - Jaant - Miik - Sukoox - Djaak - Djalaann - Fod - Mossane",
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

  collectionEyebrow: "Boutique",
  collectionPersonnagesLabel: "Personnages",
  collectionCharactersOnly: "Uniquement les personnages de l’atelier",
  collectionSeeChapter: "Explorer le chapitre",
  collectionSeePersonnage: "Voir les produits",
  collectionBackSeason: "Saison 01",
  collectionPersonnagesIntro:
    "Chaque personnage n’existe que s’il est dans le dossier de la boutique. Ouvrez un profil pour voir ses produits dans ce chapitre.",
  collectionEmptyChapter: "Ce chapitre arrive bientôt dans l'atelier.",
  collectionPieceCta: "Commander",

  addToCart: "Ajouter au panier",
  addedToCart: "Ajouté ✓",
  selectSize: "Choisir votre taille",
  selectSizeShort: "Taille",
  checkoutDirect: "Commander maintenant",
  shopFromCollection: "Voir toute la boutique",
  shopAllPieces: "Toutes les pièces",
  fromPrice: "À partir de",
  chapterShopCta: "Commander une pièce de ce chapitre",
  narrativeAndShop: "Récit & boutique",
  conversionTagline: "De la boutique au vêtement — produit à Dakar, commande en quelques clics.",
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
  { title: "Archétypes variés", detail: "Histoires riches" },
  { title: "Qualité premium", detail: "Conçue pour durer" },
];

const trustItemsBase = [
  { title: "Atelier Dakar", detail: "Coupe & finitions à la main" },
  { title: "2–6 semaines", detail: "Production lente, qualité durable" },
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

export const storyFragments = [
  "FANG, en wolof, signifie exposition.",
  "Mais pour nous, c’est une philosophie.",
  "Peu importe ta morphologie. Ton genre. Ta culture.",
  "Ose t’exposer.",
  "Tu es beau. Tu es toi. C’est suffisant.",
] as const;
