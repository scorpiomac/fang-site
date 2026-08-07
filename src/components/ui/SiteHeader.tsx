import { useEffect, useId, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { copy } from "@/content/copy";
import { publicUrl } from "@/lib/publicUrl";
import { useCart } from "@/context/useCart";
import { useCustomer } from "@/context/customerContext";

const primaryNav = [
  { id: "accueil", label: "Accueil", to: "/" },
  { id: "boutique", label: "Boutique", to: "/boutique" },
  { id: "archetype", label: "Archétype", to: "/archetype" },
  { id: "contact", label: "Contact", to: "/contact" },
] as const;

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isShop = location.pathname.startsWith("/boutique");
  const isArchetype =
    location.pathname.startsWith("/archetype") || location.pathname.startsWith("/collection");
  const isContact = location.pathname.startsWith("/contact");
  const { openDrawer, countItems } = useCart();
  const { customer } = useCustomer();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Ferme le menu au changement de page
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Bloque le scroll fond quand le menu est ouvert
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  function isNavActive(to: string): boolean {
    if (to === "/") return isHome;
    if (to === "/boutique") return isShop;
    if (to === "/archetype") return isArchetype;
    if (to === "/contact") return isContact;
    return false;
  }

  return (
    <header
      className={`site-header ${scrolled ? "site-header--scrolled" : ""}${menuOpen ? " site-header--menu-open" : ""}`}
    >
      <Link to="/" className="site-header__brand" aria-label="FANG — Accueil">
        <img src={publicUrl("logo/fang-logo-1.png")} alt="" aria-hidden="true" />
        <span>{copy.brand}</span>
      </Link>

      <nav className="site-header__nav" aria-label="Navigation principale" id={menuId}>
        {primaryNav.map((item) => {
          const active = isNavActive(item.to);
          return (
            <Link
              key={item.id}
              to={item.to}
              className={`site-header__link ${item.to === "/boutique" ? "site-header__link--shop" : ""} ${active ? "is-active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="site-header__tools">
        <Link
          to="/compte"
          className={`site-header__account${location.pathname === "/compte" ? " is-active" : ""}`}
          aria-label={customer ? `Mon compte — ${customer.name}` : "Mon compte"}
        >
          <span className="site-header__account-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.4" />
              <path
                d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="site-header__account-label">
            {customer ? customer.name.split(" ")[0] : "Compte"}
          </span>
        </Link>
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
        <button
          type="button"
          className={`site-header__burger${menuOpen ? " is-open" : ""}`}
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>

      {menuOpen ? (
        <button
          type="button"
          className="site-header__scrim"
          aria-label="Fermer le menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
    </header>
  );
}
