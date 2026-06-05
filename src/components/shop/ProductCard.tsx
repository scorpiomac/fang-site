import { useState } from "react";
import { Link } from "react-router-dom";
import type { ShopProduct } from "@/content/shop";
import { formatPriceXof } from "@/content/shop";
import { useCart } from "@/context/useCart";

type Props = {
  product: ShopProduct;
};

export function ProductCard({ product }: Props) {
  const [quickOpen, setQuickOpen] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const { addItem } = useCart();

  const img1 = product.images[0];
  const img2 = product.images[1] ?? img1;

  const onQuickAdd = (size: string) => {
    addItem(product, size, 1, true);
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
          {product.kind === "Pièce unique" && (
            <span className="product-card-shop__badge">Pièce unique</span>
          )}
        </div>
        <div className="product-card-shop__body">
          <p className="product-card-shop__kind">{product.kind}</p>
          <h3 className="product-card-shop__name">{product.name}</h3>
          <p className="product-card-shop__price">
            {formatPriceXof(product.priceXof)}{" "}
            <span className="product-card-shop__currency">FCFA</span>
          </p>
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
        <p className="product-card-shop__sizes-label">Choisir une taille</p>
        <div className="product-card-shop__sizes-row">
          {product.sizes.map((s) => (
            <button
              key={s}
              type="button"
              className="product-card-shop__size-btn"
              onClick={() => onQuickAdd(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}
