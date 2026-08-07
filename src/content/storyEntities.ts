export type StoryEntity = {
  id: string;
  name: string;
  role: string;
  body: string;
  /** Teunk se démarque comme antagoniste */
  tone?: "default" | "antagonist";
};

export const storyEntities: StoryEntity[] = [
  {
    id: "fod",
    name: "Fod",
    role: "Le sage · Le griot",
    body: "Ouvre et ferme le récit ; plante les graines de libération. Grand boubou blanc, présence absolue.",
  },
  {
    id: "ohasso",
    name: "Ohasso",
    role: "L'entité libératrice",
    body: "Unifie tous les êtres par son écriture. Jamais de visage — seulement des mains qui écrivent l'Ohasso.",
  },
  {
    id: "teunk",
    name: "Teunk",
    role: "L'antagoniste · La société",
    body: "« Enclaver » en wolof. Enferme chaque archétype dans une case ; s'affaiblit à chaque libération.",
    tone: "antagonist",
  },
];
