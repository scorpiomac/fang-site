import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fileUrlFromPath } from "../api";
import { useAdmin } from "../AdminContext";

type Row = {
  chapterId: string;
  chapterName: string;
  characterSlug: string;
  characterName: string;
  cover: string;
  images: number;
  priceLabel: string;
  variationCount: number;
  override: boolean;
  url: string;
};

export function ProductsAdmin() {
  const { bundle } = useAdmin();
  const [search, setSearch] = useState("");

  const rows: Row[] = useMemo(() => {
    if (!bundle) return [];
    const out: Row[] = [];
    for (const c of bundle.catalog.chapters) {
      for (const ch of c.characters) {
        const ov = bundle.productsOverrides?.[`${c.id}/${ch.slug}`];
        const vars = ov?.variations?.filter((v) => v.label?.trim()) ?? [];
        const prices =
          vars.length > 0
            ? vars.map((v) => v.priceXof)
            : [ov?.priceXof ?? 125000];
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const priceLabel =
          vars.length > 1 && min !== max
            ? `${min.toLocaleString("fr-SN")} – ${max.toLocaleString("fr-SN")} XOF`
            : `${(ov?.priceXof ?? 125000).toLocaleString("fr-SN")} XOF`;
        out.push({
          chapterId: c.id,
          chapterName: c.name,
          characterSlug: ch.slug,
          characterName: ch.name,
          cover: ch.cover,
          images: ch.images.length,
          priceLabel,
          variationCount: vars.length,
          override: Boolean(ov),
          url: `/admin/collections/${c.id}/personnages/${ch.slug}`,
        });
      }
    }
    return out;
  }, [bundle]);

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.characterName.toLowerCase().includes(q) ||
      r.chapterName.toLowerCase().includes(q)
    );
  });

  return (
    <section className="admin-page">
      <header className="admin-page__head">
        <p className="admin-eyebrow">Produits</p>
        <h1>Catalogue boutique</h1>
        <p className="admin-page__lede">
          Chaque personnage de la collection est un produit. Cliquez pour éditer prix,
          tailles et description marketing.
        </p>
      </header>

      <div className="admin-toolbar">
        <input
          className="admin-search"
          placeholder="Rechercher un personnage ou un chapitre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <ul className="admin-product-list">
        {filtered.map((r) => (
          <li key={`${r.chapterId}/${r.characterSlug}`} className="admin-product-row">
            <Link to={r.url} className="admin-product-row__media">
              {r.cover ? (
                <img src={fileUrlFromPath(r.cover)} alt={r.characterName} />
              ) : (
                <span className="admin-card__placeholder">—</span>
              )}
            </Link>
            <div className="admin-product-row__main">
              <strong>{r.characterName}</strong>
              <span>{r.chapterName}</span>
            </div>
            <div className="admin-product-row__meta">
              <span>{r.images} photo{r.images > 1 ? "s" : ""}</span>
              <span>
                <strong>{r.priceLabel}</strong>
              </span>
              {r.variationCount > 0 ? (
                <span className="admin-tag admin-tag--accent">
                  {r.variationCount} variation{r.variationCount > 1 ? "s" : ""}
                </span>
              ) : null}
              <span
                className={`admin-tag ${
                  r.override ? "admin-tag--accent" : "admin-tag--muted"
                }`}
              >
                {r.override ? "Personnalisé" : "Par défaut"}
              </span>
            </div>
            <Link to={r.url} className="admin-cta admin-cta--small admin-cta--ghost">
              Éditer →
            </Link>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="admin-photo-grid__empty">Aucun produit ne correspond.</li>
        ) : null}
      </ul>
    </section>
  );
}
