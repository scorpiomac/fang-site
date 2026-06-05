import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getChapterById } from "@/content/chapters";
import { copy } from "@/content/copy";
import { getProductBySlug, formatPriceXof, shopProducts } from "@/content/shop";
import { useCart } from "@/context/useCart";

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const product = slug ? getProductBySlug(slug) : undefined;
  const chapter = product?.chapterId ? getChapterById(product.chapterId) : undefined;
  const [activeImg, setActiveImg] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const sizes = product?.sizes ?? [];

  const mainImg = useMemo(() => {
    if (!product) return "";
    return product.images[activeImg] ?? product.images[0] ?? "";
  }, [product, activeImg]);

  const related = useMemo(() => {
    if (!product) return [];
    const others = shopProducts.filter((p) => p.id !== product.id);
    const sameChapter = others.filter((p) => p.chapterId === product.chapterId);
    const otherChapters = others.filter((p) => p.chapterId !== product.chapterId);
    return [...sameChapter, ...otherChapters].slice(0, 3);
  }, [product]);

  useEffect(() => {
    setActiveImg(0);
    setSize(null);
    setAddedFeedback(false);
    setLightboxOpen(false);
  }, [slug]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft")
        setActiveImg((i) => (i - 1 + (product?.images.length ?? 1)) % (product?.images.length ?? 1));
      if (e.key === "ArrowRight")
        setActiveImg((i) => (i + 1) % (product?.images.length ?? 1));
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [lightboxOpen, product?.images.length]);

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

  const onAdd = () => {
    if (!size) return;
    addItem(product, size, 1);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2200);
  };

  return (
    <main id="contenu-principal" className="product-page shop-shell">
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
              <p className="product-page__character-kicker">Ce vêtement incarne le personnage</p>
              <h2 className="product-page__character-name" id="product-character-heading">
                {chapter.name}
              </h2>
              <p className="product-page__character-role">{chapter.role}</p>
              <blockquote className="product-page__character-quote">
                <span aria-hidden="true">«&nbsp;</span>
                {chapter.quote}
                <span aria-hidden="true">&nbsp;»</span>
              </blockquote>
              <p className="product-page__character-wear">{chapter.wear}</p>
              <Link to={`/personnages/${chapter.slug}`} className="product-page__character-link">
                Fiche du personnage
                <span aria-hidden="true"> →</span>
              </Link>
            </aside>
          ) : null}
          <p className="product-page__price">
            {formatPriceXof(product.priceXof)} <span>FCFA</span>
          </p>
          <p className="product-page__kind">{product.kind} · {product.material}</p>
          <p className="product-page__excerpt">{product.excerpt}</p>
          <p className="product-page__desc">{product.description}</p>

          <div className="product-page__sizes">
            <p className="product-page__sizes-label">Taille</p>
            <div className="product-page__size-list" role="group" aria-label="Choisir une taille">
              {sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`product-page__size ${size === s ? "is-selected" : ""}`}
                  onClick={() => setSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="product-page__actions">
            <button
              type="button"
              className={`cta cta--solid product-page__add-btn ${addedFeedback ? "product-page__add-btn--done" : ""}`}
              disabled={!size}
              onClick={onAdd}
            >
              {addedFeedback ? "Ajouté au panier ✓" : "Ajouter au panier"}
            </button>
            <Link
              to={chapter ? `/boutique?personnage=${chapter.id}` : "/boutique"}
              className="cta cta--ghost"
            >
              {chapter ? copy.productPageContinueCharacterBoutique : copy.productPageContinueShopping}
            </Link>
          </div>

          <ul className="product-page__notes product-page__notes--cards" aria-label="Engagements atelier">
            <li>
              <strong>Atelier Dakar</strong>
              <span>Coupe et finitions à la main par l'équipe FANG.</span>
            </li>
            <li>
              <strong>Délais 2–6 semaines</strong>
              <span>Selon la pièce et la disponibilité du tissu.</span>
            </li>
            <li>
              <strong>Échanges sous 7 jours</strong>
              <span>Contactez l'atelier dès réception.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="product-page__related">
          <p className="product-page__related-label">De la même collection</p>
          <div className="product-page__related-grid">
            {related.map((p) => (
              <Link key={p.id} to={`/boutique/${p.slug}`} className="product-related-card">
                <div className="product-related-card__media">
                  <img src={p.images[0]} alt="" loading="lazy" />
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
    </main>
  );
}
