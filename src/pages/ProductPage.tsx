import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getChapterById as getChapterLoreById } from "@/content/chapters";
import { getChapterById } from "@/content/collectionCatalog";
import { copy } from "@/content/copy";
import { getProductBySlug, formatPriceXof, shopProducts, type ShopProduct } from "@/content/shop";
import { useCart } from "@/context/useCart";
import { useStock } from "@/context/stockContext";
import { useSiteSettings } from "@/context/siteSettingsContext";
import { CommerceJourney } from "@/components/shop/CommerceJourney";
import { TrustStrip } from "@/components/shop/TrustStrip";
import { StickyBuyBar } from "@/components/shop/StickyBuyBar";
import {
  ProductVariationSelect,
  useProductVariation,
} from "@/components/shop/ProductVariationSelect";
import { WishlistButton } from "@/components/shop/WishlistButton";
import { ProductReviews } from "@/components/shop/ProductReviews";
import { trackProductView, getRecentlyViewed } from "@/lib/recentlyViewed";
import { Seo } from "@/components/Seo";

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const product = slug ? getProductBySlug(slug) : undefined;

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
  const { addItem, openDrawer } = useCart();
  const { settings } = useSiteSettings();
  const { qtyFor } = useStock();
  const chapter = getChapterById(product.chapterId);
  const chapterLore = getChapterLoreById(product.chapterId);
  const [activeImg, setActiveImg] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const { variationId, variation, setVariationId } = useProductVariation(product);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const availableQty = size ? qtyFor(product.productKey, variationId, size) : null;
  const isOutOfStock = availableQty != null && availableQty <= 0;
  const insufficientStock = availableQty != null && availableQty < qty;

  const mainImg = useMemo(() => {
    return product.images[activeImg] ?? product.images[0] ?? "";
  }, [product, activeImg]);

  const related = useMemo(() => {
    const others = shopProducts.filter((p) => p.id !== product.id);
    const sameChapter = others.filter((p) => p.chapterId === product.chapterId);
    const otherChapters = others.filter((p) => p.chapterId !== product.chapterId);
    return [...sameChapter, ...otherChapters].slice(0, 3);
  }, [product]);

  useEffect(() => {
    setActiveImg(0);
    setSize(null);
    setQty(1);
    setAddedFeedback(false);
    setLightboxOpen(false);
    if (product.slug) trackProductView(product.slug);
  }, [slug, product.slug]);

  const recentlyViewed = useMemo(() => {
    const recent = getRecentlyViewed().filter((s) => s !== product.slug);
    return recent
      .map((s) => shopProducts.find((p) => p.slug === s))
      .filter((p): p is ShopProduct => Boolean(p))
      .slice(0, 4);
  }, [product.slug]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft")
        setActiveImg((i) => (i - 1 + product.images.length) % product.images.length);
      if (e.key === "ArrowRight")
        setActiveImg((i) => (i + 1) % product.images.length);
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [lightboxOpen, product.images.length]);

  const onAdd = (thenCheckout = false) => {
    if (!size || isOutOfStock || insufficientStock) return;
    addItem(product, size, { silent: thenCheckout, variationId, qty });
    setAddedFeedback(true);
    if (thenCheckout) {
      navigate("/commande");
    } else {
      openDrawer();
    }
    setTimeout(() => setAddedFeedback(false), 2200);
  };

  const sizes = product.sizes;

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
          {product.images.length > 1 ? (
            <ul className="product-page__thumbs">
              {product.images.map((src, i) => (
                <li key={src}>
                  <button
                    type="button"
                    className={i === activeImg ? "is-active" : ""}
                    onClick={() => setActiveImg(i)}
                  >
                    <img src={src} alt="" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
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
                Voir les produits du personnage
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
              {sizes.map((s) => {
                const q = qtyFor(product.productKey, variationId, s);
                const isOut = q != null && q <= 0;
                return (
                  <button
                    key={s}
                    type="button"
                    className={`product-page__size ${size === s ? "is-selected" : ""} ${isOut ? "product-page__size--out" : ""}`}
                    disabled={isOut}
                    onClick={() => setSize(s)}
                    title={isOut ? "Rupture de stock" : q != null ? `${q} dispo` : ""}
                  >
                    {s}
                  </button>
                );
              })}
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
              disabled={!size || isOutOfStock || insufficientStock}
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
              disabled={!size || isOutOfStock || insufficientStock}
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

      {recentlyViewed.length > 0 && (
        <section className="product-page__related">
          <p className="product-page__related-label">Récemment consultées</p>
          <div className="product-page__related-grid">
            {recentlyViewed.map((p) => (
              <Link key={p.id} to={`/boutique/${p.slug}`} className="product-related-card">
                <div className="product-related-card__media">
                  <img src={p.coverImage || p.images[0]} alt="" loading="lazy" />
                </div>
                <div className="product-related-card__body">
                  <p className="product-related-card__chapter">{p.chapterLabel}</p>
                  <p className="product-related-card__name">{p.name}</p>
                  <p className="product-related-card__price">{formatPriceXof(p.priceXof)} FCFA</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="product-page__related">
          <p className="product-page__related-label">De la même collection</p>
          <div className="product-page__related-grid">
            {related.map((p) => (
              <Link key={p.id} to={`/boutique/${p.slug}`} className="product-related-card">
                <div className="product-related-card__media">
                  <img src={p.coverImage || p.images[0]} alt="" loading="lazy" />
                  <img src={p.images[1] ?? p.images[0]} alt="" loading="lazy" aria-hidden="true" className="product-related-card__img-hover" />
                </div>
                <div className="product-related-card__body">
                  <p className="product-related-card__chapter">{p.chapterLabel}</p>
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

          {product.images.length > 1 && (
            <button
              type="button"
              className="product-lightbox__nav product-lightbox__nav--prev"
              aria-label="Image précédente"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImg((i) => (i - 1 + product.images.length) % product.images.length);
              }}
            >
              ‹
            </button>
          )}

          <div className="product-lightbox__frame" onClick={(e) => e.stopPropagation()}>
            <img src={mainImg} alt={product.name} />
          </div>

          {product.images.length > 1 && (
            <button
              type="button"
              className="product-lightbox__nav product-lightbox__nav--next"
              aria-label="Image suivante"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImg((i) => (i + 1) % product.images.length);
              }}
            >
              ›
            </button>
          )}

          {product.images.length > 1 && (
            <div className="product-lightbox__dots" onClick={(e) => e.stopPropagation()}>
              {product.images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`product-lightbox__dot ${i === activeImg ? "is-active" : ""}`}
                  aria-label={`Image ${i + 1}`}
                  onClick={() => setActiveImg(i)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <StickyBuyBar product={product} />
    </main>
  );
}
