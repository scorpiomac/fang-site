import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { pieceIdFromImageUrl } from "@/content/shop";
import { fileUrlFromPath } from "../api";
import { useAdmin } from "../AdminContext";

type Row = {
  chapterId: string;
  chapterName: string;
  characterSlug: string;
  characterName: string;
  pieceId: string;
  pieceLabel: string;
  cover: string;
  priceLabel: string;
  variationCount: number;
  override: boolean;
  url: string;
  shopSlug: string;
};

function pieceLabel(pieceId: string, index: number): string {
  if (pieceId === "cover") return "Cover";
  const match = pieceId.match(/produit-(\d+)/i);
  if (match) return `Pièce ${Number(match[1])}`;
  return `Pièce ${index + 1}`;
}

export function ProductsAdmin() {
  const { bundle } = useAdmin();
  const [search, setSearch] = useState("");

  const rows: Row[] = useMemo(() => {
    if (!bundle) return [];
    const out: Row[] = [];
    for (const c of bundle.catalog.chapters) {
      for (const ch of c.characters) {
        ch.images.forEach((imagePath, index) => {
          const pieceId = pieceIdFromImageUrl(imagePath);
          const charOv = bundle.productsOverrides?.[`${c.id}/${ch.slug}`];
          const pieceOv = bundle.productsOverrides?.[`${c.id}/${ch.slug}/${pieceId}`];
          const ov = { ...charOv, ...pieceOv };
          const vars = ov?.variations?.filter((v) => v.label?.trim()) ?? [];
          const prices =
            vars.length > 0 ? vars.map((v) => v.priceXof) : [ov?.priceXof ?? 125000];
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          const priceLabel =
            vars.length > 1 && min !== max
              ? `${min.toLocaleString("fr-SN")} – ${max.toLocaleString("fr-SN")} XOF`
              : `${(ov?.priceXof ?? 125000).toLocaleString("fr-SN")} XOF`;
          const label = pieceLabel(pieceId, index);
          out.push({
            chapterId: c.id,
            chapterName: c.name,
            characterSlug: ch.slug,
            characterName: ch.name,
            pieceId,
            pieceLabel: label,
            cover: imagePath,
            priceLabel,
            variationCount: vars.length,
            override: Boolean(charOv || pieceOv),
            url: `/admin/collections/${c.id}/personnages/${ch.slug}#piece-${pieceId}`,
            shopSlug: `${c.slug}-${ch.slug}-${pieceId}`,
          });
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
      r.chapterName.toLowerCase().includes(q) ||
      r.pieceLabel.toLowerCase().includes(q)
    );
  });

  return (
    <section className="admin-page">
      <header className="admin-page__head">
        <p className="admin-eyebrow">Produits</p>
        <h1>Catalogue boutique</h1>
        <p className="admin-page__lede">
          Chaque photo atelier est une pièce distincte en boutique. Cliquez pour éditer prix,
          tailles et description.
        </p>
      </header>

      <div className="admin-toolbar">
        <input
          className="admin-search"
          placeholder="Rechercher une pièce, un archétype ou un chapitre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <ul className="admin-product-list">
        {filtered.map((r) => (
          <li key={`${r.chapterId}/${r.characterSlug}/${r.pieceId}`} className="admin-product-row">
            <Link to={r.url} className="admin-product-row__media">
              {r.cover ? (
                <img src={fileUrlFromPath(r.cover)} alt={r.pieceLabel} />
              ) : (
                <span className="admin-card__placeholder">—</span>
              )}
            </Link>
            <div className="admin-product-row__main">
              <strong>
                {r.characterName} · {r.pieceLabel}
              </strong>
              <span>{r.chapterName}</span>
            </div>
            <div className="admin-product-row__meta">
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
            <div className="admin-page__actions">
              <Link to={r.url} className="admin-cta admin-cta--small admin-cta--ghost">
                Éditer →
              </Link>
              <a
                href={`/boutique/${r.shopSlug}`}
                target="_blank"
                rel="noreferrer"
                className="admin-cta admin-cta--small admin-cta--ghost"
              >
                Voir →
              </a>
            </div>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="admin-photo-grid__empty">Aucun produit ne correspond.</li>
        ) : null}
      </ul>
    </section>
  );
}
