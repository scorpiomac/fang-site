import type { CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getChapterBySlug,
  getCharactersForChapter,
  totalProductsInChapter,
} from "@/content/collectionCatalog";
import {
  formatPriceRange,
  formatPriceXof,
  getCharacterPriceRange,
  getProductsForCharacter,
  getProductsForChapter,
} from "@/content/shop";
import { copy } from "@/content/copy";
import { CommerceJourney } from "@/components/shop/CommerceJourney";
import { TrustStrip } from "@/components/shop/TrustStrip";

const CHAPTER_STRIP_LIMIT = 16;

export function ChapterHubPage() {
  const { chapterSlug } = useParams<{ chapterSlug: string }>();
  const chapter = chapterSlug ? getChapterBySlug(chapterSlug) : undefined;

  if (!chapter) {
    return (
      <main id="contenu-principal" className="collection-page collection-page--missing shop-shell">
        <p>Chapitre introuvable.</p>
        <Link to="/collection" className="cta cta--solid">
          Voir la collection
        </Link>
      </main>
    );
  }

  const characters = getCharactersForChapter(chapter.id);
  const chapterProducts = getProductsForChapter(chapter.id);
  const stripProducts = chapterProducts.slice(0, CHAPTER_STRIP_LIMIT);
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
          { label: "Collection", to: "/collection" },
          { label: `Ch. ${chapter.index} · ${chapter.name}`, current: true },
          { label: "Commander", to: `/boutique?chapitre=${chapter.id}` },
        ]}
      />

      <header className="collection-chapter-hub__hero collection-chapter-hub__hero--premium">
        <div className="collection-chapter-hub__hero-copy">
          <p className="collection-chapter-hub__folder">{chapter.sourceFolder}</p>
          <p className="collection-chapter-hub__index">Chapitre {chapter.index}</p>
          <h1>{chapter.name}</h1>
          {chapter.meaning ? <p className="collection-chapter-hub__meaning">{chapter.meaning}</p> : null}
          {chapter.intention ? (
            <p className="collection-chapter-hub__intention">{chapter.intention}</p>
          ) : null}
          {chapter.quote ? (
            <blockquote className="collection-chapter-hub__quote">&laquo;&nbsp;{chapter.quote}&nbsp;&raquo;</blockquote>
          ) : null}
          {characters.length > 0 ? (
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
              Choisissez un archétype
              {productTotal > 0 ? ` · ${productTotal} pièces` : ""}
            </h2>
            <p className="collection-cast__intro">
              Chaque archétype porte une pièce unique de ce chapitre. Sélectionnez, choisissez votre
              taille, commandez.
            </p>
          </div>
        </div>

        {characters.length === 0 ? (
          <p className="collection-cast__empty">{copy.collectionEmptyChapter}</p>
        ) : (
          <ul className="collection-cast__grid collection-cast__grid--shop">
            {characters.map((character) => {
              const products = getProductsForCharacter(chapter.id, character.slug);
              const firstProduct = products[0];
              const priceRange = getCharacterPriceRange(chapter.id, character.slug);
              return (
                <li key={character.id}>
                  <article className="cast-card cast-card--shop">
                    <Link to={`/collection/${chapter.slug}/${character.slug}`} className="cast-card__media-link">
                      <div className="cast-card__media">
                        <img src={character.cover} alt="" loading="lazy" />
                        <span className="cast-card__count">
                          {character.productCount} pièce{character.productCount > 1 ? "s" : ""}
                        </span>
                      </div>
                    </Link>
                    <div className="cast-card__body">
                      <h3>
                        <Link to={`/collection/${chapter.slug}/${character.slug}`}>{character.name}</Link>
                      </h3>
                      {priceRange ? (
                        <p className="cast-card__price">{formatPriceRange(priceRange.min, priceRange.max)}</p>
                      ) : null}
                      <div className="cast-card__actions">
                        <Link
                          to={`/collection/${chapter.slug}/${character.slug}`}
                          className="cta cta--ghost cast-card__btn"
                        >
                          Voir les pièces
                        </Link>
                        {firstProduct ? (
                          <Link to={`/boutique/${firstProduct.slug}`} className="cta cta--solid cast-card__btn">
                            Commander
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {stripProducts.length > 0 ? (
        <section className="chapter-shop-strip" aria-label="Pièces du chapitre">
          <h2 className="chapter-shop-strip__title">{copy.chapterShopCta}</h2>
          <ul className="chapter-shop-strip__list">
            {stripProducts.map((p) => (
              <li key={p.id}>
                <Link to={`/boutique/${p.slug}`} className="chapter-shop-strip__item">
                  <img src={p.coverImage || p.images[0]} alt="" loading="lazy" decoding="async" />
                  <span>
                    <b>{p.name}</b>
                    <em>{formatPriceXof(p.priceXof)} FCFA</em>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {chapterProducts.length > CHAPTER_STRIP_LIMIT ? (
            <Link to={`/boutique?chapitre=${chapter.id}`} className="chapter-shop-strip__more cta cta--ghost">
              Voir les {chapterProducts.length} pièces →
            </Link>
          ) : null}
        </section>
      ) : null}

      <TrustStrip />
    </main>
  );
}
