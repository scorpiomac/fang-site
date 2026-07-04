import { useCart } from "@/context/useCart";
import { resolveMediaUrl } from "@/lib/publicUrl";

export function CartToast() {
  const { toast, dismissToast, openDrawer } = useCart();

  return (
    <div
      className={`cart-toast ${toast ? "cart-toast--visible" : ""}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {toast ? (
        <>
          <div className="cart-toast__media">
            <img src={resolveMediaUrl(toast.image)} alt="" />
          </div>
          <div className="cart-toast__body">
            <p className="cart-toast__label">Ajouté au panier</p>
            <p className="cart-toast__title">{toast.title}</p>
          </div>
          <div className="cart-toast__actions">
            <button
              type="button"
              className="cart-toast__view"
              onClick={() => {
                dismissToast();
                openDrawer();
              }}
            >
              Voir le panier
            </button>
            <button
              type="button"
              className="cart-toast__close"
              onClick={dismissToast}
              aria-label="Fermer la notification"
            >
              ×
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
