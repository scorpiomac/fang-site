import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { shopProducts, formatPriceXof } from "@/content/shop";
import { getChapterById } from "@/content/collectionCatalog";
import { useCmsText } from "@/context/CmsContext";
import { MediaImage } from "@/components/ui/MediaImage";

export function FeaturedPiecesSection() {
  const items = shopProducts.slice(0, 3);
  const eyebrow = useCmsText("home.featured.eyebrow", "Atelier — pièces phares");
  const title = useCmsText("home.featured.title", "Du chapitre au vêtement.");
  const tagline = useCmsText(
    "home.featured.tagline",
    "Des pièces tirées directement des archétypes présents dans la collection Saison 0 — Neel Fang."
  );

  if (items.length === 0) return null;

  return (
    <section
      className="featured-pieces"
      id="pieces-phares"
      aria-labelledby="featured-pieces-title"
    >
      <div className="featured-pieces__head">
        <p className="featured-pieces__eyebrow">{eyebrow}</p>
        <h2 className="featured-pieces__title" id="featured-pieces-title">
          {title}
        </h2>
        <p className="featured-pieces__lede">{tagline}</p>
        <Link to="/boutique" className="featured-pieces__see-all">
          Voir toute la boutique <span aria-hidden="true">→</span>
        </Link>
      </div>

      <ul className="featured-pieces__grid">
        {items.map((p) => {
          const chapter = getChapterById(p.chapterId);
          return (
            <li
              key={p.id}
              className="featured-card"
              style={
                chapter
                  ? ({
                      "--p1": chapter.palette[0],
                      "--p2": chapter.palette[1],
                      "--p3": chapter.palette[2],
                    } as CSSProperties)
                  : undefined
              }
            >
              <Link to={`/boutique/${p.slug}`} className="featured-card__link">
                <figure className="featured-card__media">
                  <MediaImage
                    src={p.coverImage || p.images[0]}
                    fallbacks={p.images}
                    alt=""
                    loading="lazy"
                  />
                </figure>
                <div className="featured-card__body">
                  <p className="featured-card__chapter">{p.chapterLabel}</p>
                  <h3 className="featured-card__name">{p.name}</h3>
                  <p className="featured-card__excerpt">{p.excerpt}</p>
                  <p className="featured-card__price">{formatPriceXof(p.priceXof)} FCFA</p>
                </div>
              </Link>
              {chapter ? (
                <Link
                  to={`/collection/${chapter.slug}/${p.characterSlug}`}
                  className="featured-card__character"
                >
                  {p.characterName} · voir l’archétype
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
