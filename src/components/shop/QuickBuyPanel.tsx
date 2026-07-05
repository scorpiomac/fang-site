import type { ShopProduct } from "@/content/shop";
import { formatPriceXof } from "@/content/shop";
import { copy } from "@/content/copy";
import { TrustStrip } from "@/components/shop/TrustStrip";
import { ProductVariationSelect } from "@/components/shop/ProductVariationSelect";
import { useProductPurchase } from "@/hooks/useProductPurchase";

type Props = {
  product: ShopProduct;
  kicker?: string;
  showTrust?: boolean;
};

export function QuickBuyPanel({ product, kicker, showTrust = true }: Props) {
  const {
    variationId,
    variation,
    setVariationId,
    size,
    setSize,
    addedFeedback,
    canPurchase,
    isOutOfStock,
    addToCart,
    sizeState,
  } = useProductPurchase(product);

  return (
    <div className="quick-buy">
      {kicker ? <p className="quick-buy__kicker">{kicker}</p> : null}
      <h2 className="quick-buy__title">{product.name}</h2>
      <p className="quick-buy__meta">
        {product.kind} · {product.material}
      </p>
      <p className="quick-buy__price">
        {formatPriceXof(variation.priceXof)} <span>FCFA</span>
      </p>
      <p className="quick-buy__excerpt">{product.excerpt}</p>

      <ProductVariationSelect
        product={product}
        variationId={variationId}
        onVariationChange={setVariationId}
        compact
      />

      <div className="quick-buy__sizes">
        <p className="quick-buy__sizes-label">{copy.selectSize}</p>
        <div className="quick-buy__sizes-row" role="group" aria-label="Choisir une taille">
          {sizeState.map(({ size: s, isOut }) => (
            <button
              key={s}
              type="button"
              className={`quick-buy__size${size === s ? " is-selected" : ""}${isOut ? " is-out" : ""}`}
              disabled={isOut}
              onClick={() => setSize(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="quick-buy__actions">
        <button
          type="button"
          className={`cta cta--solid quick-buy__cta${addedFeedback ? " quick-buy__cta--done" : ""}`}
          disabled={!canPurchase}
          onClick={() => addToCart(false)}
        >
          {isOutOfStock ? "Rupture de stock" : addedFeedback ? copy.addedToCart : copy.addToCart}
        </button>
        <button
          type="button"
          className="cta cta--ghost quick-buy__checkout"
          disabled={!canPurchase}
          onClick={() => addToCart(true)}
        >
          {copy.checkoutDirect}
        </button>
      </div>

      {showTrust ? <TrustStrip compact /> : null}
    </div>
  );
}
