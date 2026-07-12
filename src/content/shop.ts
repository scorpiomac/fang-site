import { publicUrl } from "@/lib/publicUrl";
import {
  allCharacters,
  collectionChapters,
  getChapterById,
  type CollectionCharacter,
} from "@/content/collectionCatalog";
import productOverrides from "./productsOverrides.json";
import { getCharacterProfile } from "./characterProfiles";
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

type ShopIndexes = {
  products: ShopProduct[];
  bySlug: Map<string, ShopProduct>;
  byChapterId: Map<string, ShopProduct[]>;
  byCharacterKey: Map<string, ShopProduct[]>;
};

let shopIndexes: ShopIndexes | null = null;

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
  return `Pièce ${pieceIndex + 1}`;
}

function resolveProductImages(coverImage: string, ov: ProductOverride): string[] {
  if (ov.images && ov.images.length > 0) {
    return ov.images.map((img) => publicUrl(img));
  }
  return [coverImage];
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
  const profile = getCharacterProfile(character.slug);
  const basePrice = typeof ov.priceXof === "number" ? ov.priceXof : DEFAULT_PRICE;
  const variations = resolveVariations(basePrice, ov.variations);
  const priceXof = displayPriceXof({ priceXof: basePrice, variations });
  const coverImage =
    (ov.coverImage ? publicUrl(ov.coverImage) : null) ?? publicUrl(imageUrl);

  const autoLabel = formatPieceLabel(pieceId, pieceIndex);
  const pieceLabel = character.images.length > 1 ? autoLabel : "";
  const defaultName =
    character.images.length > 1
      ? `${character.name} — ${autoLabel}`
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
      profile?.excerpt ??
      `Pièce du chapitre ${chapter.name}, portée par ${character.name}.`,
    description:
      ov.description ??
      profile?.description ??
      `${character.name} — ${autoLabel}. Pièce produite à l'atelier FANG, collection ${chapter.name}.`,
    coverImage,
    images: resolveProductImages(coverImage, ov),
    sizes: ov.sizes && ov.sizes.length > 0 ? ov.sizes : DEFAULT_SIZES,
  };
}

function productsFromCharacter(character: CollectionCharacter): ShopProduct[] {
  if (character.images.length === 0) return [];
  return character.images
    .map((imageUrl, pieceIndex) => productFromCharacterImage(character, imageUrl, pieceIndex))
    .filter((p): p is ShopProduct => p !== null);
}

function buildShopIndexes(): ShopIndexes {
  const products = allCharacters().flatMap(productsFromCharacter);
  const bySlug = new Map<string, ShopProduct>();
  const byChapterId = new Map<string, ShopProduct[]>();
  const byCharacterKey = new Map<string, ShopProduct[]>();

  for (const product of products) {
    bySlug.set(product.slug, product);

    const chapterList = byChapterId.get(product.chapterId);
    if (chapterList) chapterList.push(product);
    else byChapterId.set(product.chapterId, [product]);

    const characterKey = `${product.chapterId}/${product.characterSlug}`;
    const characterList = byCharacterKey.get(characterKey);
    if (characterList) characterList.push(product);
    else byCharacterKey.set(characterKey, [product]);
  }

  return { products, bySlug, byChapterId, byCharacterKey };
}

function getIndexes(): ShopIndexes {
  if (!shopIndexes) shopIndexes = buildShopIndexes();
  return shopIndexes;
}

/** Liste complète des produits (construite une seule fois). */
export function getShopProducts(): readonly ShopProduct[] {
  return getIndexes().products;
}

/** Compatibilité — préférer getShopProducts(). */
export const shopProducts: readonly ShopProduct[] = new Proxy([] as ShopProduct[], {
  get(_target, prop, receiver) {
    const list = getIndexes().products as unknown as ShopProduct[];
    const value = Reflect.get(list, prop, receiver);
    return typeof value === "function" ? value.bind(list) : value;
  },
});

export function getProductBySlug(slug: string): ShopProduct | undefined {
  return getIndexes().bySlug.get(slug);
}

/** Anciens slugs `chapitre-personnage` → première pièce. */
export function resolveProductSlug(slug: string): ShopProduct | undefined {
  const direct = getProductBySlug(slug);
  if (direct) return direct;
  for (const product of getIndexes().products) {
    const chapter = getChapterById(product.chapterId);
    if (chapter && `${chapter.slug}-${product.characterSlug}` === slug) return product;
  }
  return undefined;
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
  return getIndexes().byCharacterKey.get(`${chapterId}/${characterSlug}`) ?? [];
}

export function getProductByCharacter(
  chapterId: string,
  characterSlug: string
): ShopProduct | undefined {
  return getProductsForCharacter(chapterId, characterSlug)[0];
}

export function getProductsForChapter(chapterId: string): ShopProduct[] {
  return getIndexes().byChapterId.get(chapterId) ?? [];
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
  import.meta.env.VITE_WHATSAPP_ORDER ?? "221781879738";

export const placeholderChapterImage = publicUrl("chapters/ch1/img1.jpg");

export { collectionChapters };
