import { publicUrl } from "@/lib/publicUrl";
import catalogJson from "./atelierCatalog.json";
import { chapters as chapterLore } from "./chapters";
import siteOverridesJson from "./siteOverrides.json";

type ChapterLoreOverride = Partial<{
  name: string;
  meaning: string;
  intention: string;
  role: string;
  quote: string;
  body: string;
  palette: string[];
  /** Image utilisée dans les cartes et résumés du chapitre */
  coverImage: string;
  /** Image héros utilisée dans le bandeau du chapitre */
  posterImage: string;
}>;

const loreOverrides =
  ((siteOverridesJson as { chapters?: Record<string, ChapterLoreOverride> }).chapters ?? {});

/** Personnage = sous-dossier d’un chapitre (collection). N’existe que s’il est dans l’atelier. */
export type CollectionCharacter = {
  id: string;
  slug: string;
  name: string;
  chapterId: string;
  sourceFolder: string;
  cover: string;
  /** Override explicite de la cover (médiathèque) */
  coverImage?: string;
  /** Photos produits du personnage dans ce chapitre */
  images: string[];
  productCount: number;
};

export type CollectionChapter = {
  order: number;
  id: string;
  slug: string;
  index: string;
  /** Titre issu du dossier atelier */
  name: string;
  /** Nom exact du dossier source */
  sourceFolder: string;
  /** Sens / intention — depuis chapters.ts si disponible */
  meaning?: string;
  intention?: string;
  role?: string;
  quote?: string;
  body?: string;
  /** Image utilisée dans les cartes et listes (override admin) */
  coverImage?: string;
  /** Image héros affichée sur la page chapitre (override admin) */
  posterImage?: string;
  palette: string[];
  characters: CollectionCharacter[];
};

export type CollectionSeason = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  tagline: string;
  sourceRoot?: string;
  /** Ordre des chapitres tel que défini par le dossier atelier */
  chapterOrder?: string[];
};

type RawCatalog = {
  season: CollectionSeason;
  chapters: {
    order?: number;
    id: string;
    slug: string;
    index: string;
    name: string;
    sourceFolder?: string;
    characters: {
      id: string;
      slug: string;
      name: string;
      sourceFolder: string;
      cover: string;
      coverImage?: string;
      images: string[];
      productCount: number;
    }[];
  }[];
};

const raw = catalogJson as RawCatalog;

function url(path: string) {
  return publicUrl(path);
}

function enrichChapter(ch: RawCatalog["chapters"][0]): CollectionChapter {
  const lore = chapterLore.find((c) => c.id === ch.id);
  const override = loreOverrides[ch.id] ?? {};
  const order = ch.order ?? (Number.parseInt(ch.index, 10) || 0);
  return {
    order,
    id: ch.id,
    slug: ch.slug,
    index: ch.index,
    name: override.name ?? ch.name,
    sourceFolder: ch.sourceFolder ?? "",
    meaning: override.meaning ?? lore?.meaning,
    intention: override.intention ?? lore?.intention,
    role: override.role ?? lore?.role,
    quote: override.quote ?? lore?.quote,
    body: override.body ?? lore?.body,
    coverImage: override.coverImage ? url(override.coverImage) : undefined,
    posterImage: override.posterImage ? url(override.posterImage) : undefined,
    palette:
      override.palette && override.palette.length >= 3
        ? override.palette
        : lore?.palette ?? ["#3a261a", "#7d5c3a", "#c4b6a3"],
    characters: ch.characters.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      chapterId: ch.id,
      sourceFolder: c.sourceFolder,
      cover: url(c.coverImage ?? c.cover),
      coverImage: c.coverImage ? url(c.coverImage) : undefined,
      images: c.images.map(url),
      productCount: c.productCount,
    })),
  };
}

export const season01: CollectionSeason = raw.season;

export const collectionChapters: CollectionChapter[] = [...raw.chapters]
  .map(enrichChapter)
  .sort((a, b) => a.order - b.order);

/** Chapitres qui ont au moins un personnage dans l’atelier */
export const activeChapters = collectionChapters.filter((c) => c.characters.length > 0);

export const chapterCollectionNames: Record<string, string> = Object.fromEntries(
  collectionChapters.map((c) => [c.id, `Chapitre ${c.index} — ${c.name}`])
);

export const chapterFolderLabels: Record<string, string> = Object.fromEntries(
  collectionChapters.map((c) => [c.id, c.sourceFolder])
);

export function getChapterById(chapterId: string): CollectionChapter | undefined {
  return collectionChapters.find((c) => c.id === chapterId);
}

export function getChapterBySlug(slug: string): CollectionChapter | undefined {
  return collectionChapters.find((c) => c.slug === slug);
}

export function getCharactersForChapter(chapterId: string): CollectionCharacter[] {
  return getChapterById(chapterId)?.characters ?? [];
}

export function getCharacter(chapterId: string, characterSlug: string): CollectionCharacter | undefined {
  return getCharactersForChapter(chapterId).find((c) => c.slug === characterSlug);
}

export function totalProductsInChapter(chapterId: string): number {
  return getCharactersForChapter(chapterId).reduce((n, c) => n + c.productCount, 0);
}

export function allCharacters(): CollectionCharacter[] {
  return collectionChapters.flatMap((c) => c.characters);
}

const DEFAULT_CHAPTER_IMAGE = publicUrl("chapters/ch1/img1.jpg");

/** Image héro d'un chapitre — priorise l'atelier, puis overrides, puis récit. */
export function getChapterHeroImage(
  chapter: CollectionChapter,
  heroCharacter?: CollectionCharacter,
  narrativeFallback?: string
): string {
  return (
    heroCharacter?.cover ||
    chapter.characters[0]?.cover ||
    chapter.posterImage ||
    chapter.coverImage ||
    narrativeFallback ||
    DEFAULT_CHAPTER_IMAGE
  );
}

/** Image d'une vignette de galerie chapitre. */
export function getChapterGalleryImage(
  chapter: CollectionChapter,
  character: CollectionCharacter | undefined,
  fallbackIndex: number,
  narrativeFallbacks: readonly string[]
): string {
  if (character?.cover) return character.cover;
  return (
    narrativeFallbacks[fallbackIndex] ??
    narrativeFallbacks[0] ??
    chapter.characters[0]?.cover ??
    DEFAULT_CHAPTER_IMAGE
  );
}

/** @deprecated alias migration */
export type CastMember = CollectionCharacter;
export const getCastForChapterResolved = getCharactersForChapter;
export const totalCastPhotosResolved = totalProductsInChapter;
export const resolveCastMember = getCharacter;
