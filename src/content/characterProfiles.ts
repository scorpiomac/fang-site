export type CharacterProfile = {
  name: string;
  slug: string;
  meaning: string;
  excerpt: string;
  description: string;
};

/** Profils narratifs du casting Saison 0 — Neel Fang — source de vérité excerpt / description */
export const castCharacterProfiles: CharacterProfile[] = [
  {
    name: "Gue Am",
    slug: "gue-am",
    meaning: "« Voyez-moi » (Sérère)",
    excerpt: "GUE AM — Voyez-moi (Sérère)",
    description:
      "Il a grandi avec les épaules rentrées. Aujourd'hui, chaque couleur qu'il porte est une réponse.",
  },
  {
    name: "Jant",
    slug: "jant",
    meaning: "« Soleil » (Sérère)",
    excerpt: "JANT — Soleil (Sérère)",
    description:
      "Il n'essaie pas d'être le centre. Mais la lumière tombe toujours sur lui en premier.",
  },
  {
    name: "Miik",
    slug: "miik",
    meaning: "« Silencieuse » (Sérère)",
    excerpt: "MIIK — Silencieuse (Sérère)",
    description:
      "Elle cherche le confort avant le regard. Atypique dans le détail — jamais pour toi.",
  },
  {
    name: "Djaalan",
    slug: "djalann",
    meaning: "« Souriante » (Sérère)",
    excerpt: "DJAALAN — Souriante (Sérère)",
    description:
      "Sa joie n'est pas une naïveté : c'est sa manière d'entrer dans la pièce avant qu'on l'y invite.",
  },
  {
    name: "Panda",
    slug: "panda",
    meaning: "L'animal fort et drôle",
    excerpt: "PANDA — L'animal fort et drôle",
    description:
      "Il a traversé les moqueries et en est sorti plus libre que ceux qui l'ont moqué.",
  },
  {
    name: "Diaak",
    slug: "diaak",
    meaning: "« Grand » (taille & esprit)",
    excerpt: "DIAAK — Grand (taille & esprit)",
    description: "Le corps qu'on t'a reproché porte un nom. Ce nom veut dire grandeur.",
  },
  {
    name: "Yaranka",
    slug: "yaranka",
    meaning: "Genre-fluid",
    excerpt: "YARANKA — Genre-fluid",
    description:
      "Aucun code. Aucune frontière. Il n'y avait jamais eu de ligne — juste quelqu'un qui avait eu peur que tu la franchisses.",
  },
  {
    name: "Racine",
    slug: "racine",
    meaning: "Mode de vie urbain",
    excerpt: "RACINE — Mode de vie urbain",
    description:
      "La rue était là depuis toujours. C'est toi qui n'avais pas encore décidé d'y être.",
  },
  {
    name: "Sukoh",
    slug: "sukox",
    meaning: "« Se cacher » (Sérère)",
    excerpt: "SUKOH — Se cacher (Sérère)",
    description: "Le détail si précis qu'il brille malgré lui.",
  },
  {
    name: "Mossane",
    slug: "mossane",
    meaning: "Celle qui sort du lot",
    excerpt: "MOSSANE — Celle qui sort du lot",
    description:
      "Elle a grandi entre plusieurs mondes. Et elle voit des choses que les autres ne voient pas encore.",
  },
  {
    name: "Fod",
    slug: "fod",
    meaning: "Le sage (aussi force)",
    excerpt: "FOD — Le sage (aussi force)",
    description:
      "Le sable ne résiste pas au vent. Il se laisse traverser. Et il est encore là quand le vent est parti.",
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

/** Signification française d’un archétype, ou null si inconnu. */
export function getArchetypeMeaning(term: string): string | null {
  return resolveCharacterGlossaryTerm(term)?.meaning ?? null;
}

/** Bande défilante 1 — noms du casting */
export const homeMarqueeNames = castCharacterProfiles.map((p) => p.name);

/** Bande défilante 2 — sens / accroches */
export const homeMarqueeMeanings = castCharacterProfiles.map((p) => p.meaning);

export function getCharacterProfile(slug: string): CharacterProfile | undefined {
  return characterProfilesBySlug[slug];
}
