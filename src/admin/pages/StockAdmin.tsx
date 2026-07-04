import { useEffect, useMemo, useState } from "react";
import { pieceIdFromImageUrl } from "@/content/shop";
import { adminApi, type StockEntry, type StockSummary } from "../api";
import { useAdmin } from "../AdminContext";

type ProductInfo = {
  productKey: string;
  chapterId: string;
  chapterName: string;
  characterSlug: string;
  characterName: string;
  pieceId: string;
  pieceLabel: string;
  sizes: string[];
  variations: { id: string; label: string }[];
};

function pieceLabel(pieceId: string, index: number): string {
  if (pieceId === "cover") return "Cover";
  const match = pieceId.match(/produit-(\d+)/i);
  if (match) return `Pièce ${Number(match[1])}`;
  return `Pièce ${index + 1}`;
}

export function StockAdmin() {
  const { bundle, setToast } = useAdmin();
  const [stock, setStock] = useState<Record<string, StockEntry>>({});
  const [summary, setSummary] = useState<StockSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ProductInfo | null>(null);

  const products: ProductInfo[] = useMemo(() => {
    if (!bundle) return [];
    const out: ProductInfo[] = [];
    for (const c of bundle.catalog.chapters) {
      for (const ch of c.characters) {
        ch.images.forEach((imagePath, index) => {
          const pieceId = pieceIdFromImageUrl(imagePath);
          const charOv = bundle.productsOverrides?.[`${c.id}/${ch.slug}`];
          const pieceOv = bundle.productsOverrides?.[`${c.id}/${ch.slug}/${pieceId}`];
          const ov = { ...charOv, ...pieceOv };
          const sizes = ov?.sizes && ov.sizes.length > 0 ? ov.sizes : ["XS", "S", "M", "L", "XL"];
          const variations =
            ov?.variations && ov.variations.length > 0
              ? ov.variations
                  .filter((v) => v.label?.trim())
                  .map((v) => ({ id: v.id, label: v.label }))
              : [{ id: "default", label: "Pièce" }];
          out.push({
            productKey: `${c.id}/${ch.slug}/${pieceId}`,
            chapterId: c.id,
            chapterName: c.name,
            characterSlug: ch.slug,
            characterName: ch.name,
            pieceId,
            pieceLabel: pieceLabel(pieceId, index),
            sizes,
            variations,
          });
        });
      }
    }
    return out;
  }, [bundle]);

  const refresh = async () => {
    setLoading(true);
    try {
      const { stock, summary } = await adminApi.fetchStock();
      setStock(stock);
      setSummary(summary);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filteredProducts = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.characterName.toLowerCase().includes(q) ||
      p.chapterName.toLowerCase().includes(q) ||
      p.pieceLabel.toLowerCase().includes(q)
    );
  });

  const summaryByKey = Object.fromEntries(summary.map((s) => [s.productKey, s]));

  const openEditor = (p: ProductInfo) => {
    if (!stock[p.productKey]) {
      const variations: Record<string, Record<string, number>> = {};
      for (const v of p.variations) {
        variations[v.id] = {};
        for (const s of p.sizes) variations[v.id][s] = 0;
      }
      setStock((prev) => ({
        ...prev,
        [p.productKey]: { trackInventory: false, variations },
      }));
    }
    setEditing(p);
  };

  const setQty = async (
    productKey: string,
    variationId: string,
    size: string,
    qty: number
  ) => {
    const value = Math.max(0, Math.floor(qty));
    setStock((prev) => {
      const entry = prev[productKey] ?? { trackInventory: true, variations: {} };
      const variations = { ...entry.variations };
      variations[variationId] = { ...(variations[variationId] ?? {}), [size]: value };
      return { ...prev, [productKey]: { ...entry, variations, trackInventory: true } };
    });
    try {
      await adminApi.setStockQty(productKey, variationId, size, value);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    }
  };

  const setTracking = async (productKey: string, track: boolean) => {
    const entry = stock[productKey] ?? { trackInventory: false, variations: {} };
    const next = { ...entry, trackInventory: track };
    setStock((prev) => ({ ...prev, [productKey]: next }));
    try {
      await adminApi.putStock(productKey, next);
      refresh();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <section className="admin-page">
      <header className="admin-page__head admin-page__head--row">
        <div>
          <p className="admin-eyebrow">Inventaire</p>
          <h1>Stock</h1>
          <p className="admin-page__lede">
            Une ligne par pièce (chaque photo atelier). Le stock est décrémenté à chaque
            commande validée.
          </p>
        </div>
        <button type="button" className="admin-cta admin-cta--ghost" onClick={refresh}>
          Actualiser
        </button>
      </header>

      <div className="admin-toolbar">
        <input
          className="admin-search"
          placeholder="Rechercher une pièce…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? <p className="admin-loading">Chargement…</p> : null}

      <ul className="admin-product-list">
        {filteredProducts.map((p) => {
          const entry = stock[p.productKey];
          const tracking = entry?.trackInventory ?? false;
          const sum = summaryByKey[p.productKey];
          return (
            <li key={p.productKey} className="admin-product-row">
              <div className="admin-product-row__main">
                <strong>
                  {p.characterName} · {p.pieceLabel}
                </strong>
                <span>{p.chapterName}</span>
              </div>
              <div className="admin-product-row__meta">
                {tracking ? (
                  <>
                    <span>
                      Total : <strong>{sum?.total ?? 0}</strong>
                    </span>
                    {sum && sum.outOfStock > 0 ? (
                      <span className="admin-tag admin-tag--warning">
                        {sum.outOfStock} en rupture
                      </span>
                    ) : null}
                    {sum && sum.low > 0 ? (
                      <span className="admin-tag admin-tag--accent">{sum.low} stock faible</span>
                    ) : null}
                  </>
                ) : (
                  <span className="admin-tag admin-tag--muted">Suivi désactivé</span>
                )}
              </div>
              <button
                type="button"
                className="admin-cta admin-cta--small admin-cta--ghost"
                onClick={() => openEditor(p)}
              >
                {tracking ? "Éditer le stock" : "Activer le suivi"}
              </button>
            </li>
          );
        })}
      </ul>

      {editing ? (
        <div
          className="admin-modal"
          onClick={(e) => e.currentTarget === e.target && setEditing(null)}
        >
          <article className="admin-modal__panel admin-modal__panel--wide">
            <header className="admin-modal__head">
              <div>
                <h2>
                  {editing.characterName} · {editing.pieceLabel}
                </h2>
                <p className="admin-help">{editing.chapterName}</p>
              </div>
              <button type="button" className="admin-icon-btn" onClick={() => setEditing(null)}>
                ✕
              </button>
            </header>

            <label className="admin-variations__default" style={{ marginBottom: 16 }}>
              <input
                type="checkbox"
                checked={stock[editing.productKey]?.trackInventory ?? false}
                onChange={(e) => setTracking(editing.productKey, e.target.checked)}
              />
              <span>Suivre le stock pour cette pièce</span>
            </label>

            {stock[editing.productKey]?.trackInventory ? (
              <div className="admin-stock-grid">
                <table className="admin-stock-table">
                  <thead>
                    <tr>
                      <th>Variation</th>
                      {editing.sizes.map((s) => (
                        <th key={s}>{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {editing.variations.map((v) => (
                      <tr key={v.id}>
                        <th scope="row">{v.label}</th>
                        {editing.sizes.map((s) => {
                          const qty =
                            stock[editing.productKey]?.variations?.[v.id]?.[s] ?? 0;
                          return (
                            <td key={s}>
                              <input
                                type="number"
                                min={0}
                                value={qty}
                                onChange={(e) =>
                                  setQty(
                                    editing.productKey,
                                    v.id,
                                    s,
                                    Number(e.target.value) || 0
                                  )
                                }
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="admin-help">
                  Les modifications sont enregistrées automatiquement à chaque changement.
                </p>
              </div>
            ) : (
              <p className="admin-help">
                Activez le suivi pour saisir les quantités. Sans suivi, la pièce est considérée
                comme disponible (sur commande).
              </p>
            )}

            <footer className="admin-modal__foot">
              <button type="button" className="admin-cta" onClick={() => setEditing(null)}>
                Terminer
              </button>
            </footer>
          </article>
        </div>
      ) : null}
    </section>
  );
}
