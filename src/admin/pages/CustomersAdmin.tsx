import { useEffect, useState } from "react";
import { adminApi } from "../api";
import { useAdmin } from "../AdminContext";
import type { Customer } from "@/lib/customerApi";

type AdminCustomer = Customer & { orderCount?: number };

export function CustomersAdmin() {
  const { setToast } = useAdmin();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    adminApi
      .fetchCustomers()
      .then(({ customers: list }) => setCustomers(list))
      .catch((err) => setToast(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [setToast]);

  const filtered = customers.filter(
    (c) =>
      !query.trim() ||
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <section className="admin-page">
      <header className="admin-page__head admin-page__head--row">
        <div>
          <p className="admin-eyebrow">Boutique</p>
          <h1>Clients</h1>
          <p className="admin-page__lede">
            Comptes créés sur le site. Les commandes invitées sans compte n&apos;apparaissent pas
            ici — consultez l&apos;onglet Commandes.
          </p>
        </div>
      </header>

      <label className="admin-search">
        <span>Rechercher</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nom ou e-mail…"
        />
      </label>

      {loading ? <p className="admin-loading">Chargement…</p> : null}

      <ul className="admin-promo-list">
        {filtered.map((c) => (
          <li key={c.id} className="admin-promo-row">
            <div className="admin-promo-row__main">
              <strong>{c.name}</strong>
              <span>{c.email}</span>
            </div>
            <div className="admin-promo-row__meta">
              <span>{c.phone || "—"}</span>
              <span>
                {c.city ? `${c.city}, ` : ""}
                {c.country}
              </span>
              {c.lastLoginAt ? (
                <span>Dernière connexion {new Date(c.lastLoginAt).toLocaleString("fr-FR")}</span>
              ) : (
                <span className="admin-tag admin-tag--muted">Jamais connecté</span>
              )}
            </div>
          </li>
        ))}
        {!loading && filtered.length === 0 ? (
          <li className="admin-photo-grid__empty">Aucun client trouvé.</li>
        ) : null}
      </ul>
    </section>
  );
}
