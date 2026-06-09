import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getChapterBySlug, getCharacter } from "@/content/collectionCatalog";
import { getProductByCharacter } from "@/content/shop";
import { copy } from "@/content/copy";
import { CommerceJourney } from "@/components/shop/CommerceJourney";
import { QuickBuyPanel } from "@/components/shop/QuickBuyPanel";
import { StickyBuyBar } from "@/components/shop/StickyBuyBar";

export function CharacterPage() {
  const { chapterSlug, characterSlug } = useParams<{ chapterSlug: string; characterSlug: string }>();
  const chapter = chapterSlug ? getChapterBySlug(chapterSlug) : undefined;
  const character =
    chapter && characterSlug ? getCharacter(chapter.id, characterSlug) : undefined;
  const [active, setActive] = useState(0);

  const images = useMemo(() => character?.images ?? [], [character]);
  const product = chapter && character ? getProductByCharacter(chapter.id, character.slug) : undefined;

  if (!chapter || !character) {
    return (
      <main id="contenu-principal" className="collection-page collection-page--missing shop-shell">
        <p>Personnage introuvable dans cette collection.</p>
        <Link to="/collection" className="cta cta--solid">
          Voir la collection
        </Link>
      </main>
    );
  }

  const main = images[active] ?? character.cover;

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

      <div className="character-commerce__grid">
        <div className="character-commerce__gallery">
          <figure className="cast-gallery__main cast-gallery__main--premium">
            <img src={main} alt={`${character.name} — ${chapter.name}`} />
          </figure>

          {images.length > 1 ? (
            <ul className="cast-gallery__thumbs cast-gallery__thumbs--film" aria-label="Looks du personnage">
              {images.map((src, i) => (
                <li key={src}>
                  <button
                    type="button"
                    className={i === active ? "is-active" : undefined}
                    onClick={() => setActive(i)}
                    aria-label={`Look ${i + 1}`}
                  >
                    <img src={src} alt="" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <aside className="character-commerce__buy">
          <p className="character-commerce__eyebrow">
            Ch. {chapter.index} · {chapter.name}
          </p>
          <h1 className="character-commerce__name">{character.name}</h1>
          <p className="character-commerce__sub">
            {images.length} look{images.length > 1 ? "s" : ""} · {copy.collectionPersonnagesLabel} FANG
          </p>
          {chapter.quote ? (
            <blockquote className="character-commerce__quote">&laquo;&nbsp;{chapter.quote}&nbsp;&raquo;</blockquote>
          ) : null}

          {product ? (
            <QuickBuyPanel
              product={product}
              kicker={`Pièce · ${character.name}`}
            />
          ) : (
            <p className="collection-cast__empty">{copy.collectionEmptyChapter}</p>
          )}

          <Link to={`/collection/${chapter.slug}`} className="character-commerce__back cta cta--ghost">
            ← Tous les personnages
          </Link>
        </aside>
      </div>

      {product ? <StickyBuyBar product={product} /> : null}
    </main>
  );
}

export { CharacterPage as CastGalleryPage };
