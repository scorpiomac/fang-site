import { useState } from "react";
import { Link } from "react-router-dom";
import type { ShopProduct } from "@/content/shop";
import { formatPriceXof, hasMultipleVariations } from "@/content/shop";
import { useCart } from "@/context/useCart";
import { copy } from "@/content/copy";
import {
  ProductVariationSelect,
  useProductVariation,
} from "@/components/shop/ProductVariationSelect";

type Props = {
  product: ShopProduct;
};

export function StickyBuyBar({ product }: Props) {
  const { addItem, openDrawer } = useCart();
  const { variationId, variation, setVariationId } = useProductVariation(product);
  const [size, setSize] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const onAdd = () => {
    if (!size) {
      setExpanded(true);
      return;
    }
    addItem(product, size, { variationId });
    openDrawer();
  };

  return (
    <div className={`sticky-buy${expanded ? " sticky-buy--expanded" : ""}`}>
      <div className="sticky-buy__summary">
        <p className="sticky-buy__name">{product.name}</p>
        <p className="sticky-buy__price">
          {hasMultipleVariations(product.variations) ? `${variation.label} · ` : ""}
          {formatPriceXof(variation.priceXof)} FCFA
        </p>
      </div>
      {expanded ? (
        <>
          <ProductVariationSelect
            product={product}
            variationId={variationId}
            onVariationChange={setVariationId}
            compact
          />
          <div className="sticky-buy__sizes">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                className={size === s ? "is-selected" : undefined}
                onClick={() => setSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </>
      ) : null}
      <div className="sticky-buy__actions">
        <button type="button" className="cta cta--solid sticky-buy__add" onClick={onAdd}>
          {size ? copy.addToCart : copy.selectSizeShort}
        </button>
        <Link to={`/boutique/${product.slug}`} className="sticky-buy__detail">
          Détail
        </Link>
      </div>
    </div>
  );
}
