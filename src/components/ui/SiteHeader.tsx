import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { copy } from "@/content/copy";
import { publicUrl } from "@/lib/publicUrl";
import { useCart } from "@/context/useCart";

const primaryNav = [
  { id: "personnages", label: "Casting", kind: "hash" as const },
  { id: "boutique", label: "Boutique", kind: "route" as const },
  { id: "manifeste", label: "Manifeste", kind: "hash" as const },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isShop = location.pathname.startsWith("/boutique");
  const { openDrawer, countItems } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const hashHref = (id: string) => (isHome ? `#${id}` : `/#${id}`);

  return (
    <header className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}>
      <Link to="/" className="site-header__brand" aria-label="FANG — Accueil">
        <img src={publicUrl("logo/fang-logo-1.png")} alt="" aria-hidden="true" />
        <span>{copy.brand}</span>
      </Link>

      <nav className="site-header__nav" aria-label="Navigation principale">
        {primaryNav.map((item) => {
          if (item.kind === "route") {
            return (
              <Link
                key={item.id}
                to="/boutique"
                className={`site-header__link site-header__link--shop ${isShop ? "is-active" : ""}`}
              >
                {item.label}
              </Link>
            );
          }
          return (
            <a key={item.id} href={hashHref(item.id)} className="site-header__link">
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="site-header__tools">
        <button
          type="button"
          className={`site-header__cart ${countItems > 0 ? "site-header__cart--filled" : ""}`}
          onClick={openDrawer}
          aria-label={`Panier${countItems ? `, ${countItems} article${countItems > 1 ? "s" : ""}` : ""}`}
        >
          <span className="site-header__cart-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9 8a3 3 0 116 0v2h2a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8a2 2 0 012-2h2V8z"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
          </span>
          <span className="site-header__cart-label">Panier</span>
          {countItems > 0 ? (
            <span className="site-header__cart-badge">{countItems > 99 ? "99+" : countItems}</span>
          ) : null}
        </button>
      </div>
    </header>
  );
}
