import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  season01,
  collectionChapters,
  activeChapters,
  getCharactersForChapter,
  totalProductsInChapter,
} from "@/content/collectionCatalog";
import { getProductByCharacter, formatPriceXof } from "@/content/shop";
import { copy } from "@/content/copy";
import { TrustStrip } from "@/components/shop/TrustStrip";
import { CommerceJourney } from "@/components/shop/CommerceJourney";

export function CollectionPage() {
  return (
    <main id="contenu-principal" className="collection-page shop-shell commerce-shell">
      <div className="commerce-hero">
        <CommerceJourney
          steps={[
            { label: "Accueil", to: "/" },
            { label: "Collection", current: true },
            { label: "Commander", to: "/boutique" },
          ]}
        />
        <header className="collection-page__hero commerce-hero__body">
          <p className="collection-page__eyebrow">
            {copy.collectionEyebrow} · {season01.subtitle}
          </p>
          <h1 className="collection-page__title">{season01.title}</h1>
          <p className="collection-page__lede">{copy.conversionTagline}</p>
          <div className="commerce-hero__actions">
            <Link to="/boutique" className="cta cta--solid">
              {copy.shopAllPieces}
              <span aria-hidden="true"> →</span>
            </Link>
            <Link to="/#collections" className="cta cta--ghost">
              {copy.narrativeAndShop}
            </Link>
          </div>
        </header>
        <TrustStrip />
      </div>

      <ol className="collection-chapters collection-chapters--editorial">
        {collectionChapters.map((chapter) => {
          const characters = getCharactersForChapter(chapter.id);
          const productTotal = totalProductsInChapter(chapter.id);
          const cover = chapter.coverImage || chapter.posterImage || characters[0]?.cover;
          const minProduct = characters
            .map((c) => getProductByCharacter(chapter.id, c.slug))
            .find(Boolean);

          return (
            <li key={chapter.id}>
              <article
                className={`collection-chapter-card collection-chapter-card--premium${characters.length ? "" : " collection-chapter-card--empty"}`}
                style={
                  {
                    "--c1": chapter.palette[0],
                    "--c2": chapter.palette[1],
                    "--c3": chapter.palette[2],
                  } as CSSProperties
                }
              >
                <div className="collection-chapter-card__index-badge" aria-hidden="true">
                  {chapter.index}
                </div>

                <Link to={`/collection/${chapter.slug}`} className="collection-chapter-card__visual">
                  {cover ? <img src={cover} alt="" loading="lazy" /> : null}
                  {!cover ? (
                    <span className="collection-chapter-card__placeholder">{chapter.index}</span>
                  ) : null}
                  <div className="collection-chapter-card__visual-scrim" aria-hidden="true" />
                  <span className="collection-chapter-card__visual-title">
                    Ch. {chapter.index} — {chapter.name}
                  </span>
                </Link>

                <div className="collection-chapter-card__body">
                  <p className="collection-chapter-card__folder">{chapter.sourceFolder}</p>
                  {chapter.meaning ? (
                    <p className="collection-chapter-card__meaning">{chapter.meaning}</p>
                  ) : null}

                  {characters.length > 0 ? (
                    <>
                      <ul
                        className="collection-chapter-card__cast-preview"
                        aria-label={copy.collectionPersonnagesLabel}
                      >
                        {characters.slice(0, 5).map((m) => (
                          <li key={m.id}>
                            <Link
                              to={`/collection/${chapter.slug}/${m.slug}`}
                              title={m.name}
                            >
                              <img src={m.cover} alt="" loading="lazy" />
                              <span>{m.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {minProduct ? (
                        <p className="collection-chapter-card__from-price">
                          {copy.fromPrice}{" "}
                          <strong>{formatPriceXof(minProduct.priceXof)} FCFA</strong>
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="collection-chapter-card__empty">{copy.collectionEmptyChapter}</p>
                  )}

                  <div className="collection-chapter-card__actions">
                    <Link to={`/collection/${chapter.slug}`} className="cta cta--ghost">
                      {copy.collectionSeeChapter}
                    </Link>
                    {characters.length > 0 ? (
                      <Link
                        to={`/boutique?chapitre=${chapter.id}`}
                        className="cta cta--solid collection-chapter-card__cta"
                      >
                        {copy.collectionPieceCta}
                        <span className="collection-chapter-card__cta-sub">
                          · {characters.length} {copy.collectionPersonnagesLabel.toLowerCase()}
                          {productTotal > 0 ? ` · ${productTotal} looks` : ""}
                        </span>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ol>

      <aside className="commerce-closer">
        <p className="commerce-closer__title">Prêt à porter FANG ?</p>
        <p className="commerce-closer__body">
          {activeChapters.length} chapitres disponibles — choisissez votre personnage, votre taille,
          validez sur WhatsApp avec l&apos;atelier.
        </p>
        <Link to="/boutique" className="cta cta--solid">
          {copy.shopAllPieces} →
        </Link>
      </aside>
    </main>
  );
}
