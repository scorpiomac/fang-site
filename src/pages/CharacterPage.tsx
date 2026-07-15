import type { CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { getChapterBySlug, getCharacter } from "@/content/collectionCatalog";
import {
  formatPriceRange,
  formatPriceXof,
  getCharacterPriceRange,
  getProductsForCharacter,
} from "@/content/shop";
import { copy } from "@/content/copy";
import { CommerceJourney } from "@/components/shop/CommerceJourney";
import { GlossedTerm } from "@/components/ui/GlossedTerm";

export function CharacterPage() {
  const { chapterSlug, characterSlug } = useParams<{ chapterSlug: string; characterSlug: string }>();
  const chapter = chapterSlug ? getChapterBySlug(chapterSlug) : undefined;
  const character =
    chapter && characterSlug ? getCharacter(chapter.id, characterSlug) : undefined;
  const products =
    chapter && character ? getProductsForCharacter(chapter.id, character.slug) : [];
  const priceRange =
    chapter && character ? getCharacterPriceRange(chapter.id, character.slug) : null;

  if (!chapter || !character) {
    return (
      <main id="contenu-principal" className="collection-page collection-page--missing shop-shell">
        <p>Archétype introuvable dans cette collection.</p>
        <Link to="/collection" className="cta cta--solid">
          Voir la collection
        </Link>
      </main>
    );
  }

  return (
    <main
      id="contenu-principal"
      className="collection-page character-commerce shop-shell commerce-shell"
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
          { label: chapter.name, to: `/collection/${chapter.slug}` },
          { label: character.name, current: true },
        ]}
      />

      <header className="character-commerce__intro">
        <p className="character-commerce__eyebrow">
          Ch. {chapter.index} · {chapter.name}
        </p>
        <h1 className="character-commerce__name">
          <GlossedTerm term={character.name} focusable />
        </h1>
        <p className="character-commerce__sub">
          {products.length} pièce{products.length > 1 ? "s" : ""}
          {priceRange ? <> · {formatPriceRange(priceRange.min, priceRange.max)}</> : null}
        </p>
        {chapter.quote ? (
          <blockquote className="character-commerce__quote">&laquo;&nbsp;{chapter.quote}&nbsp;&raquo;</blockquote>
        ) : null}
      </header>

      {products.length === 0 ? (
        <p className="collection-cast__empty">{copy.collectionEmptyChapter}</p>
      ) : (
        <ul className="character-pieces-grid" aria-label="Pièces de l’archétype">
          {products.map((product) => (
            <li key={product.id}>
              <Link to={`/boutique/${product.slug}`} className="character-piece-card">
                <figure className="character-piece-card__media">
                  <img src={product.coverImage} alt={product.name} loading="lazy" />
                </figure>
                <div className="character-piece-card__body">
                  {product.pieceLabel ? (
                    <p className="character-piece-card__label">{product.pieceLabel}</p>
                  ) : null}
                  <h2 className="character-piece-card__name">{product.name}</h2>
                  <p className="character-piece-card__price">{formatPriceXof(product.priceXof)} FCFA</p>
                  <span className="character-piece-card__cta">Voir la pièce →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link to={`/collection/${chapter.slug}`} className="character-commerce__back cta cta--ghost">
        ← Tous les archétypes
      </Link>
    </main>
  );
}

export { CharacterPage as CastGalleryPage };
