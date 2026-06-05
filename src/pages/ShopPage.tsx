import { useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { shopProducts } from "@/content/shop";
import { chapters } from "@/content/chapters";
import { ProductCard } from "@/components/shop/ProductCard";

const FILTERS = [
  { id: "all", label: "Tout" },
  ...chapters.map((c) => ({ id: c.id, label: `Personnage · ${c.name}` })),
];

function isValidPersonnageParam(id: string | null): id is string {
  return Boolean(id && chapters.some((c) => c.id === id));
}

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPersonnage = searchParams.get("personnage");
  const filter = isValidPersonnageParam(urlPersonnage) ? urlPersonnage : "all";

  const applyFilter = (id: string) => {
    const next = new URLSearchParams(searchParams);
    if (id === "all") {
      next.delete("personnage");
    } else {
      next.set("personnage", id);
    }
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const raw = searchParams.get("personnage");
    if (raw && !isValidPersonnageParam(raw)) {
      const next = new URLSearchParams(searchParams);
      next.delete("personnage");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const list = useMemo(() => {
    if (filter === "all") return shopProducts;
    return shopProducts.filter((p) => p.chapterId === filter);
  }, [filter]);

  const activeChapterName =
    filter !== "all" ? chapters.find((c) => c.id === filter)?.name : undefined;

  return (
    <main id="contenu-principal" className="shop-page shop-shell">
      <header className="shop-page__hero">
        <Link to="/" className="shop-page__back">
          ← {`Retour à l'expérience`}
        </Link>
        <p className="shop-page__eyebrow">Nel Fang Te Dundu — Boutique</p>
        <h1 className="shop-page__title">Sept pièces, sept personnages.</h1>
        <p className="shop-page__lede">
          Chaque silhouette est produite à Dakar avec l'équipe atelier. Tailles sur mesure possibles
          sur demande — écrivez-nous après validation du panier.
        </p>
        <ul className="shop-page__trust" aria-label="Engagements">
          <li>
            <strong>Atelier Dakar</strong>
            <span>Coupe et finitions à la main</span>
          </li>
          <li>
            <strong>Production lente</strong>
            <span>2 à 6 semaines selon la pièce</span>
          </li>
          <li>
            <strong>Sur mesure possible</strong>
            <span>À préciser après le panier</span>
          </li>
        </ul>
      </header>

      <div className="shop-page__toolbar" data-active={filter}>
        <div className="shop-page__filters" role="tablist" aria-label="Filtrer par personnage">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={`shop-filter ${filter === f.id ? "shop-filter--active" : ""}`}
              onClick={() => applyFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="shop-page__count" aria-live="polite">
          {list.length} pièce{list.length > 1 ? "s" : ""}
          {activeChapterName ? ` — ${activeChapterName}` : ""}
        </p>
      </div>

      <div className="shop-page__grid">
        {list.map((p, i) => (
          <div
            key={`${filter}-${p.id}`}
            className="shop-grid-item"
            style={{ "--stagger-delay": `${(i % 8) * 0.07}s` } as CSSProperties}
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="shop-page__empty">Aucune pièce dans ce filtre pour le moment.</p>
      ) : null}
    </main>
  );
}
