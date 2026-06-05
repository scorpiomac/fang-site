import { publicUrl } from "@/lib/publicUrl";

export type ShopProduct = {
  id: string;
  slug: string;
  name: string;
  kind: "Silhouette" | "Ensemble" | "Pièce unique";
  chapterId: string;
  chapterLabel: string;
  priceXof: number;
  material: string;
  excerpt: string;
  description: string;
  images: string[];
  sizes: readonly string[];
};

/** Prix indicatifs en FCFA — à ajuster selon l’atelier. */
export const shopProducts: ShopProduct[] = [
  {
    id: "p-tambali",
    slug: "veste-tambali",
    name: "Veste Tambali",
    kind: "Silhouette",
    chapterId: "tambali",
    chapterLabel: "Tambali — personnage",
    priceXof: 125000,
    material: "Coton brut local, doublure respirante",
    excerpt: "Coupe nette, première lumière du matin.",
    description:
      "Structure affirmée, épaules définies. Pensée pour ouvrir une silhouette sans la raidir — la pièce d’entrée de Nel Fang Te Dundu.",
    images: [
      publicUrl("chapters/ch1/img1.jpg"),
      publicUrl("chapters/ch1/img2.jpg"),
      publicUrl("chapters/ch1/img3.jpg"),
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  {
    id: "p-passage",
    slug: "ensemble-passage",
    name: "Ensemble Passage",
    kind: "Ensemble",
    chapterId: "passage",
    chapterLabel: "Passage — personnage",
    priceXof: 185000,
    material: "Lin mélangé, coutures apparentes",
    excerpt: "Volumes amples, mouvement sculpté.",
    description:
      "Haut et bas coordonnés pour une traversée fluide. Le drapé dialogue avec le vent — présence aérienne, ancrage au sol.",
    images: [
      publicUrl("chapters/ch2/img1.jpg"),
      publicUrl("chapters/ch2/img3.jpg"),
      publicUrl("chapters/ch2/img5.jpg"),
    ],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "p-exposition",
    slug: "robe-exposition",
    name: "Robe Exposition",
    kind: "Silhouette",
    chapterId: "exposition",
    chapterLabel: "Exposition — personnage",
    priceXof: 165000,
    material: "Soie froissée, satin structuré",
    excerpt: "Se montrer sans armure.",
    description:
      "Épaules dégagées, ligne franche. Une robe-manifeste pour celles et ceux qui choisissent la visibilité comme langage.",
    images: [
      publicUrl("chapters/ch3/img1.jpg"),
      publicUrl("chapters/ch3/img2.jpg"),
      publicUrl("chapters/ch3/img4.jpg"),
    ],
    sizes: ["XS", "S", "M", "L"],
  },
  {
    id: "p-feu",
    slug: "manteau-feu",
    name: "Manteau Feu",
    kind: "Silhouette",
    chapterId: "feu",
    chapterLabel: "Feu — personnage",
    priceXof: 210000,
    material: "Laine douce, doublure bordeaux",
    excerpt: "Rouges et bronze — élan vital.",
    description:
      "Longue présence, col affirmé. Les couleurs du feu intérieur portées comme une signature.",
    images: [
      publicUrl("chapters/ch4/img1.jpg"),
      publicUrl("chapters/ch4/img3.jpg"),
      publicUrl("chapters/ch4/img5.jpg"),
    ],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "p-ge-am",
    slug: "chemise-ge-am",
    name: "Chemise Ge Am",
    kind: "Silhouette",
    chapterId: "ge-am",
    chapterLabel: "Ge Am — personnage",
    priceXof: 98000,
    material: "Coton tissé, détails brodés à la main",
    excerpt: "Mémoire Sérère & Diola, contemporaine.",
    description:
      "Motifs réinterprétés, broderie discrète au col ou aux poignets. Une chemise qui nomme la conscience de soi.",
    images: [
      publicUrl("chapters/ch5/img2.jpg"),
      publicUrl("chapters/ch5/img3.jpg"),
      publicUrl("chapters/ch5/img4.jpg"),
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  {
    id: "p-racine",
    slug: "pantalon-racine",
    name: "Pantalon Racine",
    kind: "Silhouette",
    chapterId: "racine",
    chapterLabel: "Racine — personnage",
    priceXof: 88000,
    material: "Denim lourd teint Dakar",
    excerpt: "Coupé et cousu à Dakar.",
    description:
      "Jambe ample ou fuselée selon pointure — coupe pensée pour les morphologies atypiques. Fabriqué avec l’équipe atelier.",
    images: [
      publicUrl("chapters/ch6/img2.jpg"),
      publicUrl("chapters/ch6/img3.jpg"),
      publicUrl("chapters/ch6/img5.jpg"),
    ],
    sizes: ["28", "30", "32", "34", "36"],
  },
  {
    id: "p-mbougir",
    slug: "cape-mbougir",
    name: "Cape Mbougir",
    kind: "Pièce unique",
    chapterId: "mbougir",
    chapterLabel: "Mbougir — personnage",
    priceXof: 245000,
    material: "Cachemire mélangé, ceinture cuir végétal",
    excerpt: "S’élever — final de collection.",
    description:
      "Volume dramatique, traîne maîtrisée. Pièce limitée — commande sur mesure possible sous 4 à 6 semaines.",
    images: [
      publicUrl("chapters/ch7/img1.jpg"),
      publicUrl("chapters/ch7/img2.jpg"),
      publicUrl("chapters/ch7/img4.jpg"),
    ],
    sizes: ["TU", "Sur mesure"],
  },
];

export function getProductBySlug(slug: string): ShopProduct | undefined {
  return shopProducts.find((p) => p.slug === slug);
}

export function formatPriceXof(value: number): string {
  return new Intl.NumberFormat("fr-SN", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Numéro WhatsApp commandes (sans +) — remplacer via VITE_WHATSAPP_ORDER */
export const whatsappOrderNumber =
  import.meta.env.VITE_WHATSAPP_ORDER ?? "221000000000";
