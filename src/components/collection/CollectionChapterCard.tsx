import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { CollectionChapter, CollectionCharacter } from "@/content/collectionCatalog";
import { formatPriceXof } from "@/content/shop";
import { copy } from "@/content/copy";
import { GlossedTerm } from "@/components/ui/GlossedTerm";

type HighlightIcon = "star" | "cube" | "users" | "shield";

const HIGHLIGHT_ICONS: HighlightIcon[] = ["star", "cube", "users", "shield"];

function HighlightIconMark({ name }: { name: HighlightIcon }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "star":
      return (
        <svg {...common}>
          <path d="M12 3.5 14.2 9l5.8.5-4.4 3.8 1.4 5.7L12 16.8 6.9 19l1.4-5.7L4 9.5 9.8 9 12 3.5Z" />
        </svg>
      );
    case "cube":
      return (
        <svg {...common}>
          <path d="M12 3 20 7.5v9L12 21 4 16.5v-9L12 3Z" />
          <path d="M12 12 20 7.5M12 12 4 7.5M12 12v9" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="9" r="3" />
          <circle cx="17" cy="10" r="2.5" />
          <path d="M4 19c0-3 2.2-5 5-5s5 2 5 5M14 19c0-2.2 1.6-4 3.5-4.5" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3 19 6v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z" />
          <path d="M9.5 12 11 13.5 14.5 10" />
        </svg>
      );
    default:
      return null;
  }
}

type Props = {
  chapter: CollectionChapter;
  characters: CollectionCharacter[];
  cover: string | null;
  minPrice: number | null;
  productTotal: number;
};

export function CollectionChapterCard({
  chapter,
  characters,
  cover,
  minPrice,
  productTotal,
}: Props) {
  const chapterNum = parseInt(chapter.index, 10);
  const isEmpty = characters.length === 0;

  return (
    <article
      className={`chapter-showcase${isEmpty ? " chapter-showcase--empty" : ""}`}
      style={
        {
          "--c1": chapter.palette[0],
          "--c2": chapter.palette[1],
          "--c3": chapter.palette[2],
        } as CSSProperties
      }
    >
      <Link to={`/collection/${chapter.slug}`} className="chapter-showcase__visual">
        {cover ? <img src={cover} alt="" loading="lazy" /> : null}
        {!cover ? (
          <span className="chapter-showcase__visual-placeholder">{chapter.index}</span>
        ) : null}
        <div className="chapter-showcase__visual-scrim" aria-hidden="true" />
        <div className="chapter-showcase__visual-caption">
          <span className="chapter-showcase__visual-line" aria-hidden="true" />
          <p className="chapter-showcase__visual-title">
            Ch. {chapter.index} — {chapter.name}
          </p>
          {chapter.meaning ? (
            <p className="chapter-showcase__visual-meaning">{chapter.meaning}</p>
          ) : null}
        </div>
      </Link>

      <div className="chapter-showcase__panel">
        <span className="chapter-showcase__watermark" aria-hidden="true">
          {chapter.index}
        </span>

        <header className="chapter-showcase__head">
          <p className="chapter-showcase__eyebrow">Chapitre {chapterNum}</p>
          <h2 className="chapter-showcase__name">{chapter.name}</h2>
          {chapter.meaning ? (
            <p className="chapter-showcase__meaning">{chapter.meaning}</p>
          ) : null}
          <span className="chapter-showcase__divider" aria-hidden="true" />
        </header>

        {!isEmpty ? (
          <>
            <ul className="chapter-showcase__cast" aria-label={copy.collectionPersonnagesLabel}>
              {characters.slice(0, 5).map((member) => (
                <li key={member.id}>
                  <Link
                    to={`/collection/${chapter.slug}/${member.slug}`}
                    title={member.name}
                  >
                    <img src={member.cover} alt="" loading="lazy" />
                    <span>
                      <GlossedTerm term={member.name} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {minPrice != null ? (
              <p className="chapter-showcase__price">
                {copy.fromPrice}{" "}
                <strong>{formatPriceXof(minPrice)} FCFA</strong>
              </p>
            ) : null}
          </>
        ) : (
          <p className="chapter-showcase__empty">{copy.collectionEmptyChapter}</p>
        )}

        <div className="chapter-showcase__actions">
          <Link to={`/collection/${chapter.slug}`} className="chapter-showcase__cta chapter-showcase__cta--ghost">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 7.5 13.4 13 12 12l-4.1 1.4L12 7.5Z" fill="currentColor" stroke="none" />
            </svg>
            <span>{copy.collectionSeeChapter}</span>
          </Link>

          {!isEmpty ? (
            <Link
              to={`/boutique?chapitre=${chapter.id}`}
              className="chapter-showcase__cta chapter-showcase__cta--solid"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M6 4h12l-1 14H7L6 4Z" />
                <path d="M9 4V2h6v2" />
              </svg>
              <span className="chapter-showcase__cta-copy">
                <strong>{copy.collectionPieceCta}</strong>
                <em>
                  {characters.length} {copy.collectionPersonnagesLabel.toLowerCase()}
                  {productTotal > 0 ? ` • ${productTotal} pièces` : ""}
                </em>
              </span>
            </Link>
          ) : null}
        </div>

        <ul className="chapter-showcase__highlights" aria-label="Points forts du chapitre">
          {copy.chapterCardHighlights.map((item, index) => (
            <li key={item.title}>
              <span className="chapter-showcase__highlight-icon" aria-hidden="true">
                <HighlightIconMark name={HIGHLIGHT_ICONS[index] ?? "star"} />
              </span>
              <div>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
