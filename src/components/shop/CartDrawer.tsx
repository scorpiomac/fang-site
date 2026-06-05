import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useCart } from "@/context/useCart";
import { formatPriceXof } from "@/content/shop";
import { resolveMediaUrl } from "@/lib/publicUrl";

export function CartDrawer() {
  const {
    lines,
    drawerOpen,
    closeDrawer,
    removeLine,
    setQty,
    subtotalXof,
    countItems,
  } = useCart();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [drawerOpen, closeDrawer]);

  return (
    <>
      <div
        className={`cart-drawer__backdrop ${drawerOpen ? "cart-drawer__backdrop--open" : ""}`}
        aria-hidden={!drawerOpen}
        onClick={closeDrawer}
      />
      <aside
        className={`cart-drawer ${drawerOpen ? "cart-drawer--open" : ""}`}
        aria-hidden={!drawerOpen}
        aria-label="Panier"
      >
        <header className="cart-drawer__head">
          <h2 className="cart-drawer__title">Panier</h2>
          <button type="button" className="cart-drawer__close" onClick={closeDrawer}>
            Fermer
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="cart-drawer__empty">
            <p>Votre panier est vide.</p>
            <Link to="/boutique" className="cta cta--solid" onClick={closeDrawer}>
              Parcourir la boutique
            </Link>
          </div>
        ) : (
          <>
            <ul className="cart-drawer__lines">
              {lines.map((l) => (
                <li key={l.lineId} className="cart-line">
                  <div className="cart-line__media">
                    <img src={resolveMediaUrl(l.image)} alt="" loading="lazy" />
                  </div>
                  <div className="cart-line__body">
                    <Link to={`/boutique/${l.slug}`} onClick={closeDrawer}>
                      {l.title}
                    </Link>
                    <p className="cart-line__meta">
                      Taille {l.size} · {formatPriceXof(l.priceXof)} FCFA
                    </p>
                    <div className="cart-line__qty">
                      <button
                        type="button"
                        aria-label="Diminuer"
                        onClick={() =>
                          l.qty <= 1 ? removeLine(l.lineId) : setQty(l.lineId, l.qty - 1)
                        }
                      >
                        −
                      </button>
                      <span>{l.qty}</span>
                      <button
                        type="button"
                        aria-label="Augmenter"
                        onClick={() => setQty(l.lineId, l.qty + 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="cart-line__remove"
                        onClick={() => removeLine(l.lineId)}
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <footer className="cart-drawer__foot">
              <p className="cart-drawer__subtotal">
                <span>Sous-total ({countItems} article{countItems > 1 ? "s" : ""})</span>
                <strong>{formatPriceXof(subtotalXof)} FCFA</strong>
              </p>
              <p className="cart-drawer__hint">
                Livraison et paiement confirmés à l’étape suivante — production artisanale à Dakar.
              </p>
              <Link
                to="/commande"
                className="cta cta--solid cart-drawer__checkout"
                onClick={closeDrawer}
              >
                Commander
              </Link>
              <button type="button" className="cart-drawer__continue" onClick={closeDrawer}>
                Continuer vos achats
              </button>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
