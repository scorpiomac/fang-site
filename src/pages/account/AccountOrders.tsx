import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { customerApi, type CustomerOrder } from "@/lib/customerApi";
import { OrderCard } from "@/components/account/OrderCard";

const FILTERS = [
  { id: "", label: "Toutes" },
  { id: "active", label: "En cours" },
  { id: "delivered", label: "Livrées" },
  { id: "cancelled", label: "Annulées" },
];

export function AccountOrders() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    customerApi
      .fetchOrders()
      .then(({ orders: list }) => setOrders(list))
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!filter) return orders;
    if (filter === "active") {
      return orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
    }
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  return (
    <section className="account-section">
      <header className="account-section__head">
        <h2>Mes commandes</h2>
        <p>{orders.length} commande{orders.length > 1 ? "s" : ""} au total</p>
      </header>

      <div className="account-tabs account-tabs--filter">
        {FILTERS.map((f) => (
          <button
            key={f.id || "all"}
            type="button"
            className={`account-tab${filter === f.id ? " is-active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <p className="account-loading">Chargement…</p> : null}
      {error ? <p className="account-page__error">{error}</p> : null}

      {!loading && filtered.length === 0 ? (
        <p className="account-empty">
          Aucune commande pour ce filtre.{" "}
          <Link to="/boutique">Parcourir la boutique</Link>
        </p>
      ) : null}

      <div className="account-orders-grid">
        {filtered.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </div>

    </section>
  );
}
