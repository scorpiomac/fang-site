import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { getChapterById as getChapterLoreById } from "@/content/chapters";
import { getChapterById } from "@/content/collectionCatalog";
import { copy } from "@/content/copy";
import {
  getLegacyProductRedirect,
  getProductBySlug,
  getProductsForCharacter,
  formatPriceXof,
  type ShopProduct,
} from "@/content/shop";
import { useProductPurchase } from "@/hooks/useProductPurchase";
import { useSiteSettings } from "@/context/siteSettingsContext";
import { CommerceJourney } from "@/components/shop/CommerceJourney";
import { TrustStrip } from "@/components/shop/TrustStrip";
import { StickyBuyBar } from "@/components/shop/StickyBuyBar";
import {
  ProductVariationSelect,
} from "@/components/shop/ProductVariationSelect";
import { WishlistButton } from "@/components/shop/WishlistButton";
import { ProductReviews } from "@/components/shop/ProductReviews";
import { Seo } from "@/components/Seo";

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const legacyRedirect = slug ? getLegacyProductRedirect(slug) : null;
  const product = slug ? getProductBySlug(slug) : undefined;

  if (legacyRedirect) {
    return <Navigate to={`/boutique/${legacyRedirect}`} replace />;
  }

  if (!product) {
    return (
      <main id="contenu-principal" className="product-page product-page--missing shop-shell">
        <p>Pièce introuvable.</p>
        <Link to="/boutique" className="cta cta--solid">
          Voir la boutique
        </Link>
      </main>
    );
  }

  return <ProductPageView product={product} slug={slug} />;
}

function ProductPageView({ product, slug }: { product: ShopProduct; slug?: string }) {
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const chapter = getChapterById(product.chapterId);
  const chapterLore = getChapterLoreById(product.chapterId);
  const {
    variationId,
    variation,
    setVariationId,
    size,
    setSize,
    qty,
    setQty,
    addedFeedback,
    availableQty,
    isOutOfStock,
    canPurchase,
    addToCart,
    sizeState,
  } = useProductPurchase(product);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const mainImg = product.coverImage || product.images[0] || "";

  const siblingPieces = useMemo(
    () =>
      getProductsForCharacter(product.chapterId, product.characterSlug).filter(
        (p) => p.slug !== product.slug
      ),
    [product]
  );

  useEffect(() => {
    setLightboxOpen(false);
  }, [slug, product.slug]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [lightboxOpen]);

  const onAdd = (thenCheckout = false) => addToCart(thenCheckout);

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const productImage = product.coverImage || product.images[0];
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.name} — ${product.chapterLabel}`,
    image: productImage ? [productImage.startsWith("http") ? productImage : `${siteUrl}${productImage}`] : [],
    brand: { "@type": "Brand", name: settings.brand.name },
    sku: product.slug,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/boutique/${product.slug}`,
      priceCurrency: "XOF",
      price: product.priceXof,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <main id="contenu-principal" className="product-page shop-shell commerce-shell">
      <Seo
        title={`${product.name} — ${settings.brand.name}`}
        description={product.description || `${product.name} — Pièce ${product.chapterLabel}, fabriquée à Dakar.`}
        image={productImage}
        url={`${siteUrl}/boutique/${product.slug}`}
        type="product"
        jsonLd={productJsonLd}
      />
      <CommerceJourney
        steps={[
          { label: "Collection", to: "/collection" },
          ...(chapter
            ? [{ label: chapter.name, to: `/collection/${chapter.slug}` }]
            : []),
          { label: product.name, current: true },
        ]}
      />
      <button type="button" className="product-page__back" onClick={() => navigate(-1)}>
        ← Retour
      </button>

      <div className="product-page__grid">
        <div className="product-page__gallery">
          <div
            className="product-page__main product-page__main--zoomable"
            onClick={() => setLightboxOpen(true)}
            role="button"
            tabIndex={0}
            aria-label="Agrandir l'image"
            onKeyDown={(e) => e.key === "Enter" && setLightboxOpen(true)}
          >
            <img src={mainImg} alt={product.name} />
            <span className="product-page__zoom-hint" aria-hidden="true">⊕ Agrandir</span>
          </div>
        </div>

        <div className="product-page__detail">
          <p className="product-page__chapter">{product.chapterLabel}</p>
          <h1 className="product-page__title">{product.name}</h1>
          {chapter ? (
            <aside className="product-page__character" aria-labelledby="product-character-heading">
              <p className="product-page__character-kicker">Personnage · {chapter.name}</p>
              <h2 className="product-page__character-name" id="product-character-heading">
                {product.characterName}
              </h2>
              {chapterLore?.role ? (
                <p className="product-page__character-role">{chapterLore.role}</p>
              ) : null}
              {chapterLore?.quote ? (
                <blockquote className="product-page__character-quote">
                  <span aria-hidden="true">«&nbsp;</span>
                  {chapterLore.quote}
                  <span aria-hidden="true">&nbsp;»</span>
                </blockquote>
              ) : null}
              <Link
                to={`/collection/${chapter.slug}/${product.characterSlug}`}
                className="product-page__character-link"
              >
                Voir toutes les pièces du personnage
                <span aria-hidden="true"> →</span>
              </Link>
              <Link to={`/collection/${chapter.slug}`} className="product-page__character-link">
                Tous les personnages · {chapter.name}
                <span aria-hidden="true"> →</span>
              </Link>
            </aside>
          ) : null}
          <p className="product-page__price">
            {formatPriceXof(variation.priceXof)} <span>FCFA</span>
          </p>
          <p className="product-page__kind">{product.kind} · {product.material}</p>
          <p className="product-page__excerpt">{product.excerpt}</p>
          <p className="product-page__desc">{product.description}</p>

          <ProductVariationSelect
            product={product}
            variationId={variationId}
            onVariationChange={setVariationId}
          />

          <div className="product-page__sizes">
            <p className="product-page__sizes-label">Taille</p>
            <div className="product-page__size-list" role="group" aria-label="Choisir une taille">
              {sizeState.map(({ size: s, qty: stockQty, isOut }) => (
                <button
                  key={s}
                  type="button"
                  className={`product-page__size ${size === s ? "is-selected" : ""} ${isOut ? "product-page__size--out" : ""}`}
                  disabled={isOut}
                  onClick={() => setSize(s)}
                  title={isOut ? "Rupture de stock" : stockQty != null ? `${stockQty} dispo` : ""}
                >
                  {s}
                </button>
              ))}
            </div>
            {isOutOfStock ? (
              <p className="product-page__stock product-page__stock--out">
                Cette taille est en rupture pour cette variation.
              </p>
            ) : availableQty != null && availableQty <= 3 ? (
              <p className="product-page__stock product-page__stock--low">
                Plus que {availableQty} disponible{availableQty > 1 ? "s" : ""}.
              </p>
            ) : null}
          </div>

          <div className="product-page__qty">
            <span className="product-page__qty-label">Quantité</span>
            <div className="product-page__qty-control">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuer">
                −
              </button>
              <span>{qty}</span>
              <button
                type="button"
                onClick={() =>
                  setQty((q) =>
                    availableQty != null ? Math.min(availableQty, q + 1) : Math.min(99, q + 1)
                  )
                }
                aria-label="Augmenter"
              >
                +
              </button>
            </div>
          </div>

          {settings.production.showLeadTime ? (
            <p className="product-page__lead-time">
              <strong>Production :</strong> {settings.production.leadTime}
            </p>
          ) : null}

          <div className="product-page__actions">
            <button
              type="button"
              className={`cta cta--solid product-page__add-btn ${addedFeedback ? "product-page__add-btn--done" : ""}`}
              disabled={!canPurchase}
              onClick={() => onAdd(false)}
            >
              {isOutOfStock
                ? "Rupture de stock"
                : addedFeedback
                  ? copy.addedToCart
                  : copy.addToCart}
            </button>
            <button
              type="button"
              className="cta cta--ghost product-page__checkout-btn"
              disabled={!canPurchase}
              onClick={() => onAdd(true)}
            >
              {copy.checkoutDirect}
            </button>
            <Link
              to={chapter ? `/boutique?chapitre=${chapter.id}` : "/boutique"}
              className="product-page__continue-link"
            >
              {chapter ? copy.productPageContinueCharacterBoutique : copy.productPageContinueShopping}
            </Link>
            <WishlistButton slug={product.slug} className="product-page__wishlist" label />
          </div>

          <TrustStrip compact />
        </div>
      </div>

      <ProductReviews productSlug={product.slug} />

      {siblingPieces.length > 0 && (
        <section className="product-page__related">
          <p className="product-page__related-label">
            Autres pièces · {product.characterName}
          </p>
          <div className="product-page__related-grid">
            {siblingPieces.map((p) => (
              <Link key={p.id} to={`/boutique/${p.slug}`} className="product-related-card">
                <div className="product-related-card__media">
                  <img src={p.coverImage} alt="" loading="lazy" />
                </div>
                <div className="product-related-card__body">
                  <p className="product-related-card__chapter">{p.pieceLabel}</p>
                  <p className="product-related-card__name">{p.name}</p>
                  <p className="product-related-card__price">{formatPriceXof(p.priceXof)} FCFA</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="product-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Vue agrandie"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="product-lightbox__close"
            onClick={() => setLightboxOpen(false)}
            aria-label="Fermer"
          >
            ×
          </button>

          <div className="product-lightbox__frame" onClick={(e) => e.stopPropagation()}>
            <img src={mainImg} alt={product.name} />
          </div>
        </div>
      )}

      <StickyBuyBar product={product} />
    </main>
  );
}
