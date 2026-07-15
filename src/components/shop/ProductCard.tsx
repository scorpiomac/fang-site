import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ShopProduct } from "@/content/shop";
import { formatPriceXof, formatVariationPriceLabel } from "@/content/shop";
import { copy } from "@/content/copy";
import { useCart } from "@/context/useCart";
import { useStock } from "@/context/stockContext";
import { WishlistButton } from "@/components/shop/WishlistButton";
import {
  ProductVariationSelect,
  useProductVariation,
} from "@/components/shop/ProductVariationSelect";
import { GlossedTerm } from "@/components/ui/GlossedTerm";

type Props = {
  product: ShopProduct;
  variant?: "default" | "catalog";
};

export function ProductCard({ product, variant = "default" }: Props) {
  const [quickOpen, setQuickOpen] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const { addItem } = useCart();
  const { qtyFor } = useStock();
  const { variationId, setVariationId } = useProductVariation(product);
  const isCatalog = variant === "catalog";

  const img1 = product.coverImage || product.images[0];
  const img2 = product.images.find((img) => img !== img1) ?? img1;

  const allOutOfStock = useMemo(() => {
    let anyKnown = false;
    for (const s of product.sizes) {
      const q = qtyFor(product.productKey, variationId, s);
      if (q == null) return false;
      anyKnown = true;
      if (q > 0) return false;
    }
    return anyKnown;
  }, [product, variationId, qtyFor]);

  const onQuickAdd = (size: string) => {
    addItem(product, size, { silent: true, variationId });
    setJustAdded(size);
    setQuickOpen(false);
    setTimeout(() => setJustAdded(null), 2000);
  };

  const addLabel = allOutOfStock
    ? "Rupture"
    : justAdded
      ? `Taille ${justAdded} ✓`
      : quickOpen
        ? "Fermer"
        : copy.addToCart;

  return (
    <article
      className={`product-card-shop${isCatalog ? " product-card-shop--catalog" : ""}`}
      onMouseLeave={() => !isCatalog && setQuickOpen(false)}
    >
      <Link to={`/boutique/${product.slug}`} className="product-card-shop__link">
        <div className="product-card-shop__media">
          <img
            src={img1}
            alt=""
            loading="lazy"
            decoding="async"
            className="product-card-shop__img-base"
          />
          {img2 !== img1 ? (
            <img
              src={img2}
              alt=""
              loading="lazy"
              decoding="async"
              className="product-card-shop__img-hover"
              aria-hidden="true"
            />
          ) : null}
          {!isCatalog ? <div className="product-card-shop__veil" /> : null}
          {!isCatalog ? (
            <span className="product-card-shop__chapter">{product.chapterLabel}</span>
          ) : null}
          {allOutOfStock ? (
            <span className="product-card-shop__badge product-card-shop__badge--out">Rupture</span>
          ) : !isCatalog && product.kind === "Pièce unique" ? (
            <span className="product-card-shop__badge">Pièce unique</span>
          ) : null}
          <WishlistButton slug={product.slug} className="product-card-shop__wishlist" />
        </div>
        <div className="product-card-shop__body">
          {isCatalog ? (
            <p className="product-card-shop__meta">
              <GlossedTerm term={product.characterName} />
              <span className="product-card-shop__meta-sep" aria-hidden="true">
                ·
              </span>
              {product.chapterLabel}
            </p>
          ) : (
            <p className="product-card-shop__kind">{product.kind}</p>
          )}
          <h3 className="product-card-shop__name">{product.name}</h3>
          <p className="product-card-shop__price">
            {formatVariationPriceLabel(product, formatPriceXof)}
          </p>
        </div>
      </Link>

      {isCatalog ? (
        <div className="product-card-shop__footer">
          <button
            type="button"
            className={`product-card-shop__add-cta${
              justAdded ? " product-card-shop__add-cta--done" : ""
            }${quickOpen ? " product-card-shop__add-cta--open" : ""}`}
            aria-label={`Ajouter ${product.name} au panier`}
            aria-expanded={quickOpen}
            disabled={allOutOfStock}
            onClick={() => setQuickOpen((v) => !v)}
          >
            {addLabel}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={`product-card-shop__add-cta ${justAdded ? "product-card-shop__add-cta--done" : ""}`}
          aria-label={`Sélectionner une taille pour ${product.name}`}
          onClick={(e) => {
            e.preventDefault();
            setQuickOpen((v) => !v);
          }}
        >
          {justAdded ? `Taille ${justAdded} — ajouté ✓` : quickOpen ? "Fermer" : "Ajouter"}
        </button>
      )}

      {quickOpen ? (
        <div className="product-card-shop__sizes-panel is-open" aria-hidden={false}>
          <ProductVariationSelect
            product={product}
            variationId={variationId}
            onVariationChange={setVariationId}
            compact
          />
          <p className="product-card-shop__sizes-label">{copy.selectSize}</p>
          <div className="product-card-shop__sizes-row">
            {product.sizes.map((s) => {
              const q = qtyFor(product.productKey, variationId, s);
              const isOut = q != null && q <= 0;
              return (
                <button
                  key={s}
                  type="button"
                  className={`product-card-shop__size-btn ${isOut ? "product-card-shop__size-btn--out" : ""}`}
                  disabled={isOut}
                  onClick={() => onQuickAdd(s)}
                  title={isOut ? "Rupture" : q != null ? `${q} dispo` : ""}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </article>
  );
}
