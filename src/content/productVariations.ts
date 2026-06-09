/** Variation de prix / pièce — style WooCommerce */
export type ProductVariation = {
  id: string;
  label: string;
  priceXof: number;
  description?: string;
  sku?: string;
  /** Variation présélectionnée à l'achat */
  default?: boolean;
};

export type VariationProduct = {
  priceXof: number;
  variations: readonly ProductVariation[];
};

export function slugifyVariationId(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48) || `var-${Date.now()}`;
}

/** Variations actives (non vide) ou une variation synthétique depuis priceXof */
export function resolveVariations(
  priceXof: number,
  variations?: ProductVariation[] | null
): ProductVariation[] {
  const list = (variations ?? []).filter(
    (v) => v.label.trim() && typeof v.priceXof === "number" && v.priceXof >= 0
  );
  if (list.length > 0) return list;
  return [
    {
      id: "default",
      label: "Pièce",
      priceXof,
      default: true,
    },
  ];
}

export function hasMultipleVariations(variations: readonly ProductVariation[]): boolean {
  return variations.length > 1;
}

export function getDefaultVariation(
  variations: readonly ProductVariation[]
): ProductVariation {
  return variations.find((v) => v.default) ?? variations[0];
}

export function getVariationById(
  variations: readonly ProductVariation[],
  id: string | null | undefined
): ProductVariation | undefined {
  if (!id) return undefined;
  return variations.find((v) => v.id === id);
}

export function getPriceRange(variations: readonly ProductVariation[]): {
  min: number;
  max: number;
} {
  const prices = variations.map((v) => v.priceXof);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function displayPriceXof(product: VariationProduct): number {
  const vars = resolveVariations(product.priceXof, [...product.variations]);
  if (hasMultipleVariations(vars)) return getPriceRange(vars).min;
  return getDefaultVariation(vars).priceXof;
}

export function formatVariationPriceLabel(
  product: VariationProduct,
  format: (n: number) => string
): string {
  const vars = resolveVariations(product.priceXof, [...product.variations]);
  if (!hasMultipleVariations(vars)) {
    return `${format(getDefaultVariation(vars).priceXof)} FCFA`;
  }
  const { min, max } = getPriceRange(vars);
  if (min === max) return `${format(min)} FCFA`;
  return `À partir de ${format(min)} FCFA`;
}

/** Presets courants FANG */
export const VARIATION_PRESETS: { label: string; variations: Omit<ProductVariation, "id">[] }[] = [
  {
    label: "Ensemble + Haut + Pantalon",
    variations: [
      { label: "Ensemble complet", priceXof: 185000, description: "Haut + pantalon", default: true },
      { label: "Haut seul", priceXof: 95000, description: "Veste, chemise ou top" },
      { label: "Pantalon seul", priceXof: 75000, description: "Pantalon ou jupe" },
    ],
  },
  {
    label: "Haut + Pantalon",
    variations: [
      { label: "Haut", priceXof: 95000, default: true },
      { label: "Pantalon", priceXof: 75000 },
    ],
  },
  {
    label: "Pièce unique",
    variations: [{ label: "Pièce unique", priceXof: 125000, default: true }],
  },
];

export function presetToVariations(
  preset: (typeof VARIATION_PRESETS)[number]
): ProductVariation[] {
  return preset.variations.map((v) => ({
    ...v,
    id: slugifyVariationId(v.label),
  }));
}
