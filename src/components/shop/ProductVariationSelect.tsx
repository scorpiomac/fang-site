import { useEffect, useMemo, useState } from "react";
import type { ShopProduct } from "@/content/shop";
import {
  formatPriceXof,
  getDefaultVariation,
  getVariationById,
  hasMultipleVariations,
} from "@/content/shop";

type Props = {
  product: ShopProduct;
  variationId: string;
  onVariationChange: (id: string) => void;
  compact?: boolean;
};

export function ProductVariationSelect({
  product,
  variationId,
  onVariationChange,
  compact = false,
}: Props) {
  const variations = product.variations;
  const show = hasMultipleVariations(variations);
  const selected =
    getVariationById(variations, variationId) ?? getDefaultVariation(variations);

  if (!show) return null;

  return (
    <div className={`product-variations${compact ? " product-variations--compact" : ""}`}>
      <p className="product-variations__label">Choisir la pièce</p>
      <ul className="product-variations__list" role="listbox" aria-label="Choisir la pièce">
        {variations.map((v) => {
          const active = selected.id === v.id;
          return (
            <li key={v.id}>
              <button
                type="button"
                role="option"
                aria-selected={active}
                className={`product-variations__option${active ? " is-selected" : ""}`}
                onClick={() => onVariationChange(v.id)}
              >
                <span className="product-variations__option-main">
                  <strong>{v.label}</strong>
                  {v.description ? <em>{v.description}</em> : null}
                </span>
                <span className="product-variations__option-price">
                  {formatPriceXof(v.priceXof)} FCFA
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Hook : variation sélectionnée + prix courant */
export function useProductVariation(product: ShopProduct) {
  const defaultVar = useMemo(
    () => getDefaultVariation(product.variations),
    [product.variations]
  );
  const [variationId, setVariationId] = useState<string>(defaultVar.id);

  useEffect(() => {
    setVariationId(getDefaultVariation(product.variations).id);
  }, [product.id, product.variations]);

  const variation = useMemo(() => {
    return getVariationById(product.variations, variationId) ?? defaultVar;
  }, [product.variations, variationId, defaultVar]);

  return { variationId: variation.id, variation, setVariationId };
}
