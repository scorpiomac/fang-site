import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { chapters as narrativeChapters } from "@/content/chapters";
import { getCharactersForChapter, collectionChapters } from "@/content/collectionCatalog";
import { getProductByCharacter } from "@/content/shop";
import { copy } from "@/content/copy";
import { formatPriceXof } from "@/content/shop";
import { useCmsText } from "@/context/CmsContext";

export const ChaptersSection = forwardRef<HTMLElement>(function ChaptersSection(_, ref) {
  const eyebrow = useCmsText("home.chapters.eyebrow", copy.chaptersEyebrow);
  const title = useCmsText("home.chapters.title", copy.chaptersTitle);
  const intro = useCmsText("home.chapters.intro", copy.chaptersIntro);
  return (
    <section
      ref={ref}
      className="chapters"
      id="collections"
      aria-labelledby="collections-title"
    >
      {/* Ancre héritée pour les anciens liens #chapitres */}
      <span id="chapitres" className="chapters__legacy-anchor" aria-hidden="true" />

      <div className="chapters__intro">
        <p className="chapters__eyebrow">{eyebrow}</p>
        <h2 className="chapters__title" id="collections-title">
          {title.split("\n").map((s, i) => (
            <span key={i} className="chapters__title-line">
              {s}
            </span>
          ))}
        </h2>
        <p className="chapters__lede">{intro}</p>
      </div>

      <div className="chapters__pin" data-chapters-pin>
        <div className="chapters__viewport">
          <div className="chapters__track" data-chapters-track>
            {collectionChapters.map((c, i) => {
              const characters = getCharactersForChapter(c.id);
              const isActive = characters.length > 0;
              const lore = narrativeChapters.find((n) => n.id === c.id);
              const fallbackImages = lore?.images ?? [];
              const heroChar = characters[0];
              const heroProduct = heroChar ? getProductByCharacter(c.id, heroChar.slug) : undefined;
              return (
                <article
                  key={c.id}
                  className="chapter-panel"
                  data-chapter-index={i}
                  style={
                    {
                      "--c1": c.palette[0],
                      "--c2": c.palette[1],
                      "--c3": c.palette[2],
                    } as React.CSSProperties
                  }
                >
                  <div className="chapter-panel__numbers">
                    <span className="chapter-panel__index">{c.index}</span>
                    <span className="chapter-panel__total">/ {String(collectionChapters.length).padStart(2, "0")}</span>
                  </div>

                  <header className="chapter-panel__head">
                    <div className="chapter-panel__teaser" aria-label="Aperçu du chapitre">
                      <div className="chapter-panel__teaser-row">
                        <span className="chapter-panel__badge">Chapitre {c.index}</span>
                        <span className="chapter-panel__char-label chapter-panel__char-label--inline">
                          {c.sourceFolder}
                        </span>
                      </div>
                      <p className="chapter-panel__role">{c.name}</p>
                      <div className="chapter-panel__story-links">
                        {isActive ? (
                          <Link to={`/collection/${c.slug}`} className="chapter-panel__universe-cta">
                            Personnages et produits
                            <span aria-hidden="true"> →</span>
                          </Link>
                        ) : null}
                        <Link to={`/collection/${c.slug}`} className="chapter-panel__boutique-cta">
                          Explorer le chapitre
                          <span aria-hidden="true"> →</span>
                        </Link>
                      </div>
                    </div>

                    <p className="chapter-panel__meaning">{c.meaning ?? ""}</p>
                    <h3 className="chapter-panel__name">{c.name}</h3>
                    <p className="chapter-panel__intent">{c.intention ?? ""}</p>
                    <ul className="chapter-panel__palette" aria-label="Palette">
                      {c.palette.map((p) => (
                        <li key={p} style={{ background: p }} />
                      ))}
                    </ul>
                    {heroProduct ? (
                      <Link to={`/boutique/${heroProduct.slug}`} className="chapter-panel__cta">
                        <span>
                          Voir une pièce — {heroChar?.name} · {formatPriceXof(heroProduct.priceXof)} FCFA
                        </span>
                        <span className="chapter-panel__cta-arrow" aria-hidden="true">→</span>
                      </Link>
                    ) : null}
                  </header>

                  <div className="chapter-panel__gallery">
                    <figure className="chapter-panel__hero chapter-panel__hero--poster">
                      {heroProduct && heroChar ? (
                        <Link
                          to={`/collection/${c.slug}/${heroChar.slug}`}
                          className="chapter-panel__img-link chapter-panel__img-link--hero"
                          tabIndex={-1}
                          aria-label={`Voir ${heroChar.name}`}
                        >
                          <img
                            src={c.coverImage || c.posterImage || heroChar.cover}
                            alt={`${heroChar.name} — ${c.name}`}
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="chapter-panel__poster-bar" aria-hidden="true">
                            <span className="chapter-panel__poster-name">{heroChar.name}</span>
                            <span className="chapter-panel__poster-role">{c.name}</span>
                          </div>
                          <div className="chapter-panel__img-overlay">
                            <p className="chapter-panel__overlay-excerpt">{heroProduct.excerpt}</p>
                            <div className="chapter-panel__overlay-foot">
                              <span className="chapter-panel__overlay-name">{heroProduct.name}</span>
                              <span className="chapter-panel__overlay-price">
                                {formatPriceXof(heroProduct.priceXof)} FCFA
                              </span>
                            </div>
                            <span className="chapter-panel__overlay-see">
                              Voir le personnage <span aria-hidden="true">→</span>
                            </span>
                          </div>
                        </Link>
                      ) : (
                        <>
                          <img
                            src={fallbackImages[0]}
                            alt={`${c.name} — chapitre`}
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="chapter-panel__poster-bar" aria-hidden="true">
                            <span className="chapter-panel__poster-name">{c.name}</span>
                            <span className="chapter-panel__poster-role">{c.role}</span>
                          </div>
                        </>
                      )}
                    </figure>

                    {[
                      { cls: "chapter-panel__detail--a", idx: 1 },
                      { cls: "chapter-panel__detail--b", idx: 2 },
                      { cls: "chapter-panel__detail--c", idx: 3 },
                      { cls: "chapter-panel__detail--d", idx: 4 },
                    ].map(({ cls, idx }) => (
                      <figure key={cls} className={`chapter-panel__detail ${cls}`}>
                        {heroChar && characters[idx + 1] ? (
                          <Link
                            to={`/collection/${c.slug}/${characters[idx + 1].slug}`}
                            className="chapter-panel__img-link"
                            tabIndex={-1}
                            aria-hidden="true"
                          >
                            <img src={characters[idx + 1].cover} alt="" loading="lazy" decoding="async" />
                          </Link>
                        ) : (
                          <img src={fallbackImages[idx]} alt="" loading="lazy" decoding="async" />
                        )}
                      </figure>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="chapters__progress" aria-hidden="true">
          <div className="chapters__progress-track">
            <div className="chapters__progress-bar" data-chapters-progress />
          </div>
          <ul className="chapters__progress-list">
            {collectionChapters.map((c, i) => (
              <li key={c.id} data-chapter-dot={i}>
                <span>{c.index}</span>
                <em>
                  <span className="chapters__progress-name">{c.name}</span>
                  <span className="chapters__progress-sub">collection</span>
                </em>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
});
