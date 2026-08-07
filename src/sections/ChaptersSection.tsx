import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
} from "react";
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
import { getProductsForCharacter, type ShopProduct } from "@/content/shop";
import { copy } from "@/content/copy";
import { useCmsText } from "@/context/CmsContext";
import { MediaImage } from "@/components/ui/MediaImage";
import { GlossedTerm } from "@/components/ui/GlossedTerm";
import { useScenePhase } from "@/context/useScenePhase";
import type { Chapter } from "@/content/chapters";

const narrativeById = new Map(narrativeChapters.map((n) => [n.id, n]));

type CharacterColumn = {
  character: ReturnType<typeof getCharactersForChapter>[number];
  products: ShopProduct[];
};

type ChapterPanelData = {
  chapter: CollectionChapter;
  characters: ReturnType<typeof getCharactersForChapter>;
  lore: Chapter | undefined;
  visualImages: string[];
  columns: CharacterColumn[];
};

const COLUMNS_PER_CHAPTER = 4;

function productsPerColumn(columnCount: number): number {
  if (columnCount <= 1) return 6;
  if (columnCount === 2) return 4;
  return 3;
}

const chapterPanelData: ChapterPanelData[] = collectionChapters.map((c) => {
  const lore = narrativeById.get(c.id);
  const characters = getCharactersForChapter(c.id);
  const rawColumns = characters
    .map((character) => ({
      character,
      products: getProductsForCharacter(c.id, character.slug),
    }))
    .filter((col) => col.products.length > 0 || Boolean(col.character.cover))
    .slice(0, COLUMNS_PER_CHAPTER);

  const perCol = productsPerColumn(Math.max(1, rawColumns.length));
  const columns = rawColumns.map((col) => ({
    ...col,
    products: col.products.slice(0, perCol),
  }));

  return {
    chapter: c,
    characters,
    lore,
    visualImages: getChapterVisualFallbacks(c, lore?.images ?? []),
    columns,
  };
});

export const ChaptersSection = forwardRef<HTMLElement>(function ChaptersSection(_, ref) {
  const eyebrow = useCmsText("home.chapters.eyebrow", copy.chaptersEyebrow);
  const title = useCmsText("home.chapters.title", copy.chaptersTitle);
  const intro = useCmsText("home.chapters.intro", copy.chaptersIntro);
  const titleId = useId();
  const { scrollRef } = useScenePhase();
  const localRef = useRef<HTMLElement | null>(null);
  const count = chapterPanelData.length;
  const [active, setActive] = useState(0);
  const [piecePreview, setPiecePreview] = useState<{
    src: string;
    alt: string;
    label: string;
    href: string;
  } | null>(null);

  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      localRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as MutableRefObject<HTMLElement | null>).current = node;
    },
    [ref]
  );

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      setPiecePreview(null);
      setActive(((index % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    scrollRef.current.chapterIndex = active;
    scrollRef.current.chapter = count > 1 ? active / (count - 1) : 0;
  }, [active, count, scrollRef]);

  useEffect(() => {
    setPiecePreview(null);
  }, [active]);

  const progress = count > 0 ? (active + 1) / count : 0;

  return (
    <section
      ref={setRefs}
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

      <div className="chapters__pin" data-chapters-pin>
        <div className="chapters__viewport" aria-live="polite">
          <div
            className="chapters__track"
            data-chapters-track
            style={{ transform: `translate3d(-${active * 100}%, 0, 0)` }}
          >
            {chapterPanelData.map(({ chapter: c, visualImages, columns }, i) => {
              const isCurrent = i === active;

              return (
                <article
                  key={c.id}
                  className={`chapter-panel${isCurrent ? " is-current" : ""}`}
                  data-chapter-index={i}
                  data-gallery-cols={columns.length}
                  aria-hidden={!isCurrent}
                  style={
                    {
                      "--c1": c.palette[0],
                      "--c2": c.palette[1],
                      "--c3": c.palette[2],
                      "--gallery-cols": Math.max(1, columns.length),
                    } as CSSProperties
                  }
                >
                  <header className="chapter-panel__head">
                    {c.meaning ? <p className="chapter-panel__meaning">{c.meaning}</p> : null}
                    <h3 className="chapter-panel__name">{c.name}</h3>
                    {c.intention ? <p className="chapter-panel__intent">{c.intention}</p> : null}
                    <ul className="chapter-panel__palette" aria-label="Palette">
                      {c.palette.map((p) => (
                        <li key={p} style={{ background: p }} />
                      ))}
                    </ul>
                    <Link to={`/collection/${c.slug}`} className="chapter-panel__cta" tabIndex={isCurrent ? 0 : -1}>
                      <span className="chapter-panel__cta-label">Explorer le chapitre</span>
                      <span className="chapter-panel__cta-arrow" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </header>

                  <div
                    className={`chapter-panel__gallery chapter-panel__gallery--columns${
                      columns.length === 1 ? " chapter-panel__gallery--sparse" : ""
                    }${columns.length === 2 ? " chapter-panel__gallery--pair" : ""}${
                      isCurrent && piecePreview ? " is-previewing" : ""
                    }`}
                    aria-label={`Catégories — ${c.name}`}
                    onMouseLeave={() => {
                      if (isCurrent) setPiecePreview(null);
                    }}
                    onBlur={(e) => {
                      if (!isCurrent) return;
                      const next = e.relatedTarget as Node | null;
                      if (!e.currentTarget.contains(next)) setPiecePreview(null);
                    }}
                  >
                    {columns.map(({ character, products }, colIdx) => {
                      const images =
                        products.length > 0
                          ? products.map((product) => ({
                              key: product.slug,
                              href: `/boutique/${product.slug}`,
                              src: product.coverImage,
                              alt: `${product.name} — ${character.name}`,
                              label: product.name,
                            }))
                          : [
                              {
                                key: character.slug,
                                href: `/collection/${c.slug}/${character.slug}`,
                                src:
                                  character.cover ||
                                  getChapterGalleryImage(c, character, 0, visualImages) ||
                                  getChapterHeroImage(c, character, visualImages[0]),
                                alt: `${character.name} — ${c.name}`,
                                label: character.name,
                              },
                            ];

                      return (
                        <div key={character.id} className="chapter-panel__cat">
                          <h4 className="chapter-panel__cat-title">
                            <Link
                              to={`/collection/${c.slug}/${character.slug}`}
                              tabIndex={isCurrent ? 0 : -1}
                            >
                              <GlossedTerm term={character.name} />
                            </Link>
                          </h4>
                          <div className="chapter-panel__cat-stack">
                            {images.map((item, imgIdx) => (
                              <figure key={item.key} className="chapter-panel__card">
                                <Link
                                  to={item.href}
                                  className="chapter-panel__img-link"
                                  aria-label={`Voir ${item.label}`}
                                  tabIndex={isCurrent ? 0 : -1}
                                  onMouseEnter={() => {
                                    if (!isCurrent) return;
                                    setPiecePreview({
                                      src: item.src,
                                      alt: item.alt,
                                      label: item.label,
                                      href: item.href,
                                    });
                                  }}
                                  onFocus={() => {
                                    if (!isCurrent) return;
                                    setPiecePreview({
                                      src: item.src,
                                      alt: item.alt,
                                      label: item.label,
                                      href: item.href,
                                    });
                                  }}
                                >
                                  <MediaImage
                                    src={item.src}
                                    fallbacks={[character.cover, ...visualImages].filter(Boolean) as string[]}
                                    alt={item.alt}
                                    loading={isCurrent && colIdx === 0 && imgIdx === 0 ? "eager" : "lazy"}
                                    decoding="async"
                                  />
                                  <span className="chapter-panel__piece-name">{item.label}</span>
                                </Link>
                              </figure>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {isCurrent && piecePreview ? (
                      <Link
                        to={piecePreview.href}
                        className="chapter-panel__full-preview"
                        tabIndex={-1}
                        aria-label={`${piecePreview.label} — vue entière`}
                      >
                        <MediaImage
                          src={piecePreview.src}
                          alt={piecePreview.alt}
                          loading="eager"
                          decoding="async"
                        />
                        <span className="chapter-panel__full-preview-name">{piecePreview.label}</span>
                      </Link>
                    ) : null}
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
          style={{ "--chapter-count": collectionChapters.length } as CSSProperties}
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
                    <span className="chapters__progress-sub">Boutique</span>
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
