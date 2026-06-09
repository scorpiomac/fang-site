export type CartLine = {
  lineId: string;
  productId: string;
  productKey: string;
  slug: string;
  title: string;
  image: string;
  size: string;
  /** Variation choisie (ex. Haut, Pantalon, Ensemble) */
  variationId: string;
  variationLabel: string;
  priceXof: number;
  qty: number;
};
