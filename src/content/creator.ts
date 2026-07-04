export const creator = {
  name: "Fallou Ngom",
  role: "Fondateur, directeur artistique & couturier",
  city: "Dakar, Sénégal",
  paragraphs: [
    "En 2014, je me rends compte que les vêtements “à la mode” ne me vont pas. Mince, morphologie atypique — je ne trouvais rien qui me correspondait.",
    "Alors j’ai commencé à dessiner mes propres tenues. Je les faisais coudre par le tailleur du quartier, et chaque sortie devenait une exposition.",
    "J’ai poursuivi en parallèle un Master en ingénierie logicielle entre Mbour et Dakar. J’ai connu le code, le salariat, la routine. Puis le déclic : ma place était ailleurs.",
    "Avant FANG, il y a eu Carpe Diem (2019) et deux collections restées dans les tiroirs. Et puis est venue Nel Fang Te Dundu — celle qui dit : expose-toi et vis.",
  ],
  inspirations: [
    "Folklore sénégalais",
    "Cultures Sérère & Diola",
    "Mangas & animés japonais",
    "Afrofuturisme",
  ],
  pillars: [
    {
      title: "Authenticité",
      body: "Chaque pièce porte une part de vérité, de vécu.",
    },
    {
      title: "Culture",
      body: "Profondément inspirée du folklore sénégalais — Sérère, Diola — réinterprété pour le présent.",
    },
    {
      title: "Afrofuturisme",
      body: "Un pont entre nos racines et le futur. Tradition, innovation, audace.",
    },
  ],
} as const;

export type RecognitionIcon = "laurel" | "mannequin" | "scissors";

export type RecognitionImageFit = "cover" | "contain";

export const recognition = {
  items: [
    {
      year: "2026",
      title: "Top 10 — JOJ Dakar",
      body: "Sélection officielle parmi 200 maisons africaines pour les Jeux Olympiques de la Jeunesse de Dakar.",
      icon: "laurel" as RecognitionIcon,
      image: "recognition/milestone-joj.png",
      imageFit: "cover" as RecognitionImageFit,
      imageAspect: "square" as const,
    },
    {
      year: "2025",
      title: "Défilé officiel — 7 novembre",
      body: "Présentation de la vision FANG à l’événement officiel des designers retenus.",
      icon: "mannequin" as RecognitionIcon,
      image: "recognition/milestone-defile.png",
      imageFit: "cover" as RecognitionImageFit,
      imageAspect: "landscape" as const,
    },
    {
      year: "2024",
      title: "Lancement — Nel Fang Te Dundu",
      body: "Première collection officielle. Production locale à Dakar, équipe de quatre artisans.",
      icon: "scissors" as RecognitionIcon,
      image: "recognition/milestone-lancement.png",
      imageFit: "cover" as RecognitionImageFit,
      imageAspect: "landscape" as const,
    },
  ],
  vision:
    "D’ici cinq ans, FANG est une grande maison de mode capable de rivaliser avec les plus grandes — pas par imitation, mais par essence.",
  cities: ["Dakar", "Paris", "Londres", "New York", "Tokyo"],
} as const;
