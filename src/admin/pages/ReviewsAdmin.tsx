import { useEffect, useState } from "react";
import { adminApi, type AdminReview } from "../api";
import { useAdmin } from "../AdminContext";

const TABS = [
  { id: "pending", label: "À modérer" },
  { id: "approved", label: "Publiés" },
  { id: "rejected", label: "Rejetés" },
  { id: "", label: "Tous" },
];

export function ReviewsAdmin() {
  const { setToast } = useAdmin();
  const [tab, setTab] = useState<string>("pending");
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const { reviews } = await adminApi.fetchReviews(tab || undefined);
      setReviews(reviews);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const moderate = async (id: string, status: "approved" | "rejected" | "pending") => {
    try {
      await adminApi.moderateReview(id, status);
      await refresh();
      setToast(`Avis ${status === "approved" ? "publié" : status === "rejected" ? "rejeté" : "remis en attente"}`);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cet avis ?")) return;
    try {
      await adminApi.deleteReview(id);
      await refresh();
      setToast("Avis supprimé");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <section className="admin-page">
      <header className="admin-page__head">
        <p className="admin-eyebrow">Modération</p>
        <h1>Avis clients</h1>
        <p className="admin-page__lede">
          Les nouveaux avis sont en attente de modération avant publication.
        </p>
      </header>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.id || "all"}
            type="button"
            className={`admin-tab${tab === t.id ? " is-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <p className="admin-loading">Chargement…</p> : null}

      <ul className="admin-orders-list">
        {reviews.map((r) => (
          <li key={r.id} className="admin-promo-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <strong>{r.customerName}</strong> — {r.rating}/5 ★
                <p className="admin-help">
                  Produit : <code>{r.productSlug}</code> · {new Date(r.createdAt).toLocaleString("fr-FR")}
                </p>
              </div>
              <span
                className={`admin-tag admin-tag--${
                  r.status === "approved" ? "accent" : r.status === "rejected" ? "warning" : "muted"
                }`}
              >
                {r.status}
              </span>
            </div>
            {r.title ? <p><strong>{r.title}</strong></p> : null}
            <p>{r.body}</p>
            <div style={{ display: "flex", gap: 8 }}>
              {r.status !== "approved" ? (
                <button
                  type="button"
                  className="admin-cta admin-cta--small"
                  onClick={() => moderate(r.id, "approved")}
                >
                  Publier
                </button>
              ) : null}
              {r.status !== "rejected" ? (
                <button
                  type="button"
                  className="admin-cta admin-cta--small admin-cta--ghost"
                  onClick={() => moderate(r.id, "rejected")}
                >
                  Rejeter
                </button>
              ) : null}
              <button
                type="button"
                className="admin-link admin-link--danger"
                onClick={() => remove(r.id)}
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
        {!loading && reviews.length === 0 ? (
          <li className="admin-photo-grid__empty">Aucun avis pour ce filtre.</li>
        ) : null}
      </ul>
    </section>
  );
}
