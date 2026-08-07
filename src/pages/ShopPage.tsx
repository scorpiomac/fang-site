import { chapters as narrativeChapters } from "@/content/chapters";
import {
  collectionChapters,
  getCharactersForChapter,
  getChapterHeroImage,
  totalProductsInChapter,
} from "@/content/collectionCatalog";
import { copy } from "@/content/copy";
import { Seo } from "@/components/Seo";
import { useSiteSettings } from "@/context/siteSettingsContext";
import { CollectionHero } from "@/components/collection/CollectionHero";
import { CollectionChapterCard } from "@/components/collection/CollectionChapterCard";
import { FooterSection } from "@/sections/FooterSection";

/**
 * Boutique = contenu de la page Collection (hero + chapitres showcase).
 */
export function ShopPage() {
  const { settings } = useSiteSettings();
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <>
      <main id="contenu-principal" className="collection-page shop-shell shop-shell--compact">
        <Seo
          title={`Boutique — ${settings.brand.name}`}
          description={
            copy.conversionTagline ||
            "Toutes les pièces de la saison 0. Production artisanale à Dakar."
          }
          url={`${siteUrl}/boutique`}
        />

        <CollectionHero variant="boutique" />

        <ol
          id="chapitres-boutique"
          className="collection-chapters collection-chapters--showcase"
        >
          {collectionChapters.map((chapter) => {
            const characters = getCharactersForChapter(chapter.id);
            const productTotal = totalProductsInChapter(chapter.id);
            const lore = narrativeChapters.find((n) => n.id === chapter.id);
            const cover = getChapterHeroImage(chapter, characters[0], lore?.images[0]);

            return (
              <li key={chapter.id}>
                <CollectionChapterCard
                  chapter={chapter}
                  characters={characters}
                  cover={cover ?? null}
                  productTotal={productTotal}
                  orderTo={`/collection/${chapter.slug}`}
                />
              </li>
            );
          })}
        </ol>
      </main>
      <FooterSection />
    </>
  );
}
