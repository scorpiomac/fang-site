import { Link } from "react-router-dom";
import { season01 } from "@/content/collectionCatalog";
import { copy } from "@/content/copy";
import { TrustStrip } from "@/components/shop/TrustStrip";
import { CommerceJourney } from "@/components/shop/CommerceJourney";
import { publicUrl } from "@/lib/publicUrl";
import { MediaImage } from "@/components/ui/MediaImage";

type Props = {
  /** Variante Boutique : fil d’Ariane et CTA adaptés. */
  variant?: "collection" | "boutique";
};

export function CollectionHero({ variant = "collection" }: Props) {
  const isBoutique = variant === "boutique";

  return (
    <section className="collection-hero" aria-labelledby="collection-hero-title">
      <div className="collection-hero__shell">
        <CommerceJourney
          steps={
            isBoutique
              ? [
                  { label: "Accueil", to: "/" },
                  { label: "Boutique", current: true },
                  { label: "Commander", to: "/commande" },
                ]
              : [
                  { label: "Accueil", to: "/" },
                  { label: "Boutique", current: true },
                  { label: "Commander", to: "/boutique" },
                ]
          }
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
              <Link to="/archetype" className="cta cta--solid collection-hero__cta">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <circle cx="12" cy="8" r="3.25" />
                  <path d="M5.5 19c1.6-3.2 3.9-4.75 6.5-4.75S16.9 15.8 18.5 19" />
                </svg>
                <span>Archétype</span>
                <span aria-hidden="true">→</span>
              </Link>
              <Link to="/contact" className="cta cta--ghost collection-hero__cta">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
                  <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
                </svg>
                <span>Contact</span>
              </Link>
            </div>
          </div>

          <figure className="collection-hero__photo">
            <MediaImage
              src={publicUrl(copy.collectionHeroImage)}
              fallbacks={[
                publicUrl("collection/s01/tambali/personnages/jant/produit-09.jpg"),
              ]}
              alt="Pièce FANG — boutique Saison 0 — Neel Fang"
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
