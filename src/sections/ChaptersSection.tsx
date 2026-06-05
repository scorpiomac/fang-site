import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { chapters } from "@/content/chapters";
import { copy } from "@/content/copy";
import { shopProducts, formatPriceXof } from "@/content/shop";

export const ChaptersSection = forwardRef<HTMLElement>(function ChaptersSection(_, ref) {
  return (
    <section
      ref={ref}
      className="chapters"
      id="personnages"
      aria-labelledby="personnages-title"
    >
      {/* Ancre héritée pour les anciens liens #chapitres */}
      <span id="chapitres" className="chapters__legacy-anchor" aria-hidden="true" />

      <div className="chapters__intro">
        <p className="chapters__eyebrow">{copy.chaptersEyebrow}</p>
        <h2 className="chapters__title" id="personnages-title">
          {copy.chaptersTitle.split("\n").map((s, i) => (
            <span key={i} className="chapters__title-line">
              {s}
            </span>
          ))}
        </h2>
        <p className="chapters__lede">{copy.chaptersIntro}</p>
      </div>

      <div className="chapters__pin" data-chapters-pin>
        <div className="chapters__viewport">
          <div className="chapters__track" data-chapters-track>
            {chapters.map((c, i) => {
              const product = shopProducts.find((p) => p.chapterId === c.id);
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
                    <span className="chapter-panel__total">/ 07</span>
                  </div>

                  <header className="chapter-panel__head">
                    <div className="chapter-panel__teaser" aria-label="Aperçu du personnage">
                      <div className="chapter-panel__teaser-row">
                        <span className="chapter-panel__badge">Personnage</span>
                        <span className="chapter-panel__char-label chapter-panel__char-label--inline">
                          {c.characterLabel}
                        </span>
                      </div>
                      <p className="chapter-panel__role">{c.role}</p>
                      <div className="chapter-panel__story-links">
                        <Link to={`/personnages/${c.slug}`} className="chapter-panel__universe-cta">
                          Son univers — détails et galerie
                          <span aria-hidden="true"> →</span>
                        </Link>
                        {product ? (
                          <Link to={`/boutique?personnage=${c.id}`} className="chapter-panel__boutique-cta">
                            {copy.chapterPanelBoutiqueFilter}
                            <span aria-hidden="true"> →</span>
                          </Link>
                        ) : null}
                      </div>
                    </div>

                    <p className="chapter-panel__meaning">{c.meaning}</p>
                    <h3 className="chapter-panel__name">{c.name}</h3>
                    <p className="chapter-panel__intent">{c.intention}</p>
                    <ul className="chapter-panel__palette" aria-label="Palette">
                      {c.palette.map((p) => (
                        <li key={p} style={{ background: p }} />
                      ))}
                    </ul>
                    {product ? (
                      <Link to={`/boutique/${product.slug}`} className="chapter-panel__cta">
                        <span>Voir la pièce — {product.name}</span>
                        <span className="chapter-panel__cta-arrow" aria-hidden="true">→</span>
                      </Link>
                    ) : null}
                  </header>

                  <div className="chapter-panel__gallery">
                    <figure className="chapter-panel__hero chapter-panel__hero--poster">
                      {product ? (
                        <Link
                          to={`/boutique/${product.slug}`}
                          className="chapter-panel__img-link chapter-panel__img-link--hero"
                          tabIndex={-1}
                          aria-label={`Voir ${product.name}`}
                        >
                          <img
                            src={c.images[0]}
                            alt={`${c.name} — portrait`}
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="chapter-panel__poster-bar" aria-hidden="true">
                            <span className="chapter-panel__poster-name">{c.name}</span>
                            <span className="chapter-panel__poster-role">{c.role}</span>
                          </div>
                          <div className="chapter-panel__img-overlay">
                            <p className="chapter-panel__overlay-excerpt">{product.excerpt}</p>
                            <div className="chapter-panel__overlay-foot">
                              <span className="chapter-panel__overlay-name">{product.name}</span>
                              <span className="chapter-panel__overlay-price">
                                {formatPriceXof(product.priceXof)} FCFA
                              </span>
                            </div>
                            <span className="chapter-panel__overlay-see">
                              Voir la pièce <span aria-hidden="true">→</span>
                            </span>
                          </div>
                        </Link>
                      ) : (
                        <>
                          <img
                            src={c.images[0]}
                            alt={`${c.name} — portrait`}
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
                        {product ? (
                          <Link
                            to={`/boutique/${product.slug}`}
                            className="chapter-panel__img-link"
                            tabIndex={-1}
                            aria-hidden="true"
                          >
                            <img src={c.images[idx]} alt="" loading="lazy" decoding="async" />
                          </Link>
                        ) : (
                          <img src={c.images[idx]} alt="" loading="lazy" decoding="async" />
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
            {chapters.map((c, i) => (
              <li key={c.id} data-chapter-dot={i}>
                <span>{c.index}</span>
                <em>
                  <span className="chapters__progress-name">{c.name}</span>
                  <span className="chapters__progress-sub">personnage</span>
                </em>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
});
