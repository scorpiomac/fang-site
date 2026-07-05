import { useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { shopProducts } from "@/content/shop";
import { activeChapters, collectionChapters } from "@/content/collectionCatalog";
import { ProductCard } from "@/components/shop/ProductCard";
import { ShopSortSelect } from "@/components/shop/ShopSortSelect";
import { copy } from "@/content/copy";
import { Seo } from "@/components/Seo";
import { useSiteSettings } from "@/context/siteSettingsContext";

const FILTERS = [
  { id: "all", label: "Toutes" },
  ...collectionChapters
    .filter((c) => activeChapters.some((a) => a.id === c.id))
    .map((c) => ({ id: c.id, label: `${c.index} · ${c.name}` })),
];

const SORT_OPTIONS = [
  { id: "default", label: "Par défaut" },
  { id: "price-asc", label: "Prix ↑" },
  { id: "price-desc", label: "Prix ↓" },
  { id: "name-asc", label: "A → Z" },
  { id: "name-desc", label: "Z → A" },
] as const;

type SortId = (typeof SORT_OPTIONS)[number]["id"];

const PAGE_SIZE = 12;

function isValidChapterParam(id: string | null): id is string {
  return Boolean(id && activeChapters.some((c) => c.id === id));
}

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlChapter = searchParams.get("chapitre") ?? searchParams.get("personnage");
  const filter = isValidChapterParam(urlChapter) ? urlChapter : "all";
  const search = searchParams.get("q") ?? "";
  const sort = (searchParams.get("tri") as SortId) ?? "default";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const updateParam = (mutations: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(mutations)) {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    }
    setSearchParams(next, { replace: true });
  };

  const applyFilter = (id: string) => {
    if (id === "all") {
      updateParam({ chapitre: null, personnage: null, page: null });
    } else {
      updateParam({ chapitre: id, personnage: null, page: null });
    }
  };

  useEffect(() => {
    const raw = searchParams.get("chapitre") ?? searchParams.get("personnage");
    if (raw && !isValidChapterParam(raw)) {
      updateParam({ chapitre: null, personnage: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => {
    let list = filter === "all" ? shopProducts : shopProducts.filter((p) => p.chapterId === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.characterName.toLowerCase().includes(q) ||
          p.chapterLabel.toLowerCase().includes(q) ||
          p.material.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.priceXof - b.priceXof);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.priceXof - a.priceXof);
        break;
      case "name-asc":
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        list = [...list].sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }
    return list;
  }, [filter, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const activeChapterName =
    filter !== "all" ? activeChapters.find((c) => c.id === filter)?.name : undefined;

  const { settings } = useSiteSettings();
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <main id="contenu-principal" className="shop-page shop-page--catalog shop-shell">
      <Seo
        title={`Boutique — ${settings.brand.name}`}
        description="Toutes les pièces de la saison 01. Production artisanale à Dakar."
        url={`${siteUrl}/boutique`}
      />

      <header className="shop-catalog-header">
        <Link to="/collection" className="shop-catalog-header__back">
          ← Collection
        </Link>
        <div className="shop-catalog-header__row">
          <h1 className="shop-catalog-header__title">Boutique</h1>
          <p className="shop-catalog-header__count" aria-live="polite">
            {filtered.length} pièce{filtered.length > 1 ? "s" : ""}
            {activeChapterName ? ` — ${activeChapterName}` : ""}
          </p>
        </div>
      </header>

      <div className="shop-catalog-bar">
        <div className="shop-catalog-filters" role="tablist" aria-label="Filtrer par chapitre">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={`shop-catalog-filter${filter === f.id ? " shop-catalog-filter--active" : ""}`}
              onClick={() => applyFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="shop-catalog-tools">
          <input
            type="search"
            className="shop-catalog-search"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => updateParam({ q: e.target.value || null, page: null })}
            aria-label="Recherche"
          />
          <ShopSortSelect
            value={sort}
            options={SORT_OPTIONS}
            aria-label="Trier"
            onChange={(next) =>
              updateParam({ tri: next === "default" ? null : next, page: null })
            }
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="shop-catalog-empty">
          {search ? "Aucune pièce ne correspond à votre recherche." : copy.collectionEmptyChapter}
        </p>
      ) : (
        <div className="shop-catalog-grid">
          {paged.map((p, i) => (
            <div
              key={`${filter}-${p.id}-${safePage}`}
              className="shop-catalog-item"
              style={{ "--stagger-delay": `${(i % 8) * 0.05}s` } as CSSProperties}
            >
              <ProductCard product={p} variant="catalog" />
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav className="shop-catalog-pagination" aria-label="Pagination">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => updateParam({ page: String(safePage - 1) })}
            aria-label="Page précédente"
          >
            ←
          </button>
          <span>
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => updateParam({ page: String(safePage + 1) })}
            aria-label="Page suivante"
          >
            →
          </button>
        </nav>
      ) : null}
    </main>
  );
}
