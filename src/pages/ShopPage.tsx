import { useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { shopProducts } from "@/content/shop";
import { activeChapters, collectionChapters } from "@/content/collectionCatalog";
import { ProductCard } from "@/components/shop/ProductCard";
import { TrustStrip } from "@/components/shop/TrustStrip";
import { CommerceJourney } from "@/components/shop/CommerceJourney";
import { copy } from "@/content/copy";
import { Seo } from "@/components/Seo";
import { useSiteSettings } from "@/context/siteSettingsContext";

const FILTERS = [
  { id: "all", label: "Toutes les pièces" },
  ...collectionChapters
    .filter((c) => activeChapters.some((a) => a.id === c.id))
    .map((c) => ({ id: c.id, label: `${c.index} · ${c.name}` })),
];

const SORT_OPTIONS = [
  { id: "default", label: "Par défaut" },
  { id: "price-asc", label: "Prix croissant" },
  { id: "price-desc", label: "Prix décroissant" },
  { id: "name-asc", label: "Nom A → Z" },
  { id: "name-desc", label: "Nom Z → A" },
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
    <main id="contenu-principal" className="shop-page shop-shell commerce-shell">
      <Seo
        title={`Boutique — ${settings.brand.name}`}
        description={`Toutes les pièces de la saison 01. Production artisanale à Dakar. Livraison Sénégal & international.`}
        url={`${siteUrl}/boutique`}
      />
      <div className="commerce-hero commerce-hero--shop">
        <CommerceJourney
          steps={[
            { label: "Collection", to: "/collection" },
            { label: "Boutique", current: true },
            { label: "Commande", to: "/commande" },
          ]}
        />
        <header className="shop-page__hero">
          <p className="shop-page__eyebrow">Nel Fang Te Dundu — Boutique</p>
          <h1 className="shop-page__title">Porter la collection.</h1>
          <p className="shop-page__lede">{copy.conversionTagline}</p>
          <div className="commerce-hero__actions">
            <Link to="/collection" className="cta cta--ghost">
              {copy.shopFromCollection}
            </Link>
          </div>
        </header>
        <TrustStrip />
      </div>

      <div className="shop-page__toolbar" data-active={filter}>
        <div className="shop-page__filters" role="tablist" aria-label="Filtrer par chapitre">
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
        <div className="shop-page__controls">
          <input
            type="search"
            className="shop-search"
            placeholder="Rechercher une pièce, un personnage…"
            value={search}
            onChange={(e) => updateParam({ q: e.target.value || null, page: null })}
            aria-label="Recherche dans la boutique"
          />
          <select
            className="shop-sort"
            value={sort}
            onChange={(e) => updateParam({ tri: e.target.value === "default" ? null : e.target.value, page: null })}
            aria-label="Trier les pièces"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <p className="shop-page__count" aria-live="polite">
          {filtered.length} pièce{filtered.length > 1 ? "s" : ""}
          {activeChapterName ? ` — ${activeChapterName}` : ""}
          {search ? ` · « ${search} »` : ""}
        </p>
      </div>

      <div className="shop-page__grid shop-page__grid--premium">
        {paged.map((p, i) => (
          <div
            key={`${filter}-${p.id}-${safePage}`}
            className="shop-grid-item"
            style={{ "--stagger-delay": `${(i % 8) * 0.07}s` } as CSSProperties}
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="shop-page__empty">
          {search ? "Aucune pièce ne correspond à votre recherche." : copy.collectionEmptyChapter}
        </p>
      ) : null}

      {totalPages > 1 ? (
        <nav className="shop-pagination" aria-label="Pagination">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => updateParam({ page: String(safePage - 1) })}
          >
            ← Précédent
          </button>
          <span>
            Page {safePage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => updateParam({ page: String(safePage + 1) })}
          >
            Suivant →
          </button>
        </nav>
      ) : null}
    </main>
  );
}
