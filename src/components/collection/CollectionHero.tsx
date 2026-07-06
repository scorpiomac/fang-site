import { Link } from "react-router-dom";
import { season01 } from "@/content/collectionCatalog";
import { copy } from "@/content/copy";
import { TrustStrip } from "@/components/shop/TrustStrip";
import { CommerceJourney } from "@/components/shop/CommerceJourney";
import { publicUrl } from "@/lib/publicUrl";
import { MediaImage } from "@/components/ui/MediaImage";

export function CollectionHero() {
  return (
    <section className="collection-hero" aria-labelledby="collection-hero-title">
      <div className="collection-hero__shell">
        <CommerceJourney
          steps={[
            { label: "Accueil", to: "/" },
            { label: "Collection", current: true },
            { label: "Commander", to: "/boutique" },
          ]}
        />

        <div className="collection-hero__stage">
          <div className="collection-hero__content">
            <p className="collection-hero__badge">
              {copy.collectionEyebrow} · {season01.subtitle}
            </p>
            <h1 id="collection-hero-title" className="collection-hero__title">
              {season01.title}
            </h1>
            <p className="collection-hero__lede">{copy.conversionTagline}</p>
            <div className="collection-hero__actions">
              <Link to="/boutique" className="cta cta--solid collection-hero__cta">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M6 5v3.5a6 6 0 0 0 12 0V5" />
                  <path d="M12 12.5V19" />
                  <path d="M9 19h6" />
                </svg>
                <span>{copy.shopAllPieces}</span>
                <span aria-hidden="true">→</span>
              </Link>
              <Link to="/#collections" className="cta cta--ghost collection-hero__cta">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4H18v16H7.5A2.5 2.5 0 0 1 5 17.5v-11Z" />
                  <path d="M5 6.5A2.5 2.5 0 0 0 7.5 4H18" />
                  <path d="M9 9h6M9 13h4" />
                </svg>
                <span>{copy.narrativeAndShop}</span>
              </Link>
            </div>
          </div>

          <figure className="collection-hero__photo">
            <MediaImage
              src={publicUrl(copy.collectionHeroImage)}
              fallbacks={[
                publicUrl("collection/s01/tambali/personnages/jant/produit-09.jpg"),
              ]}
              alt="Pièce FANG — collection Saison 01"
              loading="eager"
              decoding="async"
            />
          </figure>
        </div>

        <div className="collection-hero__features">
          <TrustStrip withIcons />
        </div>

        <ul className="collection-hero__assurance" aria-label="Garanties">
          {copy.assuranceItems.map((item) => (
            <li key={item}>
              <span className="collection-hero__assurance-mark" aria-hidden="true">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
