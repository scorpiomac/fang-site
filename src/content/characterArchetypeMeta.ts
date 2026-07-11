import type { Character3DRosterEntry } from "@/content/character3DAssets";

export type CharacterArchetypeMeta = {
  role: string;
  origin: string;
  values: string;
  force: string;
  symbol: string;
  element: string;
};

/** Fiche « jeu vidéo » — panneau droit page Archétype */
export const characterArchetypeMeta: Record<string, CharacterArchetypeMeta> = {
  "gue-am": {
    role: "Celui qu'on regarde",
    origin: "Afrique de l'Ouest — Sénégal",
    values: "Audace, couleur, présence",
    force: "S'affirmer sans permission",
    symbol: "Le miroir",
    element: "Feu",
  },
  racine: {
    role: "L'urbain ancré",
    origin: "Dakar — la rue",
    values: "Authenticité, mouvement, mémoire",
    force: "Tenir debout dans la ville",
    symbol: "Le bitume",
    element: "Terre",
  },
  fod: {
    role: "Le sage / le griot",
    origin: "Terre et transmission",
    values: "Patience, récit, résilience",
    force: "Laisser passer le vent",
    symbol: "Le sable",
    element: "Air",
  },
  mossane: {
    role: "Celle qui sort du lot",
    origin: "Entre plusieurs mondes",
    values: "Intuition, regard, singularité",
    force: "Voir avant les autres",
    symbol: "L'œil ouvert",
    element: "Eau",
  },
  jant: {
    role: "Le soleil",
    origin: "Sérère — lumière",
    values: "Rayonnement, chaleur, centre",
    force: "Éclairer sans forcer",
    symbol: "Le soleil levant",
    element: "Feu",
  },
  miik: {
    role: "La silencieuse",
    origin: "Corps atypiques — confort d'abord",
    values: "Douceur, détail, discrétion",
    force: "Habiter sans se plier",
    symbol: "La couture",
    element: "Air",
  },
};

export function getArchetypeMeta(slug: string): CharacterArchetypeMeta {
  return (
    characterArchetypeMeta[slug] ?? {
      role: "Archétype FANG",
      origin: "Saison 0 — Neel Fang",
      values: "Exposition, culture, fierté",
      force: "Être soi",
      symbol: "Le socle",
      element: "Terre",
    }
  );
}

export type CharacterRosterView = Character3DRosterEntry & {
  meta: CharacterArchetypeMeta;
};
