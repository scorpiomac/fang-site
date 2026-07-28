import type { Character3DRosterEntry } from "@/content/character3DAssets";

export type CharacterArchetypeMeta = {
  role: string;
  origin: string;
  values: string;
  force: string;
  symbol: string;
  element: string;
};

/** Fiche « jeu vidéo » — panneau droit page Archétype (aligné NOM · SENS · ÉNERGIE) */
export const characterArchetypeMeta: Record<string, CharacterArchetypeMeta> = {
  "gue-am": {
    role: "« Voyez-moi »",
    origin: "Afrique de l'Ouest — Sénégal",
    values: "Flamboyant, expressif",
    force: "S'affirmer sans permission",
    symbol: "Le miroir",
    element: "Feu",
  },
  miik: {
    role: "« Silencieuse »",
    origin: "Corps atypiques — confort d'abord",
    values: "Calme, confortable",
    force: "Habiter sans se plier",
    symbol: "La couture",
    element: "Air",
  },
  panda: {
    role: "L'animal fort et drôle",
    origin: "Joie assumée",
    values: "Assumé, joyeux",
    force: "Rire plus fort que la moquerie",
    symbol: "Le panda",
    element: "Terre",
  },
  yaranka: {
    role: "Sans frontière de genre",
    origin: "Au-delà des codes",
    values: "Fluide",
    force: "Franchir la ligne",
    symbol: "Le seuil",
    element: "Air",
  },
  ndanane: {
    role: "La présence par la carrure",
    origin: "Corps majestueux",
    values: "Imposant",
    force: "Occuper l'espace",
    symbol: "La carrure",
    element: "Terre",
  },
  mossane: {
    role: "Celle qui sort du lot",
    origin: "Entre plusieurs mondes",
    values: "Artistique",
    force: "Voir avant les autres",
    symbol: "L'œil ouvert",
    element: "Eau",
  },
  mbararr: {
    role: "« Armure »",
    origin: "Le voile choisi",
    values: "Le voile choisi comme force",
    force: "Se protéger en se révélant",
    symbol: "Le voile",
    element: "Eau",
  },
  jant: {
    role: "« Soleil »",
    origin: "Lumière",
    values: "Sobre, raffiné, en paix",
    force: "Éclairer sans forcer",
    symbol: "Le soleil levant",
    element: "Feu",
  },
  djalann: {
    role: "« Souriante »",
    origin: "Joie geek & kawaii",
    values: "Kawaii, geek, joyeuse",
    force: "Entrer avant d'être invitée",
    symbol: "Le sourire",
    element: "Feu",
  },
  diaak: {
    role: "« Grand »",
    origin: "Taille & esprit",
    values: "Ancré, tête haute",
    force: "Porter la grandeur",
    symbol: "La stature",
    element: "Terre",
  },
  racine: {
    role: "La vie urbaine",
    origin: "Dakar — la rue",
    values: "Street, adaptable",
    force: "Tenir debout dans la ville",
    symbol: "Le bitume",
    element: "Terre",
  },
  sukox: {
    role: "« Se cacher »",
    origin: "Discrétion précise",
    values: "Discret, précis",
    force: "Briller dans le détail",
    symbol: "L'ombre",
    element: "Air",
  },
  fogamm: {
    role: "« J'en fais partie »",
    origin: "Création sobre",
    values: "Créatif avec peu",
    force: "Appartenir sans permission",
    symbol: "Le cercle",
    element: "Terre",
  },
  fod: {
    role: "Le sage",
    origin: "Terre et transmission",
    values: "Traditionnel, calme absolu",
    force: "Laisser passer le vent",
    symbol: "Le sable",
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
