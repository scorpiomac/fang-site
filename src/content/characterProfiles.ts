export type CharacterProfile = {
  name: string;
  slug: string;
  meaning: string;
  excerpt: string;
  description: string;
};

/** Profils narratifs du casting Saison 01 — source de vérité excerpt / description */
export const castCharacterProfiles: CharacterProfile[] = [
  {
    name: "Gé Am",
    slug: "gue-am",
    meaning: "« Voyez-moi » (sérère)",
    excerpt: "GÉ AM — Voyez-moi (Sérère)",
    description:
      "Il a grandi avec les épaules rentrées. Aujourd'hui, chaque couleur qu'il porte est une réponse.",
  },
  {
    name: "Jant",
    slug: "jant",
    meaning: "« Soleil » (sérère)",
    excerpt: "JANT — Soleil (Sérère)",
    description:
      "Il n'essaie pas d'être le centre. Mais la lumière tombe toujours sur lui en premier.",
  },
  {
    name: "Miik",
    slug: "miik",
    meaning: "« Silencieuse » (sérère)",
    excerpt: "MIIK — Silencieuse (Sérère)",
    description:
      "Elle cherche le confort avant le regard. Atypique dans le détail — jamais pour toi.",
  },
  {
    name: "Djaalan",
    slug: "djalann",
    meaning: "« Souriante » (sérère)",
    excerpt: "DJAALAN — Souriante (Sérère)",
    description:
      "Sa joie n'est pas une naïveté : c'est sa manière d'entrer dans la pièce avant qu'on l'y invite.",
  },
  {
    name: "Panda",
    slug: "panda",
    meaning: "La force joyeuse",
    excerpt: "PANDA — La force joyeuse",
    description:
      "Il a traversé les moqueries et en est sorti plus libre que ceux qui l'ont moqué.",
  },
  {
    name: "Diaak",
    slug: "diaak",
    meaning: "« Grand » (double sens)",
    excerpt: "DIAAK — Grand (double sens)",
    description: "Le corps qu'on t'a reproché porte un nom. Ce nom veut dire grandeur.",
  },
  {
    name: "Yaranka",
    slug: "yaranka",
    meaning: "Sans frontière de genre",
    excerpt: "YARANKA — Sans frontière de genre",
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
    meaning: "« Se cacher » (sérère)",
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
    meaning: "Le sage / le griot",
    excerpt: "FOD — Le sage / le griot",
    description:
      "Le sable ne résiste pas au vent. Il se laisse traverser. Et il est encore là quand le vent est parti.",
  },
];

export const characterProfilesBySlug = Object.fromEntries(
  castCharacterProfiles.map((p) => [p.slug, p])
) as Record<string, CharacterProfile>;

/** Bande défilante 1 — noms du casting */
export const homeMarqueeNames = castCharacterProfiles.map((p) => p.name);

/** Bande défilante 2 — sens / accroches */
export const homeMarqueeMeanings = castCharacterProfiles.map((p) => p.meaning);

export function getCharacterProfile(slug: string): CharacterProfile | undefined {
  return characterProfilesBySlug[slug];
}
