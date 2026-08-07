import { Link } from "react-router-dom";
import { chapters as narrativeChapters } from "@/content/chapters";
import {
  collectionChapters,
  activeChapters,
  getCharactersForChapter,
  getChapterHeroImage,
  totalProductsInChapter,
} from "@/content/collectionCatalog";
import { copy } from "@/content/copy";
import { CollectionHero } from "@/components/collection/CollectionHero";
import { CollectionChapterCard } from "@/components/collection/CollectionChapterCard";

export function CollectionPage() {
  return (
    <main id="contenu-principal" className="collection-page shop-shell commerce-shell">
      <CollectionHero />

      <ol className="collection-chapters collection-chapters--showcase">
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
              />
            </li>
          );
        })}
      </ol>

      <aside className="commerce-closer">
        <p className="commerce-closer__title">Prêt à porter FANG ?</p>
        <p className="commerce-closer__body">
          {activeChapters.length} chapitres disponibles — choisissez votre archétype, votre taille,
          validez sur WhatsApp avec l&apos;atelier.
        </p>
        <Link to="/boutique" className="cta cta--solid">
          {copy.shopAllPieces} →
        </Link>
      </aside>
    </main>
  );
}
