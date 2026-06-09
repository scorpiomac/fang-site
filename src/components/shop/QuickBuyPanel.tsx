import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ShopProduct } from "@/content/shop";
import { formatPriceXof } from "@/content/shop";
import { useCart } from "@/context/useCart";
import { copy } from "@/content/copy";
import { TrustStrip } from "@/components/shop/TrustStrip";
import {
  ProductVariationSelect,
  useProductVariation,
} from "@/components/shop/ProductVariationSelect";

type Props = {
  product: ShopProduct;
  kicker?: string;
  showTrust?: boolean;
};

export function QuickBuyPanel({ product, kicker, showTrust = true }: Props) {
  const { addItem, openDrawer } = useCart();
  const navigate = useNavigate();
  const { variationId, variation, setVariationId } = useProductVariation(product);
  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const onAdd = (openCart: boolean) => {
    if (!size) return;
    addItem(product, size, { silent: !openCart, variationId });
    setAdded(true);
    if (openCart) openDrawer();
    setTimeout(() => setAdded(false), 2800);
  };

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
          {product.sizes.map((s) => (
            <button
              key={s}
              type="button"
              className={`quick-buy__size${size === s ? " is-selected" : ""}`}
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
          className={`cta cta--solid quick-buy__cta${added ? " quick-buy__cta--done" : ""}`}
          disabled={!size}
          onClick={() => onAdd(true)}
        >
          {added ? copy.addedToCart : copy.addToCart}
        </button>
        <button
          type="button"
          className={`cta cta--ghost quick-buy__checkout${!size ? " quick-buy__checkout--muted" : ""}`}
          disabled={!size}
          onClick={() => {
            if (!size) return;
            addItem(product, size, { silent: true, variationId });
            navigate("/commande");
          }}
        >
          {copy.checkoutDirect}
        </button>
      </div>

      {showTrust ? <TrustStrip compact /> : null}
    </div>
  );
}
