import { publicUrl } from "@/lib/publicUrl";

/** Objet « griot » cliquable sur la fiche narrative */
export type ChapterNarrativeArtifact = {
  id: string;
  /** Caractère ou symbole court (pas d’emoji obligatoire) */
  glyph: string;
  label: string;
  story: string;
};

/** Surcharges optionnelles — sinon la page déduit du reste du chapitre */
export type ChapterNarrativeOverrides = {
  cinematicLine?: string;
  cinematicSubline?: string;
  eraPlace?: string;
  worldHeadline?: string;
  worldIntro?: string;
  challengeLine?: string;
  decisiveTitle?: string;
  decisiveBody?: string;
  griotVoice?: string;
  closingLine?: string;
  artifacts?: ChapterNarrativeArtifact[];
};

export type Chapter = {
  id: string;
  slug: string;
  index: string;
  name: string;
  meaning: string;
  intention: string;
  body: string;
  palette: string[];
  images: string[];
  /** Libellé casting, ex. « Personnage 01 » */
  characterLabel: string;
  /** Une ligne type fiche de casting */
  role: string;
  /** Réplique courte — voix du personnage / de la marque */
  quote: string;
  /** Lien explicite entre le personnage et la pièce portée */
  wear: string;
  /** Badges d’ambiance pour l’UI */
  moodTags: readonly string[];
  /** Récit type « musée numérique » — entièrement optionnel */
  narrative?: ChapterNarrativeOverrides;
};

export const chapters: Chapter[] = [
  {
    id: "tambali",
    slug: "tambali",
    index: "01",
    name: "Tambali",
    meaning: "Le commencement",
    intention: "Poser le premier pas. Ouvrir la voix.",
    body: "Une silhouette qui s’avance dans la lumière brute du matin sénégalais. Coupes nettes, fibres respirantes — la marque dépose ses premières fondations.",
    palette: ["#3a261a", "#7d5c3a", "#c4b6a3"],
    images: [
      publicUrl("chapters/ch1/img1.jpg"),
      publicUrl("chapters/ch1/img2.jpg"),
      publicUrl("chapters/ch1/img3.jpg"),
      publicUrl("chapters/ch1/img4.jpg"),
      publicUrl("chapters/ch1/img5.jpg"),
    ],
    characterLabel: "Personnage 01",
    role: "Celle qui ouvre la scène",
    quote: "Je n’attends pas le signal : je suis le premier battement.",
    wear: "La veste Tambali est son manteau de lumière — structure nette pour entrer dans l’exposition.",
    moodTags: ["Aube", "Terre", "Premier pas"],
  },
  {
    id: "passage",
    slug: "passage",
    index: "02",
    name: "Passage",
    meaning: "La traversée",
    intention: "Quitter une peau pour en habiter une autre.",
    body: "Volumes amples, drapés architecturés. Le tissu épouse le mouvement comme l’eau épouse la rive.",
    palette: ["#2a1f17", "#9a7b52", "#e6d8c2"],
    images: [
      publicUrl("chapters/ch2/img1.jpg"),
      publicUrl("chapters/ch2/img2.jpg"),
      publicUrl("chapters/ch2/img3.jpg"),
      publicUrl("chapters/ch2/img4.jpg"),
      publicUrl("chapters/ch2/img5.jpg"),
    ],
    characterLabel: "Personnage 02",
    role: "L’architecte du seuil",
    quote: "Entre deux rives, je ne me noie pas : je me drape.",
    wear: "L’ensemble Passage est sa traversée visible — haut et bas qui ne se séparent plus du corps.",
    moodTags: ["Eau", "Transition", "Drapé"],
  },
  {
    id: "exposition",
    slug: "exposition",
    index: "03",
    name: "Exposition",
    meaning: "Se montrer sans armure",
    intention: "Le regard de l’autre n’est plus une menace.",
    body: "Coupes franches, épaules dégagées. Le vêtement devient déclaration : oui, je suis là, et je tiens debout.",
    palette: ["#4a0e1c", "#8c2317", "#d9b08c"],
    images: [
      publicUrl("chapters/ch3/img1.jpg"),
      publicUrl("chapters/ch3/img2.jpg"),
      publicUrl("chapters/ch3/img3.jpg"),
      publicUrl("chapters/ch3/img4.jpg"),
      publicUrl("chapters/ch3/img5.jpg"),
    ],
    characterLabel: "Personnage 03",
    role: "Celle qui refuse l’ombre",
    quote: "Mon corps n’est pas un secret : c’est une déclaration.",
    wear: "La robe Exposition est son manifeste — ligne franche, visibilité assumée.",
    moodTags: ["Déclaration", "Peau", "Lumière"],
  },
  {
    id: "feu",
    slug: "feu",
    index: "04",
    name: "Feu",
    meaning: "L’élan vital",
    intention: "Brûler ce qui n’est plus utile.",
    body: "Rouges sénégalais, bordeaux profonds, bronze patiné. Le feu intérieur trouve enfin sa surface.",
    palette: ["#3d0a14", "#a0341e", "#c9a66b"],
    images: [
      publicUrl("chapters/ch4/img1.jpg"),
      publicUrl("chapters/ch4/img2.jpg"),
      publicUrl("chapters/ch4/img3.jpg"),
      publicUrl("chapters/ch4/img4.jpg"),
      publicUrl("chapters/ch4/img5.jpg"),
    ],
    characterLabel: "Personnage 04",
    role: "Le gardien de la chaleur",
    quote: "Ce qui ne me sert plus, je le laisse derrière moi — en cendres.",
    wear: "Le manteau Feu est sa présence longue — bordeaux, laine, silence brûlant.",
    moodTags: ["Rouge", "Force", "Rituel"],
  },
  {
    id: "ge-am",
    slug: "ge-am",
    index: "05",
    name: "Ge Am",
    meaning: "Avoir conscience de soi",
    intention: "Se reconnaître dans le miroir des autres.",
    body: "Hommage aux cultures Sérère et Diola : motifs réinterprétés, broderies discrètes, mémoire vivante du folklore.",
    palette: ["#1a1612", "#5c3d1f", "#c4b6a3"],
    images: [
      publicUrl("chapters/ch5/img1.jpg"),
      publicUrl("chapters/ch5/img2.jpg"),
      publicUrl("chapters/ch5/img3.jpg"),
      publicUrl("chapters/ch5/img4.jpg"),
      publicUrl("chapters/ch5/img5.jpg"),
    ],
    characterLabel: "Personnage 05",
    role: "Le témoin de la mémoire",
    quote: "Je porte ceux qui sont venus avant moi — brodé dans le geste.",
    wear: "La chemise Ge Am est sa mémoire portée — motif, col, conscience.",
    moodTags: ["Sérère", "Diola", "Broderie"],
  },
  {
    id: "racine",
    slug: "racine",
    index: "06",
    name: "Racine",
    meaning: "Là où ça tient",
    intention: "Nommer ce qui nous fonde.",
    body: "Toutes les pièces sont coupées et cousues à Dakar. Quatre artisans, une main, une vision. La racine n’est pas un décor — c’est la structure.",
    palette: ["#0d0b09", "#3a261a", "#9a7b52"],
    images: [
      publicUrl("chapters/ch6/img1.jpg"),
      publicUrl("chapters/ch6/img2.jpg"),
      publicUrl("chapters/ch6/img3.jpg"),
      publicUrl("chapters/ch6/img4.jpg"),
      publicUrl("chapters/ch6/img5.jpg"),
    ],
    characterLabel: "Personnage 06",
    role: "L’ancrage de l’atelier",
    quote: "Sans racine, la silhouette ment. Moi, je tiens debout sur le même sol.",
    wear: "Le pantalon Racine est son ancrage — denim Dakar, coupe pour morphologies atypiques.",
    moodTags: ["Dakar", "Atelier", "Structure"],
  },
  {
    id: "mbougir",
    slug: "mbougir",
    index: "07",
    name: "Mbougir",
    meaning: "S’élever",
    intention: "Porter sa fierté plus haut.",
    body: "Final ouvert : silhouettes qui regardent le futur. Du Sénégal vers Paris, Londres, New York, Tokyo — sans jamais se renier.",
    palette: ["#0d0b09", "#c9a66b", "#f2ebe3"],
    images: [
      publicUrl("chapters/ch7/img1.jpg"),
      publicUrl("chapters/ch7/img2.jpg"),
      publicUrl("chapters/ch7/img3.jpg"),
      publicUrl("chapters/ch7/img4.jpg"),
      publicUrl("chapters/ch7/img5.jpg"),
    ],
    characterLabel: "Personnage 07",
    role: "Celle qui regarde l’horizon",
    quote: "Je ne quitte pas la terre : je la porte plus haut.",
    wear: "La cape Mbougir est son élévation — volume dramatique, final de collection.",
    moodTags: ["Futur", "Fierté", "Scène"],
  },
];

export function getChapterById(id: string): Chapter | undefined {
  return chapters.find((c) => c.id === id);
}

export function getChapterBySlug(slug: string): Chapter | undefined {
  return chapters.find((c) => c.slug === slug);
}
