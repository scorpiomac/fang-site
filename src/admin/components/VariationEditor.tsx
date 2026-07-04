import {
  VARIATION_PRESETS,
  presetToVariations,
  slugifyVariationId,
  type ProductVariation,
} from "@/content/productVariations";

type Props = {
  variations: ProductVariation[];
  onChange: (next: ProductVariation[]) => void;
  basePrice: number;
  onBasePriceChange: (n: number) => void;
};

function emptyVariation(basePrice: number): ProductVariation {
  return {
    id: slugifyVariationId(`piece-${Date.now()}`),
    label: "",
    priceXof: basePrice,
    description: "",
  };
}

export function VariationEditor({
  variations,
  onChange,
  basePrice,
  onBasePriceChange,
}: Props) {
  const list = variations.length > 0 ? variations : [];

  const update = (index: number, patch: Partial<ProductVariation>) => {
    const next = list.map((v, i) => (i === index ? { ...v, ...patch } : v));
    if (patch.label !== undefined) {
      next[index] = {
        ...next[index],
        id: slugifyVariationId(patch.label || next[index].id),
      };
    }
    onChange(next);
  };

  const setDefault = (index: number) => {
    onChange(list.map((v, i) => ({ ...v, default: i === index })));
  };

  const remove = (index: number) => {
    const next = list.filter((_, i) => i !== index);
    if (next.length > 0 && !next.some((v) => v.default)) {
      next[0] = { ...next[0], default: true };
    }
    onChange(next);
  };

  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    const [m] = next.splice(index, 1);
    next.splice(to, 0, m);
    onChange(next);
  };

  const add = () => {
    onChange([...list, emptyVariation(basePrice)]);
  };

  const applyPreset = (presetIndex: number) => {
    const preset = VARIATION_PRESETS[presetIndex];
    if (!preset) return;
    onChange(presetToVariations(preset));
  };

  return (
    <div className="admin-variations">
      <header className="admin-variations__head">
        <div>
          <h3>Variations de prix</h3>
          <p className="admin-help">
            Comme WooCommerce : ensemble complet, haut seul, pantalon seul… Chaque variation a
            son prix. Le client choisit avant d&apos;ajouter au panier.
          </p>
        </div>
        <div className="admin-variations__presets">
          {VARIATION_PRESETS.map((p, i) => (
            <button
              key={p.label}
              type="button"
              className="admin-cta admin-cta--small admin-cta--ghost"
              onClick={() => applyPreset(i)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      {list.length === 0 ? (
        <div className="admin-variations__empty">
          <label>
            <span>Prix unique (XOF)</span>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => onBasePriceChange(Number(e.target.value))}
              min={0}
              step={1000}
            />
          </label>
          <button type="button" className="admin-cta admin-cta--small" onClick={add}>
            Ajouter des variations
          </button>
        </div>
      ) : (
        <ul className="admin-variations__list">
          {list.map((v, i) => (
            <li key={v.id} className="admin-variations__row">
              <div className="admin-variations__row-head">
                <label className="admin-variations__default">
                  <input
                    type="radio"
                    name="variation-default"
                    checked={Boolean(v.default) || (i === 0 && !list.some((x) => x.default))}
                    onChange={() => setDefault(i)}
                  />
                  <span>Par défaut</span>
                </label>
                <div className="admin-variations__row-actions">
                  <button type="button" className="admin-icon-btn" onClick={() => move(i, -1)} disabled={i === 0}>
                    ↑
                  </button>
                  <button
                    type="button"
                    className="admin-icon-btn"
                    onClick={() => move(i, 1)}
                    disabled={i === list.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="admin-icon-btn admin-icon-btn--danger"
                    onClick={() => remove(i)}
                    aria-label="Supprimer"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="admin-variations__fields">
                <label>
                  <span>Libellé</span>
                  <input
                    value={v.label}
                    onChange={(e) => update(i, { label: e.target.value })}
                    placeholder="Ex. Haut seul"
                  />
                </label>
                <label>
                  <span>Prix (XOF)</span>
                  <input
                    type="number"
                    value={v.priceXof}
                    onChange={(e) => update(i, { priceXof: Number(e.target.value) })}
                    min={0}
                    step={1000}
                  />
                </label>
                <label className="admin-variations__desc">
                  <span>Description (option)</span>
                  <input
                    value={v.description ?? ""}
                    onChange={(e) => update(i, { description: e.target.value })}
                    placeholder="Ex. Veste ou chemise"
                  />
                </label>
                <label>
                  <span>Réf. SKU (option)</span>
                  <input
                    value={v.sku ?? ""}
                    onChange={(e) => update(i, { sku: e.target.value })}
                    placeholder="FANG-TAM-HAUT"
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}

      {list.length > 0 ? (
        <button type="button" className="admin-cta admin-cta--small admin-cta--ghost" onClick={add}>
          + Ajouter une variation
        </button>
      ) : null}
    </div>
  );
}
