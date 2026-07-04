import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { customerApi, type AccountSummary, type CustomerOrder } from "@/lib/customerApi";
import { formatPriceXof } from "@/content/shop";
import { OrderCard } from "@/components/account/OrderCard";

export function AccountOverview() {
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [recent, setRecent] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([customerApi.fetchSummary(), customerApi.fetchOrders()])
      .then(([sum, orders]) => {
        setSummary(sum.summary);
        setRecent(orders.orders.slice(0, 3));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="account-loading">Chargement…</p>;
  if (error) return <p className="account-page__error">{error}</p>;

  return (
    <section className="account-section">
      <header className="account-section__head">
        <h2>Tableau de bord</h2>
        <p>Vue d&apos;ensemble de votre activité sur la boutique FANG.</p>
      </header>

      <div className="account-kpis">
        <article>
          <strong>{summary?.totalOrders ?? 0}</strong>
          <span>Commandes</span>
        </article>
        <article>
          <strong>{summary?.activeOrders ?? 0}</strong>
          <span>En cours</span>
        </article>
        <article>
          <strong>{formatPriceXof(summary?.totalSpentXof ?? 0)}</strong>
          <span>Total FCFA</span>
        </article>
      </div>

      <div className="account-section__block">
        <div className="account-section__block-head">
          <h3>Dernières commandes</h3>
          <Link to="/compte/commandes">Tout voir →</Link>
        </div>
        {recent.length === 0 ? (
          <p className="account-empty">
            Aucune commande. <Link to="/boutique">Découvrir la boutique</Link>
          </p>
        ) : (
          <div className="account-orders-grid">
            {recent.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
