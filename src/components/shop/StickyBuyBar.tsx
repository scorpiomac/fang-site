import { Link } from "react-router-dom";
import type { ShopProduct } from "@/content/shop";
import { formatPriceXof, hasMultipleVariations } from "@/content/shop";
import { copy } from "@/content/copy";
import { ProductVariationSelect } from "@/components/shop/ProductVariationSelect";
import { useProductPurchase } from "@/hooks/useProductPurchase";

type Props = {
  product: ShopProduct;
};

export function StickyBuyBar({ product }: Props) {
  const {
    variationId,
    variation,
    setVariationId,
    size,
    setSize,
    canPurchase,
    addToCart,
    sizeState,
  } = useProductPurchase(product);

  const onAdd = () => {
    if (!canPurchase) return;
    addToCart(false);
  };

  const onCheckout = () => {
    if (!canPurchase) return;
    addToCart(true);
  };

  return (
    <div className="sticky-buy sticky-buy--expanded">
      <div className="sticky-buy__summary">
        <p className="sticky-buy__name">{product.name}</p>
        <p className="sticky-buy__price">
          {hasMultipleVariations(product.variations) ? `${variation.label} · ` : ""}
          {formatPriceXof(variation.priceXof)} FCFA
        </p>
      </div>

      <ProductVariationSelect
        product={product}
        variationId={variationId}
        onVariationChange={setVariationId}
        compact
      />

      <div className="sticky-buy__sizes" role="group" aria-label="Taille">
        {sizeState.map(({ size: s, isOut }) => (
          <button
            key={s}
            type="button"
            className={`${size === s ? "is-selected" : ""}${isOut ? " is-out" : ""}`}
            disabled={isOut}
            onClick={() => setSize(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="sticky-buy__actions">
        <button
          type="button"
          className="cta cta--solid sticky-buy__add"
          disabled={!canPurchase}
          onClick={onAdd}
        >
          {copy.addToCart}
        </button>
        <button
          type="button"
          className="cta cta--ghost sticky-buy__checkout"
          disabled={!canPurchase}
          onClick={onCheckout}
        >
          {copy.checkoutDirect}
        </button>
        <Link to={`/boutique/${product.slug}`} className="sticky-buy__detail">
          Détail
        </Link>
      </div>
    </div>
  );
}
