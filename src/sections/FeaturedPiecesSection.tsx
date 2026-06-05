import { Link } from "react-router-dom";
import { shopProducts, formatPriceXof } from "@/content/shop";
import { getChapterById } from "@/content/chapters";

const FEATURED_SLUGS = ["veste-tambali", "ensemble-passage", "manteau-feu"] as const;

export function FeaturedPiecesSection() {
  const items = FEATURED_SLUGS
    .map((slug) => shopProducts.find((p) => p.slug === slug))
    .filter((p): p is (typeof shopProducts)[number] => Boolean(p));

  if (items.length === 0) return null;

  return (
    <section
      className="featured-pieces"
      id="pieces-phares"
      aria-labelledby="featured-pieces-title"
    >
      <div className="featured-pieces__head">
        <p className="featured-pieces__eyebrow">Atelier — pièces phares</p>
        <h2 className="featured-pieces__title" id="featured-pieces-title">
          Du récit au vêtement.
        </h2>
        <p className="featured-pieces__lede">
          Trois pièces choisies parmi les sept silhouettes — chacune incarne un personnage et
          se commande à l’atelier de Dakar.
        </p>
        <Link to="/boutique" className="featured-pieces__see-all">
          Voir les sept pièces <span aria-hidden="true">→</span>
        </Link>
      </div>

      <ul className="featured-pieces__grid">
        {items.map((p, i) => {
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
                    } as React.CSSProperties)
                  : undefined
              }
            >
              <Link to={`/boutique/${p.slug}`} className="featured-card__media">
                <span className="featured-card__index" aria-hidden="true">
                  0{i + 1}
                </span>
                <img src={p.images[0]} alt="" loading="lazy" />
                {p.images[1] ? (
                  <img
                    src={p.images[1]}
                    alt=""
                    loading="lazy"
                    aria-hidden="true"
                    className="featured-card__media-hover"
                  />
                ) : null}
                <div className="featured-card__scrim" aria-hidden="true" />
              </Link>

              <div className="featured-card__body">
                <p className="featured-card__chapter">
                  {chapter ? `${chapter.characterLabel} — ${chapter.name}` : p.chapterLabel}
                </p>
                <h3 className="featured-card__name">{p.name}</h3>
                <p className="featured-card__excerpt">{p.excerpt}</p>
                <p className="featured-card__price">
                  {formatPriceXof(p.priceXof)} <span>FCFA</span>
                </p>
                <div className="featured-card__actions">
                  <Link to={`/boutique/${p.slug}`} className="featured-card__cta">
                    Voir la pièce <span aria-hidden="true">→</span>
                  </Link>
                  {chapter ? (
                    <Link
                      to={`/personnages/${chapter.slug}`}
                      className="featured-card__cta featured-card__cta--ghost"
                    >
                      Son histoire
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
