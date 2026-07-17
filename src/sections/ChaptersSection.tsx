import { forwardRef, useCallback, useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { chapters as narrativeChapters } from "@/content/chapters";
import {
  getCharactersForChapter,
  collectionChapters,
  getChapterGalleryImage,
  getChapterHeroImage,
  getChapterVisualFallbacks,
  type CollectionChapter,
} from "@/content/collectionCatalog";
import { getHomeChapterProducts } from "@/content/homeChapterGallery";
import { formatPriceXof, type ShopProduct } from "@/content/shop";
import { copy } from "@/content/copy";
import { useCmsText } from "@/context/CmsContext";
import { MediaImage } from "@/components/ui/MediaImage";
import { GlossedTerm } from "@/components/ui/GlossedTerm";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useScenePhase } from "@/context/useScenePhase";
import type { Chapter } from "@/content/chapters";

const narrativeById = new Map(narrativeChapters.map((n) => [n.id, n]));
const DEFILE_MS = 5500;

type ChapterPanelData = {
  chapter: CollectionChapter;
  characters: ReturnType<typeof getCharactersForChapter>;
  lore: Chapter | undefined;
  visualImages: string[];
  chapterProducts: ShopProduct[];
};

const chapterPanelData: ChapterPanelData[] = collectionChapters.map((c) => {
  const lore = narrativeById.get(c.id);
  return {
    chapter: c,
    characters: getCharactersForChapter(c.id),
    lore,
    visualImages: getChapterVisualFallbacks(c, lore?.images ?? []),
    chapterProducts: getHomeChapterProducts(c.id),
  };
});

export const ChaptersSection = forwardRef<HTMLElement>(function ChaptersSection(_, ref) {
  const eyebrow = useCmsText("home.chapters.eyebrow", copy.chaptersEyebrow);
  const title = useCmsText("home.chapters.title", copy.chaptersTitle);
  const intro = useCmsText("home.chapters.intro", copy.chaptersIntro);
  const titleId = useId();
  const reduced = useReducedMotion();
  const { scrollRef } = useScenePhase();
  const count = chapterPanelData.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      setActive(((index % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    scrollRef.current.chapterIndex = active;
    scrollRef.current.chapter = count > 1 ? active / (count - 1) : 0;
  }, [active, count, scrollRef]);

  useEffect(() => {
    if (reduced || paused || count < 2) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % count);
    }, DEFILE_MS);
    return () => window.clearInterval(id);
  }, [count, paused, reduced]);

  const progress = count > 0 ? (active + 1) / count : 0;

  return (
    <section
      ref={ref}
      className="chapters chapters--defile"
      id="collections"
      aria-labelledby={titleId}
    >
      <span id="chapitres" className="chapters__legacy-anchor" aria-hidden="true" />

      <div className="chapters__intro">
        <p className="chapters__eyebrow">{eyebrow}</p>
        <h2 className="chapters__title" id={titleId}>
          {title.split("\n").map((s, i) => (
            <span key={i} className="chapters__title-line">
              {s.trim().replace(/\s+/g, " ")}
            </span>
          ))}
        </h2>
        <p className="chapters__lede">{intro}</p>
      </div>

      <div
        className="chapters__pin"
        data-chapters-pin
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
        }}
      >
        <div className="chapters__viewport" aria-live="polite">
          <div
            className="chapters__track"
            data-chapters-track
            style={{ transform: `translate3d(-${active * 100}%, 0, 0)` }}
          >
            {chapterPanelData.map(({ chapter: c, characters, visualImages, chapterProducts }, i) => {
              const isActive = characters.length > 0;
              const heroProduct = chapterProducts[0];
              const heroChar = heroProduct
                ? characters.find((ch) => ch.slug === heroProduct.characterSlug) ?? characters[0]
                : characters[0];
              const isCurrent = i === active;
              return (
                <article
                  key={c.id}
                  className={`chapter-panel${isCurrent ? " is-current" : ""}`}
                  data-chapter-index={i}
                  aria-hidden={!isCurrent}
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
                    <span className="chapter-panel__total">
                      / {String(collectionChapters.length).padStart(2, "0")}
                    </span>
                  </div>

                  <header className="chapter-panel__head">
                    <div className="chapter-panel__teaser" aria-label="Aperçu du chapitre">
                      <div className="chapter-panel__teaser-row">
                        <span className="chapter-panel__badge">Chapitre {c.index}</span>
                      </div>
                      <p className="chapter-panel__role">{c.name}</p>
                      <div className="chapter-panel__story-links">
                        {isActive ? (
                          <Link to={`/collection/${c.slug}`} className="chapter-panel__universe-cta" tabIndex={isCurrent ? 0 : -1}>
                            Archétypes et produits
                            <span aria-hidden="true"> →</span>
                          </Link>
                        ) : null}
                        <Link to={`/collection/${c.slug}`} className="chapter-panel__boutique-cta" tabIndex={isCurrent ? 0 : -1}>
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
                      <Link to={`/boutique/${heroProduct.slug}`} className="chapter-panel__cta" tabIndex={isCurrent ? 0 : -1}>
                        <span>
                          Voir une pièce —{" "}
                          {heroChar ? <GlossedTerm term={heroChar.name} /> : null} ·{" "}
                          {formatPriceXof(heroProduct.priceXof)} FCFA
                        </span>
                        <span className="chapter-panel__cta-arrow" aria-hidden="true">
                          →
                        </span>
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
                          <MediaImage
                            src={heroProduct.coverImage || getChapterHeroImage(c, heroChar, visualImages[0])}
                            fallbacks={[heroProduct.coverImage, heroChar?.cover, ...visualImages]}
                            alt={`${heroChar.name} — ${c.name}`}
                            loading={isCurrent ? "eager" : "lazy"}
                            decoding="async"
                          />
                          <div className="chapter-panel__poster-bar" aria-hidden="true">
                            <span className="chapter-panel__poster-name">
                              <GlossedTerm term={heroChar.name} />
                            </span>
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
                              Voir l&apos;archétype <span aria-hidden="true">→</span>
                            </span>
                          </div>
                        </Link>
                      ) : (
                        <>
                          <MediaImage
                            src={visualImages[0]}
                            fallbacks={visualImages.slice(1)}
                            alt={`${c.name} — chapitre`}
                            loading={isCurrent ? "eager" : "lazy"}
                            decoding="async"
                          />
                          <div className="chapter-panel__poster-bar" aria-hidden="true">
                            <span className="chapter-panel__poster-name">
                              {heroChar ? <GlossedTerm term={heroChar.name} /> : c.name}
                            </span>
                            <span className="chapter-panel__poster-role">
                              {heroChar ? c.name : c.role}
                            </span>
                          </div>
                        </>
                      )}
                    </figure>

                    {[
                      { cls: "chapter-panel__detail--a", idx: 1 },
                      { cls: "chapter-panel__detail--b", idx: 2 },
                      { cls: "chapter-panel__detail--c", idx: 3 },
                      { cls: "chapter-panel__detail--d", idx: 4 },
                    ].map(({ cls, idx }) => {
                      const detailProduct = chapterProducts[idx];
                      const detailChar = detailProduct
                        ? characters.find((ch) => ch.slug === detailProduct.characterSlug)
                        : characters[idx];
                      return (
                        <figure key={cls} className={`chapter-panel__detail ${cls}`}>
                          {detailProduct ? (
                            <Link
                              to={`/boutique/${detailProduct.slug}`}
                              className="chapter-panel__img-link"
                              aria-label={`Voir ${detailProduct.name}`}
                              tabIndex={isCurrent ? 0 : -1}
                            >
                              <MediaImage
                                src={detailProduct.coverImage}
                                fallbacks={visualImages}
                                alt={`${detailProduct.name} — ${c.name}`}
                                loading="lazy"
                                decoding="async"
                              />
                              <div className="chapter-panel__poster-bar" aria-hidden="true">
                                <span className="chapter-panel__poster-name">{detailProduct.name}</span>
                                <span className="chapter-panel__poster-role">
                                  {detailChar ? <GlossedTerm term={detailChar.name} /> : c.name}
                                </span>
                              </div>
                            </Link>
                          ) : detailChar ? (
                            <Link
                              to={`/collection/${c.slug}/${detailChar.slug}`}
                              className="chapter-panel__img-link"
                              aria-label={`Voir ${detailChar.name}`}
                              tabIndex={isCurrent ? 0 : -1}
                            >
                              <MediaImage
                                src={getChapterGalleryImage(c, detailChar, idx - 1, visualImages)}
                                fallbacks={visualImages}
                                alt={`${detailChar.name} — ${c.name}`}
                                loading="lazy"
                                decoding="async"
                              />
                              <div className="chapter-panel__poster-bar" aria-hidden="true">
                                <span className="chapter-panel__poster-name">
                                  <GlossedTerm term={detailChar.name} />
                                </span>
                                <span className="chapter-panel__poster-role">{c.name}</span>
                              </div>
                            </Link>
                          ) : (
                            <MediaImage
                              src={getChapterGalleryImage(c, undefined, idx - 1, visualImages)}
                              fallbacks={visualImages}
                              alt=""
                              loading="lazy"
                              decoding="async"
                            />
                          )}
                        </figure>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="chapters__controls">
          <button
            type="button"
            className="chapters__nav-btn"
            onClick={() => goTo(active - 1)}
            aria-label="Chapitre précédent"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </button>
          <p className="chapters__defile-label" aria-hidden="true">
            Défilé
          </p>
          <button
            type="button"
            className="chapters__nav-btn"
            onClick={() => goTo(active + 1)}
            aria-label="Chapitre suivant"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </button>
        </div>

        <div
          className="chapters__progress"
          style={{ "--chapter-count": collectionChapters.length } as React.CSSProperties}
        >
          <div className="chapters__progress-track">
            <div
              className="chapters__progress-bar"
              data-chapters-progress
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>
          <ul className="chapters__progress-list" role="tablist" aria-label="Chapitres">
            {collectionChapters.map((c, i) => (
              <li key={c.id} className={i === active ? "is-active" : undefined}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={`Chapitre ${c.index} — ${c.name}`}
                  title={c.name}
                  onClick={() => goTo(i)}
                >
                  <span>{c.index}</span>
                  <em>
                    <span className="chapters__progress-name">{c.name}</span>
                    <span className="chapters__progress-sub">collection</span>
                  </em>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
});
