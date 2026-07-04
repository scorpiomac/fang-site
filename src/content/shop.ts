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
  pieceId: string;
  pieceIndex: number;
  pieceLabel: string;
  /** Clé stock admin : chapterId/characterSlug/pieceId */
  productKey: string;
  priceXof: number;
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

export function pieceIdFromImageUrl(imageUrl: string): string {
  const filename = imageUrl.split("/").pop() ?? "piece";
  return filename.replace(/\.[^.]+$/, "");
}

export function productOverrideKey(
  chapterId: string,
  characterSlug: string,
  pieceId?: string
): string {
  return pieceId ? `${chapterId}/${characterSlug}/${pieceId}` : `${chapterId}/${characterSlug}`;
}

function getOverride(
  chapterId: string,
  characterSlug: string,
  pieceId: string
): ProductOverride {
  const charKey = productOverrideKey(chapterId, characterSlug);
  const pieceKey = productOverrideKey(chapterId, characterSlug, pieceId);
  return { ...(overrides[charKey] ?? {}), ...(overrides[pieceKey] ?? {}) };
}

function formatPieceLabel(pieceId: string, pieceIndex: number): string {
  if (pieceId === "cover") return "Cover";
  const match = pieceId.match(/produit-(\d+)/i);
  if (match) return `Pièce ${Number(match[1])}`;
  return `Pièce ${pieceIndex + 1}`;
}

function productFromCharacterImage(
  character: CollectionCharacter,
  imageUrl: string,
  pieceIndex: number
): ShopProduct | null {
  const chapter = getChapterById(character.chapterId);
  if (!chapter) return null;

  const pieceId = pieceIdFromImageUrl(imageUrl);
  const ov = getOverride(chapter.id, character.slug, pieceId);
  const basePrice = typeof ov.priceXof === "number" ? ov.priceXof : DEFAULT_PRICE;
  const variations = resolveVariations(basePrice, ov.variations);
  const priceXof = displayPriceXof({ priceXof: basePrice, variations });
  const coverImage =
    (ov.coverImage ? publicUrl(ov.coverImage) : null) ?? publicUrl(imageUrl);

  const pieceLabel = formatPieceLabel(pieceId, pieceIndex);
  const defaultName =
    character.images.length > 1
      ? `${character.name} — ${pieceLabel}`
      : `${character.name} — ${chapter.name}`;

  return {
    id: `${character.id}-${pieceId}`,
    slug: `${chapter.slug}-${character.slug}-${pieceId}`,
    name: ov.name ?? defaultName,
    kind: ov.kind ?? "Silhouette",
    chapterId: chapter.id,
    chapterLabel: `${chapter.name} · ${character.name}`,
    characterId: character.id,
    characterSlug: character.slug,
    characterName: character.name,
    pieceId,
    pieceIndex,
    pieceLabel,
    productKey: `${chapter.id}/${character.slug}/${pieceId}`,
    priceXof,
    variations,
    material: ov.material ?? "Tissus locaux, confection à Dakar",
    excerpt:
      ov.excerpt ??
      `Pièce du chapitre ${chapter.name}, portée par ${character.name}.`,
    description:
      ov.description ??
      `${character.name} — ${pieceLabel}. Pièce produite à l'atelier FANG, collection ${chapter.name}.`,
    coverImage,
    images: [coverImage],
    sizes: ov.sizes && ov.sizes.length > 0 ? ov.sizes : DEFAULT_SIZES,
  };
}

function productsFromCharacter(character: CollectionCharacter): ShopProduct[] {
  if (character.images.length === 0) return [];
  return character.images
    .map((imageUrl, pieceIndex) => productFromCharacterImage(character, imageUrl, pieceIndex))
    .filter((p): p is ShopProduct => p !== null);
}

/** Une image atelier = une fiche produit distincte. */
export const shopProducts: ShopProduct[] = allCharacters().flatMap(productsFromCharacter);

export function getProductBySlug(slug: string): ShopProduct | undefined {
  return shopProducts.find((p) => p.slug === slug);
}

/** Anciens slugs `chapitre-personnage` → première pièce. */
export function resolveProductSlug(slug: string): ShopProduct | undefined {
  const direct = getProductBySlug(slug);
  if (direct) return direct;
  const legacy = shopProducts.filter((p) => {
    const chapter = getChapterById(p.chapterId);
    return chapter && `${chapter.slug}-${p.characterSlug}` === slug;
  });
  return legacy[0];
}

export function getLegacyProductRedirect(slug: string): string | null {
  if (getProductBySlug(slug)) return null;
  const first = resolveProductSlug(slug);
  if (first && first.slug !== slug) return first.slug;
  return null;
}

export function getProductsForCharacter(
  chapterId: string,
  characterSlug: string
): ShopProduct[] {
  return shopProducts.filter(
    (p) => p.chapterId === chapterId && p.characterSlug === characterSlug
  );
}

export function getProductByCharacter(
  chapterId: string,
  characterSlug: string
): ShopProduct | undefined {
  return getProductsForCharacter(chapterId, characterSlug)[0];
}

export function getProductsForChapter(chapterId: string): ShopProduct[] {
  return shopProducts.filter((p) => p.chapterId === chapterId);
}

export function getCharacterPriceRange(
  chapterId: string,
  characterSlug: string
): { min: number; max: number } | null {
  const products = getProductsForCharacter(chapterId, characterSlug);
  if (products.length === 0) return null;
  const prices = products.map((p) => p.priceXof);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function formatPriceRange(min: number, max: number): string {
  if (min === max) return `${formatPriceXof(min)} FCFA`;
  return `${formatPriceXof(min)} – ${formatPriceXof(max)} FCFA`;
}

export function formatPriceXof(value: number): string {
  return new Intl.NumberFormat("fr-SN", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(value);
}

export const whatsappOrderNumber =
  import.meta.env.VITE_WHATSAPP_ORDER ?? "221000000000";

export const placeholderChapterImage = publicUrl("chapters/ch1/img1.jpg");

export { collectionChapters };
