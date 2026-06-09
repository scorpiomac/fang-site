import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ShopProduct } from "@/content/shop";
import { formatPriceXof, formatVariationPriceLabel } from "@/content/shop";
import { useCart } from "@/context/useCart";
import { useStock } from "@/context/stockContext";
import { WishlistButton } from "@/components/shop/WishlistButton";
import {
  ProductVariationSelect,
  useProductVariation,
} from "@/components/shop/ProductVariationSelect";

type Props = {
  product: ShopProduct;
};

export function ProductCard({ product }: Props) {
  const [quickOpen, setQuickOpen] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const { addItem } = useCart();
  const { qtyFor } = useStock();
  const { variationId, setVariationId } = useProductVariation(product);

  const img1 = product.coverImage || product.images[0];
  const img2 = product.images.find((p) => p !== img1) ?? img1;

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

  return (
    <article
      className="product-card-shop"
      onMouseLeave={() => setQuickOpen(false)}
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
          <img
            src={img2}
            alt=""
            loading="lazy"
            decoding="async"
            className="product-card-shop__img-hover"
            aria-hidden="true"
          />
          <div className="product-card-shop__veil" />
          <span className="product-card-shop__chapter">{product.chapterLabel}</span>
          {allOutOfStock ? (
            <span className="product-card-shop__badge product-card-shop__badge--out">
              Rupture
            </span>
          ) : product.kind === "Pièce unique" ? (
            <span className="product-card-shop__badge">Pièce unique</span>
          ) : null}
          <WishlistButton
            slug={product.slug}
            className="product-card-shop__wishlist"
          />
        </div>
        <div className="product-card-shop__body">
          <p className="product-card-shop__kind">{product.kind}</p>
          <h3 className="product-card-shop__name">{product.name}</h3>
          <p className="product-card-shop__price">{formatVariationPriceLabel(product, formatPriceXof)}</p>
        </div>
      </Link>

      {/* Quick-add — outside Link, so HTML is valid */}
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

      <div
        className={`product-card-shop__sizes-panel ${quickOpen ? "is-open" : ""}`}
        aria-hidden={!quickOpen}
      >
        <ProductVariationSelect
          product={product}
          variationId={variationId}
          onVariationChange={setVariationId}
          compact
        />
        <p className="product-card-shop__sizes-label">Choisir une taille</p>
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
    </article>
  );
}
