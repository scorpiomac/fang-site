/**
 * Langue de la boutique FANG — correspondance phonétique / graphique → touches Messapia.
 * Planche officielle : /references/langue-boutique-planche.png
 *
 * Messapia n’est pas une police latine : chaque touche affiche un glyphe de la langue boutique.
 * Ce module produit la chaîne à afficher avec font-family: Messapia.
 */

export type FangIdeogram =
  | "espoir"
  | "aide"
  | "entraide"
  | "famille"
  | "borom"
  | "maison"
  | "mort"
  | "futur"
  | "tristesse"
  | "amour"
  | "foi";

/** Mots-idéogrammes (plusieurs entrées françaises → un même symbole). */
export const FANG_IDEOGRAM_ALIASES: Record<string, FangIdeogram> = {
  espoir: "espoir",
  aide: "aide",
  entraide: "entraide",
  famille: "famille",
  protecteur: "borom",
  gardien: "borom",
  borom: "borom",
  maison: "maison",
  mort: "mort",
  futur: "futur",
  tristesse: "tristesse",
  amour: "amour",
  foi: "foi",
};

/** Séquence à taper dans Messapia pour déclencher l’idéogramme (ligature police). */
export const FANG_IDEOGRAM_INPUT: Record<FangIdeogram, string> = {
  espoir: "espoir",
  aide: "aide",
  entraide: "entraide",
  famille: "famille",
  borom: "borom",
  maison: "maison",
  mort: "mort",
  futur: "futur",
  tristesse: "tristesse",
  amour: "amour",
  foi: "foi",
};

/** Voyelles et digrammes voyelles — ordre décroissant de longueur. */
const VOWEL_KEYS: readonly { match: string; keys: string }[] = [
  { match: "you", keys: "you" },
  { match: "ôô", keys: "ôô" },
  { match: "oo", keys: "oo" },
  { match: "an", keys: "an" },
  { match: "ou", keys: "ou" },
  { match: "ee", keys: "ee" },
  { match: "é", keys: "é" },
  { match: "è", keys: "è" },
  { match: "ë", keys: "[" },
  { match: "eu", keys: "[" },
  { match: "ô", keys: "Ô" },
  { match: "ù", keys: "u" },
  { match: "ü", keys: "u" },
];

/** Consonnes+ (sons wolof / sérère) — avant les consonnes simples. */
const CONSONANT_CLUSTER_KEYS: readonly { match: string; keys: string }[] = [
  { match: "tch", keys: "tch" },
  { match: "ch", keys: "ch" },
  { match: "ng", keys: "ng" },
  { match: "mb", keys: "mb" },
  { match: "nd", keys: "nd" },
  { match: "nk", keys: "nk" },
  { match: "dj", keys: "dj" },
  { match: "kk", keys: "kk" },
  { match: "ll", keys: "LL" },
  { match: "ks", keys: "x" },
  { match: "ñ", keys: "ñ" },
];

/** Consonne simple → touche (la police dessine le glyphe boutique). */
const CONSONANT_KEY: Record<string, string> = {
  b: "b",
  c: "c",
  d: "d",
  f: "f",
  g: "g",
  h: "h",
  j: "j",
  k: "k",
  l: "l",
  m: "m",
  n: "n",
  p: "p",
  q: "q",
  r: "r",
  s: "s",
  t: "t",
  v: "v",
  w: "w",
  x: "x",
  y: "y",
  z: "z",
};

function matchVowel(text: string, i: number): { keys: string; len: number } | null {
  const slice = text.slice(i);
  const lowerSlice = slice.toLowerCase();

  // « an » nasal vs consonne n : dans « fang », « kang »… → a + ng
  if (lowerSlice.startsWith("an") && lowerSlice[2] === "g") {
    const atWordStart = i === 0;
    const ch = slice[0]!;
    return { keys: atWordStart && ch === "A" ? "A" : ">", len: 1 };
  }

  for (const { match, keys } of VOWEL_KEYS) {
    if (lowerSlice.startsWith(match)) {
      return { keys, len: match.length };
    }
  }
  const ch = slice[0];
  if (!ch) return null;
  const atWordStart = i === 0;
  const lower = ch.toLowerCase();
  if (lower === "a") {
    return { keys: atWordStart && ch === "A" ? "A" : ">", len: 1 };
  }
  if (lower === "e") {
    return { keys: atWordStart && ch === "E" ? "E" : "e", len: 1 };
  }
  if (lower === "i") {
    return { keys: atWordStart && ch === "I" ? "I" : "i", len: 1 };
  }
  if (lower === "o") {
    return { keys: atWordStart && ch === "O" ? "O" : "o", len: 1 };
  }
  if (lower === "u") {
    return { keys: atWordStart && ch === "U" ? "U" : "u", len: 1 };
  }
  return null;
}

function consonantClusterKeys(text: string, i: number): { keys: string; len: number } | null {
  const slice = text.slice(i).toLowerCase();
  for (const { match, keys } of CONSONANT_CLUSTER_KEYS) {
    if (slice.startsWith(match)) {
      return { keys, len: match.length };
    }
  }
  return null;
}

function consonantKey(ch: string, atWordStart: boolean): string | null {
  const lower = ch.toLowerCase();
  if (!(lower in CONSONANT_KEY)) return null;
  if (atWordStart && ch === ch.toUpperCase() && ch !== ch.toLowerCase()) {
    return ch;
  }
  return CONSONANT_KEY[lower];
}

function transcribeWord(word: string): string {
  if (!word) return "";

  const ideogram = FANG_IDEOGRAM_ALIASES[word.toLowerCase()];
  if (ideogram) return FANG_IDEOGRAM_INPUT[ideogram];

  let out = "";
  let i = 0;
  while (i < word.length) {
    const ch = word[i]!;
    const atWordStart = i === 0;

    if (!/[a-zàâäéèêëïîôùûüœæ]/i.test(ch)) {
      out += ch;
      i += 1;
      continue;
    }

    const vowel = matchVowel(word, i);
    if (vowel) {
      out += vowel.keys;
      i += vowel.len;
      continue;
    }

    const cluster = consonantClusterKeys(word, i);
    if (cluster) {
      out += cluster.keys;
      i += cluster.len;
      continue;
    }

    const consonant = consonantKey(ch, atWordStart);
    if (consonant) {
      out += consonant;
      i += 1;
      continue;
    }

    out += ch;
    i += 1;
  }

  return out;
}

/**
 * Convertit une phrase française / wolof (orthographe latine) en chaîne Messapia.
 * Les espaces et la ponctuation sont conservés.
 */
export function transcribeFangBoutique(text: string): string {
  return text
    .split(/(\s+)/)
    .map((part) => (/\s+/.test(part) ? part : transcribeWord(part)))
    .join("");
}

/** Règles condensées pour l’équipe (CMS, atelier). */
export const FANG_BOUTIQUE_LANG_SUMMARY = {
  name: "Langue boutique FANG",
  font: "Messapia",
  referenceImage: "/references/langue-boutique-planche.png",
  panels: ["Voyelles", "Consonnes", "Consonnes+", "Symboles (idéogrammes)"],
  notes: [
    "La minuscule « a » se tape « > » (pas la lettre a).",
    "Les sons « eu » et « ë » se tapent « [ ».",
    "« ô » (eau) se tape « Ô » ; « oo », « ôô », « ou », « an », « you » sont des digrammes.",
    "Consonnes+ : ng, mb, nd, ch, tch, nk, dj, kk, LL.",
    "C et x(ks) sont des lettres spéciales (voir planche, en rouge).",
    "Mots-symboles : espoir, maison, amour, foi, futur, mort, tristesse, borom/gardien, aide/famille…",
    "Exemple planche : « gardien de la maison kamara » = idéogramme borom + idéogramme maison + kamara en lettres.",
  ],
  examples: [
    {
      label: "Exemple planche",
      latin: "gardien de la maison kamara",
      messapia: transcribeFangBoutique("gardien de la maison kamara"),
    },
    {
      label: "Tagline actuelle",
      latin: "Nel Fang Te Dundu",
      messapia: transcribeFangBoutique("Nel Fang Te Dundu"),
    },
  ],
} as const;
