export type CharacterProfile = {
  name: string;
  slug: string;
  /** Sens (traduction / définition) */
  meaning: string;
  /** Énergie courte — survol glossaire */
  energy: string;
  /** Ligne Énergie du panneau /archetype (ex. Flamboyant · Expressif) */
  energyLine?: string;
  /** Paragraphe Style du panneau /archetype */
  style?: string;
  /** Contenu visuel du panneau /archetype */
  visualContent?: string;
  excerpt: string;
  description: string;
};

/** Profils narratifs — LES 14 ARCHÉTYPES (NOM · SENS · ÉNERGIE) */
export const castCharacterProfiles: CharacterProfile[] = [
  {
    name: "Gé Am",
    slug: "gue-am",
    meaning: "« Voyez-moi »",
    energy: "Flamboyant · Expressif · Vibrant",
    energyLine: "Flamboyant · Expressif · Vibrant",
    style:
      "Tenues asymétriques, couleurs qui tranchent, matières inattendues. Chaque détail est une décision. Coupes audacieuses, motifs atypiques, rien n'est neutre.",
    visualContent:
      "Visuels audacieux, compositions déséquilibrées, couleurs qui tranchent.",
    excerpt: "GÉ AM — Voyez-moi",
    description:
      "Gé am. Voyez-moi. Il a grandi avec les épaules rentrées. Aujourd'hui, chaque couleur qu'il porte est une réponse.",
  },
  {
    name: "Miik",
    slug: "miik",
    meaning: "« Silencieuse »",
    energy: "Calme · Confortable · Présente sans chercher à l'être",
    energyLine: "Calme · Confortable · Présente sans chercher à l'être",
    style:
      "Casual, confortable — atypique dans le détail mais sans crier. Elle s'habille pour elle-même, pas pour le regard. Tenues qui permettent d'exister sans s'expliquer.",
    visualContent:
      "Poses décontractées, regard direct ou détourné — jamais forcé.",
    excerpt: "MIIK — Silencieuse",
    description:
      "Miik. Silencieuse. Elle cherche le confort avant le regard. Atypique dans le détail — jamais pour toi.",
  },
  {
    name: "Panda",
    slug: "panda",
    meaning: "L'animal fort et drôle",
    energy: "assumé, joyeux",
    excerpt: "PANDA — L'animal fort et drôle",
    description:
      "Il a traversé les moqueries et en est sorti plus libre que ceux qui l'ont moqué.",
  },
  {
    name: "Yaranka",
    slug: "yaranka",
    meaning: "Sans frontière de genre",
    energy: "fluide",
    excerpt: "YARANKA — Sans frontière de genre",
    description:
      "Aucun code. Aucune frontière. Il n'y avait jamais eu de ligne — juste quelqu'un qui avait eu peur que tu la franchisses.",
  },
  {
    name: "Ndanane",
    slug: "ndanane",
    meaning: "La présence par la carrure",
    energy: "imposant",
    excerpt: "NDANANE — La présence par la carrure",
    description: "La carrure n'est pas une excuse : c'est une présence. On la voit avant qu'elle parle.",
  },
  {
    name: "Mossane",
    slug: "mossane",
    meaning: "Celle qui sort du lot",
    energy: "Artistique · Multiculturelle · Singulière",
    energyLine: "Artistique · Multiculturelle · Singulière",
    style:
      "Afro imposant ou style alternatif très marqué. Démarche artistique — chaque mouvement est déjà une composition. Style influencé par plusieurs cultures, mélange assumé.",
    visualContent:
      "Démarche artistique, mélange culturel assumé, singularité graphique.",
    excerpt: "MOSSANE — Celle qui sort du lot",
    description:
      "Mossane. Elle a grandi entre plusieurs mondes. Et elle voit des choses que les autres ne voient pas encore.",
  },
  {
    name: "Mbararr",
    slug: "mbararr",
    meaning: "« Armure »",
    energy: "le voile choisi comme force",
    excerpt: "MBARARR — Armure",
    description: "Le voile n'est pas une fuite : c'est une armure choisie, portée comme une force.",
  },
  {
    name: "Jant",
    slug: "jant",
    meaning: "« Soleil »",
    energy: "Sobre · Raffiné · Abouti · En paix",
    energyLine: "Sobre · Raffiné · Abouti · En paix",
    style:
      "Épuré, sans excès, sans bruit visuel. Résultat d'une longue exploration intérieure.",
    visualContent:
      "Lumière naturelle, compositions équilibrées, peu de bruit visuel.",
    excerpt: "JANT — Soleil",
    description:
      "Jant. Soleil. Il n'essaie pas d'être le centre. Mais la lumière tombe toujours sur lui en premier.",
  },
  {
    name: "Djaalan",
    slug: "djalann",
    meaning: "« Souriante »",
    energy: "kawaii, geek, joyeuse",
    excerpt: "DJAALAN — Souriante",
    description:
      "Sa joie n'est pas une naïveté : c'est sa manière d'entrer dans la pièce avant qu'on l'y invite.",
  },
  {
    name: "Diaak",
    slug: "diaak",
    meaning: "« Grand »",
    energy: "ancré, tête haute",
    excerpt: "DIAAK — Grand",
    description: "Le corps qu'on t'a reproché porte un nom. Ce nom veut dire grandeur.",
  },
  {
    name: "Racine",
    slug: "racine",
    meaning: "La vie urbaine",
    energy: "Fluide · Adaptable · Street sans effort · En mouvement",
    energyLine: "Fluide · Adaptable · Street sans effort · En mouvement",
    style:
      "Streetwear authentique Gen Z — manches détachables, pantalons transformables, couleurs sobres mais vivantes. Style modulable, toujours en mouvement. La rue comme terrain de jeu.",
    visualContent:
      "Dynamisme, mouvement, versatilité des pièces montrée en action.",
    excerpt: "RACINE — La vie urbaine",
    description:
      "Racine. La rue était là depuis toujours. C'est toi qui n'avais pas encore décidé d'y être. Me voilà.",
  },
  {
    name: "Sukoh",
    slug: "sukox",
    meaning: "« Se cacher »",
    energy: "discret, précis",
    excerpt: "SUKOH — Se cacher",
    description: "Le détail si précis qu'il brille malgré lui.",
  },
  {
    name: "Fogamm",
    slug: "fogamm",
    meaning: "« J'en fais partie »",
    energy: "créatif avec peu",
    excerpt: "FOGAMM — J'en fais partie",
    description: "Créer avec ce qu'on a. Appartenir sans demander la permission.",
  },
  {
    name: "Fod",
    slug: "fod",
    meaning: "Le sage",
    energy: "Traditionnel · Calme absolu · Ancré",
    energyLine: "Traditionnel · Calme absolu · Ancré",
    style:
      "Grand boubou blanc immaculé. Tenues traditionnelles ou tradi-modernes. La tradition portée avec modernité et calme absolu.",
    visualContent:
      "Boubou blanc, tradition portée avec calme, présence de témoin.",
    excerpt: "FOD — Le sage",
    description:
      "Fod. Le sable ne résiste pas au vent. Il se laisse traverser. Et il est encore là quand le vent est parti.",
  },
];

export const characterProfilesBySlug = Object.fromEntries(
  castCharacterProfiles.map((p) => [p.slug, p])
) as Record<string, CharacterProfile>;

/** Variantes de nom → slug (lookup glossaire). */
const NAME_ALIASES: Record<string, string> = {
  "gue am": "gue-am",
  "gé am": "gue-am",
  "ge am": "gue-am",
  gueam: "gue-am",
  jant: "jant",
  miik: "miik",
  djaalan: "djalann",
  diaalan: "djalann",
  djalann: "djalann",
  panda: "panda",
  diaak: "diaak",
  yaranka: "yaranka",
  racine: "racine",
  sukoh: "sukox",
  sukox: "sukox",
  mossane: "mossane",
  fod: "fod",
  ndanane: "ndanane",
  mbararr: "mbararr",
  mbarar: "mbararr",
  fogamm: "fogamm",
  fogam: "fogamm",
};

function normalizeGlossaryKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

/** Résout un nom, slug ou variante vers le profil casting. */
export function resolveCharacterGlossaryTerm(
  term: string
): CharacterProfile | undefined {
  const raw = term.trim();
  if (!raw) return undefined;

  const bySlug = characterProfilesBySlug[raw.toLowerCase()];
  if (bySlug) return bySlug;

  const key = normalizeGlossaryKey(raw);
  const aliasSlug = NAME_ALIASES[key] ?? NAME_ALIASES[key.replace(/\s/g, "")];
  if (aliasSlug) return characterProfilesBySlug[aliasSlug];

  return castCharacterProfiles.find((p) => normalizeGlossaryKey(p.name) === key);
}

/** Libellé glossaire : sens — énergie */
export function formatArchetypeGloss(profile: CharacterProfile): string {
  return `${profile.meaning} — ${profile.energy}`;
}

/** Signification française d’un archétype (sens + énergie), ou null si inconnu. */
export function getArchetypeMeaning(term: string): string | null {
  const profile = resolveCharacterGlossaryTerm(term);
  return profile ? formatArchetypeGloss(profile) : null;
}

/** Bande défilante 1 — noms du casting */
export const homeMarqueeNames = castCharacterProfiles.map((p) => p.name);

/** Bande défilante 2 — sens / accroches */
export const homeMarqueeMeanings = castCharacterProfiles.map((p) => p.meaning);

export function getCharacterProfile(slug: string): CharacterProfile | undefined {
  return characterProfilesBySlug[slug];
}
