import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ShopProduct } from "@/content/shop";
import { useCart } from "@/context/useCart";
import { useStock } from "@/context/stockContext";
import { useProductVariation } from "@/components/shop/ProductVariationSelect";

function firstAvailableSize(
  product: ShopProduct,
  variationId: string,
  qtyFor: (productKey: string, variationId: string, size: string) => number | null
): string | null {
  for (const size of product.sizes) {
    const q = qtyFor(product.productKey, variationId, size);
    if (q == null || q > 0) return size;
  }
  return null;
}

export function useProductPurchase(product: ShopProduct) {
  const navigate = useNavigate();
  const { addItem, openDrawer } = useCart();
  const { qtyFor } = useStock();
  const { variationId, variation, setVariationId } = useProductVariation(product);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    setQty(1);
    setAddedFeedback(false);
    setSize(firstAvailableSize(product, variationId, qtyFor));
  }, [product.id, variationId, qtyFor]);

  const availableQty = size ? qtyFor(product.productKey, variationId, size) : null;
  const isOutOfStock = availableQty != null && availableQty <= 0;
  const insufficientStock = availableQty != null && availableQty < qty;
  const canPurchase = Boolean(size) && !isOutOfStock && !insufficientStock;

  const addToCart = useCallback(
    (thenCheckout = false) => {
      if (!canPurchase || !size) return;
      addItem(product, size, { silent: thenCheckout, variationId, qty });
      setAddedFeedback(true);
      if (thenCheckout) {
        navigate("/commande");
      } else {
        openDrawer();
      }
      setTimeout(() => setAddedFeedback(false), 2200);
    },
    [addItem, canPurchase, navigate, openDrawer, product, qty, size, variationId]
  );

  const sizeState = useMemo(
    () =>
      product.sizes.map((s) => {
        const q = qtyFor(product.productKey, variationId, s);
        return { size: s, qty: q, isOut: q != null && q <= 0 };
      }),
    [product, variationId, qtyFor]
  );

  return {
    variationId,
    variation,
    setVariationId,
    size,
    setSize,
    qty,
    setQty,
    addedFeedback,
    availableQty,
    isOutOfStock,
    insufficientStock,
    canPurchase,
    addToCart,
    sizeState,
  };
}
