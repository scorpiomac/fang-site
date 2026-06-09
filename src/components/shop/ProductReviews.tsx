import { useEffect, useState } from "react";
import { useCustomer } from "@/context/customerContext";

type ReviewItem = {
  id: string;
  customerName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
};

type Summary = { count: number; average: number };

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const full = Math.round(value);
  return (
    <span aria-label={`${value} étoiles sur 5`} className="rating-stars" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= full ? "rating-stars__star is-on" : "rating-stars__star"}>
          ★
        </span>
      ))}
    </span>
  );
}

export function ProductReviews({ productSlug }: { productSlug: string }) {
  const { customer } = useCustomer();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState<Summary>({ count: 0, average: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerName: customer?.name ?? "",
    rating: 5,
    title: "",
    body: "",
  });

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/store/products/${encodeURIComponent(productSlug)}/reviews`);
      if (!res.ok) return;
      const data = (await res.json()) as { reviews: ReviewItem[]; summary: Summary };
      setReviews(data.reviews);
      setSummary(data.summary);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSlug]);

  useEffect(() => {
    if (customer) setForm((f) => ({ ...f, customerName: customer.name }));
  }, [customer]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/store/products/${encodeURIComponent(productSlug)}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Erreur");
      setSubmitted(true);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="product-reviews">
      <header className="product-reviews__head">
        <div>
          <h2>Avis clients</h2>
          {summary.count > 0 ? (
            <p className="product-reviews__summary">
              <Stars value={summary.average} size={20} />{" "}
              <strong>{summary.average}/5</strong> · {summary.count} avis
            </p>
          ) : (
            <p>Aucun avis pour cette pièce — soyez le premier !</p>
          )}
        </div>
        {!showForm ? (
          <button
            type="button"
            className="cta cta--ghost cta--small"
            onClick={() => setShowForm(true)}
          >
            Laisser un avis
          </button>
        ) : null}
      </header>

      {submitted ? (
        <p className="product-reviews__thanks">
          Merci pour votre avis ! Il sera publié après modération.
        </p>
      ) : null}

      {showForm ? (
        <form className="product-reviews__form" onSubmit={onSubmit}>
          <label>
            Nom (affiché)
            <input
              required
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            />
          </label>
          <label>
            Note
            <div className="rating-input">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={n <= form.rating ? "rating-input__star is-on" : "rating-input__star"}
                  onClick={() => setForm({ ...form, rating: n })}
                  aria-label={`${n} étoiles`}
                >
                  ★
                </button>
              ))}
            </div>
          </label>
          <label>
            Titre (optionnel)
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={100}
            />
          </label>
          <label>
            Votre avis
            <textarea
              required
              minLength={5}
              rows={4}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </label>
          {error ? <p className="product-reviews__error">{error}</p> : null}
          <div className="product-reviews__form-actions">
            <button type="button" className="cta cta--ghost cta--small" onClick={() => setShowForm(false)}>
              Annuler
            </button>
            <button type="submit" className="cta cta--solid cta--small" disabled={submitting}>
              {submitting ? "Envoi…" : "Envoyer"}
            </button>
          </div>
        </form>
      ) : null}

      {loading ? <p>Chargement des avis…</p> : null}

      {reviews.length > 0 ? (
        <ul className="product-reviews__list">
          {reviews.map((r) => (
            <li key={r.id} className="product-review">
              <div className="product-review__head">
                <strong>{r.customerName}</strong>
                <Stars value={r.rating} />
                <span className="product-review__date">
                  {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
              {r.title ? <p className="product-review__title">{r.title}</p> : null}
              <p className="product-review__body">{r.body}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
