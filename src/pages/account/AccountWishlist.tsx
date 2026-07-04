import { Link } from "react-router-dom";
import { useWishlist } from "@/context/wishlistContext";
import { shopProducts, formatPriceXof } from "@/content/shop";
import { useCart } from "@/context/useCart";

export function AccountWishlist() {
  const { slugs, remove } = useWishlist();
  const { addItem } = useCart();
  const items = slugs
    .map((slug) => shopProducts.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <section className="account-page">
      <header className="account-page__head">
        <div>
          <h1>Mes favoris</h1>
          <p>Vos pièces sauvegardées pour plus tard.</p>
        </div>
      </header>

      {items.length === 0 ? (
        <p className="account-empty">
          Aucun favori pour l'instant. Ajoutez des pièces depuis la{" "}
          <Link to="/boutique">boutique</Link>.
        </p>
      ) : (
        <ul className="account-wishlist">
          {items.map((p) => (
            <li key={p.slug} className="account-wishlist__item">
              <Link to={`/boutique/${p.slug}`} className="account-wishlist__media">
                <img src={p.coverImage || p.images[0]} alt="" loading="lazy" />
              </Link>
              <div className="account-wishlist__body">
                <Link to={`/boutique/${p.slug}`}>
                  <strong>{p.name}</strong>
                </Link>
                <p>{p.chapterLabel}</p>
                <p className="account-wishlist__price">
                  {formatPriceXof(p.priceXof)} FCFA
                </p>
                <div className="account-wishlist__actions">
                  <button
                    type="button"
                    className="cta cta--solid cta--small"
                    onClick={() => {
                      const defaultSize = p.sizes[0];
                      if (defaultSize) addItem(p, defaultSize, { silent: true });
                    }}
                  >
                    Ajouter au panier
                  </button>
                  <button
                    type="button"
                    className="account-form__link account-form__link--danger"
                    onClick={() => remove(p.slug)}
                  >
                    Retirer
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
