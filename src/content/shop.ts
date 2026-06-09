import { publicUrl } from "@/lib/publicUrl";
import {
  allCharacters,
  collectionChapters,
  getChapterById,
  type CollectionCharacter,
} from "@/content/collectionCatalog";
import productOverrides from "./productsOverrides.json";
import {
  displayPriceXof,
  resolveVariations,
  type ProductVariation,
} from "./productVariations";

export type { ProductVariation };
export {
  displayPriceXof,
  formatVariationPriceLabel,
  getDefaultVariation,
  getPriceRange,
  getVariationById,
  hasMultipleVariations,
  resolveVariations,
} from "./productVariations";

export type ShopProduct = {
  id: string;
  slug: string;
  name: string;
  kind: "Silhouette" | "Ensemble" | "Pièce unique";
  chapterId: string;
  chapterLabel: string;
  characterId: string;
  characterSlug: string;
  characterName: string;
  /** Clé partagée avec l'admin stock (chapterId/characterSlug) */
  productKey: string;
  /** Prix affiché (variation par défaut ou minimum) */
  priceXof: number;
  /** Variations de pièce / prix — style WooCommerce */
  variations: readonly ProductVariation[];
  material: string;
  excerpt: string;
  description: string;
  coverImage: string;
  images: string[];
  sizes: readonly string[];
};

type ProductOverride = Partial<{
  name: string;
  kind: ShopProduct["kind"];
  priceXof: number;
  variations: ProductVariation[];
  material: string;
  excerpt: string;
  description: string;
  sizes: string[];
  coverImage: string;
  images: string[];
}>;

const overrides = productOverrides as Record<string, ProductOverride>;

const DEFAULT_PRICE = 125000;
const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL"] as const;

function getOverride(chapterId: string, slug: string): ProductOverride {
  return overrides[`${chapterId}/${slug}`] ?? {};
}

function productFromCharacter(character: CollectionCharacter): ShopProduct | null {
  if (character.images.length === 0) return null;
  const chapter = getChapterById(character.chapterId);
  if (!chapter) return null;

  const ov = getOverride(chapter.id, character.slug);
  const basePrice = typeof ov.priceXof === "number" ? ov.priceXof : DEFAULT_PRICE;
  const variations = resolveVariations(basePrice, ov.variations);
  const priceXof = displayPriceXof({ priceXof: basePrice, variations });

  const overrideImages =
    ov.images && ov.images.length > 0
      ? ov.images.map((p) => publicUrl(p))
      : null;
  const images = overrideImages ?? character.images;
  const coverImage =
    (ov.coverImage ? publicUrl(ov.coverImage) : null) ??
    character.coverImage ??
    images[0] ??
    character.cover;

  return {
    id: character.id,
    slug: `${chapter.slug}-${character.slug}`,
    name: ov.name ?? `${character.name} — ${chapter.name}`,
    kind: ov.kind ?? "Silhouette",
    chapterId: chapter.id,
    chapterLabel: `${chapter.name} · ${character.name}`,
    characterId: character.id,
    characterSlug: character.slug,
    characterName: character.name,
    productKey: `${chapter.id}/${character.slug}`,
    priceXof,
    variations,
    material: ov.material ?? "Tissus locaux, confection à Dakar",
    excerpt: ov.excerpt ?? `Pièce du chapitre ${chapter.name}, portée par ${character.name}.`,
    description:
      ov.description ??
      `${character.name} dans la collection ${chapter.name} — Nel Fang Te Dundu. Chaque photo correspond à une pièce produite à l’atelier FANG.`,
    coverImage,
    images,
    sizes: ov.sizes && ov.sizes.length > 0 ? ov.sizes : DEFAULT_SIZES,
  };
}

/** Produits générés uniquement depuis les personnages présents dans l’atelier. */
export const shopProducts: ShopProduct[] = allCharacters()
  .map(productFromCharacter)
  .filter((p): p is ShopProduct => p !== null);

export function getProductBySlug(slug: string): ShopProduct | undefined {
  return shopProducts.find((p) => p.slug === slug);
}

export function getProductByCharacter(chapterId: string, characterSlug: string): ShopProduct | undefined {
  return shopProducts.find((p) => p.chapterId === chapterId && p.characterSlug === characterSlug);
}

export function getProductsForChapter(chapterId: string): ShopProduct[] {
  return shopProducts.filter((p) => p.chapterId === chapterId);
}

export function formatPriceXof(value: number): string {
  return new Intl.NumberFormat("fr-SN", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(value);
}

export const whatsappOrderNumber =
  import.meta.env.VITE_WHATSAPP_ORDER ?? "221000000000";

/** Images de repli si le catalogue est vide (dev) */
export const placeholderChapterImage = publicUrl("chapters/ch1/img1.jpg");

export { collectionChapters };
