import { getProductsForChapter, type ShopProduct } from "./shop";

/** Ordre des pièces en tête de galerie accueil (par chapitre). */
const HOME_GALLERY_SLUGS: Partial<Record<string, string[]>> = {
  tambali: [
    "tambali-jant-produit-09",
    "tambali-jant-produit-02",
    "tambali-diaak-produit-02",
  ],
};

export function getHomeChapterProducts(chapterId: string): ShopProduct[] {
  const all = getProductsForChapter(chapterId);
  const preferred = HOME_GALLERY_SLUGS[chapterId];
  if (!preferred?.length) return all;

  const bySlug = new Map(all.map((p) => [p.slug, p]));
  const picked: ShopProduct[] = [];
  const used = new Set<string>();

  for (const slug of preferred) {
    const product = bySlug.get(slug);
    if (product) {
      picked.push(product);
      used.add(slug);
    }
  }

  for (const product of all) {
    if (!used.has(product.slug)) picked.push(product);
  }

  return picked;
}
