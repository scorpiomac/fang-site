export const creator = {
  name: "Fallou Ngom",
  role: "Fondateur, directeur artistique & couturier",
  city: "Dakar, Sénégal",
  paragraphs: [
    "Fallou Ngom a grandi en se sentant « décalé » par les codes de la mode. Plutôt que de s'y conformer, il a créé l'espace qui lui manquait, où le vêtement sert à se libérer plutôt qu'à rentrer dans un moule.",
  ],
  inspirations: [
    "Folklore sénégalais",
    "Cultures Sérère & Diola",
    "Mangas & animés japonais",
    "Afrofuturisme",
  ],
  stances: [
    {
      title: "Notre terrain",
      body: "L'émancipation par le vêtement. Une écriture propre. La confiance en soi comme un droit.",
    },
    {
      title: "Nos partis pris",
      body: "Loin du luxe froid, du folklore « afro » et du streetwear générique.",
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
