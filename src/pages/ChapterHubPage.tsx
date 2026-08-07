import type { CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getChapterBySlug,
  getCharactersForChapter,
  totalProductsInChapter,
} from "@/content/collectionCatalog";
import { getProductsForChapter } from "@/content/shop";
import { copy } from "@/content/copy";
import { CommerceJourney } from "@/components/shop/CommerceJourney";
import { ProductCard } from "@/components/shop/ProductCard";
import { TrustStrip } from "@/components/shop/TrustStrip";

export function ChapterHubPage() {
  const { chapterSlug } = useParams<{ chapterSlug: string }>();
  const chapter = chapterSlug ? getChapterBySlug(chapterSlug) : undefined;

  if (!chapter) {
    return (
      <main id="contenu-principal" className="collection-page collection-page--missing shop-shell">
        <p>Chapitre introuvable.</p>
        <Link to="/boutique" className="cta cta--solid">
          Voir la boutique
        </Link>
      </main>
    );
  }

  const characters = getCharactersForChapter(chapter.id);
  const chapterProducts = getProductsForChapter(chapter.id);
  const productTotal = totalProductsInChapter(chapter.id);
  const heroImage = chapter.posterImage || chapter.coverImage || characters[0]?.cover;

  return (
    <main
      id="contenu-principal"
      className="collection-page collection-chapter-hub shop-shell commerce-shell"
      style={
        {
          "--c1": chapter.palette[0],
          "--c2": chapter.palette[1],
          "--c3": chapter.palette[2],
        } as CSSProperties
      }
    >
      <CommerceJourney
        steps={[
          { label: "Boutique", to: "/boutique" },
          { label: `Ch. ${chapter.index} · ${chapter.name}`, current: true },
          { label: "Commander", to: `/boutique?chapitre=${chapter.id}` },
        ]}
      />

      <header className="collection-chapter-hub__hero collection-chapter-hub__hero--premium">
        <div className="collection-chapter-hub__hero-copy">
          <p className="collection-chapter-hub__index">Chapitre {chapter.index}</p>
          <h1>{chapter.name}</h1>
          {chapter.meaning ? <p className="collection-chapter-hub__meaning">{chapter.meaning}</p> : null}
          {chapter.intention ? (
            <p className="collection-chapter-hub__intention">{chapter.intention}</p>
          ) : null}
          {chapter.quote ? (
            <blockquote className="collection-chapter-hub__quote">&laquo;&nbsp;{chapter.quote}&nbsp;&raquo;</blockquote>
          ) : null}
          {chapterProducts.length > 0 ? (
            <Link to={`/boutique?chapitre=${chapter.id}`} className="cta cta--solid">
              {copy.chapterShopCta} →
            </Link>
          ) : null}
        </div>
        {heroImage ? (
          <figure className="collection-chapter-hub__hero-media">
            <img src={heroImage} alt="" />
          </figure>
        ) : null}
      </header>

      <section className="collection-cast" aria-labelledby="personnages-heading">
        <div className="collection-cast__head">
          <div>
            <p className="collection-cast__eyebrow">{copy.collectionPersonnagesLabel}</p>
            <h2 id="personnages-heading">
              Choisissez une pièce
              {productTotal > 0 ? ` · ${productTotal} pièces` : ""}
            </h2>
            <p className="collection-cast__intro">
              Chaque archétype porte une ou plusieurs pièces de ce chapitre. Sélectionnez, choisissez
              votre taille, commandez.
            </p>
          </div>
        </div>

        {chapterProducts.length === 0 ? (
          <p className="collection-cast__empty">{copy.collectionEmptyChapter}</p>
        ) : (
          <div className="shop-catalog-grid">
            {chapterProducts.map((product, i) => (
              <div
                key={product.id}
                className="shop-catalog-item"
                style={{ "--stagger-delay": `${(i % 8) * 0.05}s` } as CSSProperties}
              >
                <ProductCard product={product} variant="catalog" />
              </div>
            ))}
          </div>
        )}
      </section>

      <TrustStrip />
    </main>
  );
}
