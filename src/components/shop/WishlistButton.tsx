import { useWishlist } from "@/context/wishlistContext";

type Props = {
  slug: string;
  className?: string;
  label?: boolean;
};

export function WishlistButton({ slug, className, label }: Props) {
  const { has, toggle } = useWishlist();
  const active = has(slug);
  return (
    <button
      type="button"
      className={`wishlist-btn${active ? " wishlist-btn--active" : ""} ${className ?? ""}`}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(slug);
      }}
    >
      <span aria-hidden="true" className="wishlist-btn__icon">
        {active ? "♥" : "♡"}
      </span>
      {label ? (
        <span className="wishlist-btn__label">
          {active ? "Dans mes favoris" : "Ajouter aux favoris"}
        </span>
      ) : null}
    </button>
  );
}
