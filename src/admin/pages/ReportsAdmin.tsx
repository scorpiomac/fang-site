import { useEffect, useState } from "react";
import { adminApi } from "../api";
import { formatPriceXof } from "@/content/shop";

type ReportsData = Awaited<ReturnType<typeof adminApi.fetchReports>>;

export function ReportsAdmin() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [months, setMonths] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    setError("");
    adminApi
      .fetchReports(months)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [months]);

  const maxRevenue = data ? Math.max(1, ...data.monthly.map((m) => m.revenue)) : 1;

  return (
    <section className="admin-page">
      <header className="admin-page__head admin-page__head--row">
        <div>
          <p className="admin-eyebrow">Commerce</p>
          <h1>Rapports</h1>
          <p className="admin-page__lede">
            Vue d'ensemble : chiffre d'affaires par mois, top produits et meilleurs clients.
          </p>
        </div>
        <div>
          <label style={{ display: "flex", flexDirection: "column", fontSize: 12 }}>
            <span style={{ opacity: 0.7 }}>Période</span>
            <select value={months} onChange={(e) => setMonths(Number(e.target.value))}>
              <option value={3}>3 derniers mois</option>
              <option value={6}>6 derniers mois</option>
              <option value={12}>12 derniers mois</option>
              <option value={24}>24 derniers mois</option>
            </select>
          </label>
        </div>
      </header>

      {loading ? <p>Chargement…</p> : null}
      {error ? <p className="form-feedback form-feedback--error">{error}</p> : null}

      {data ? (
        <>
          <div className="admin-kpis">
            <article>
              <p className="admin-kpi__value">{formatPriceXof(data.summary.totalRevenue)}</p>
              <p>CA total (hors annulées)</p>
            </article>
            <article>
              <p className="admin-kpi__value">{data.summary.validOrders}</p>
              <p>Commandes valides</p>
            </article>
            <article>
              <p className="admin-kpi__value">{formatPriceXof(data.summary.avgOrder)}</p>
              <p>Panier moyen</p>
            </article>
            <article>
              <p className="admin-kpi__value">{data.summary.conversion}%</p>
              <p>Taux de conversion (confirmées / total)</p>
            </article>
          </div>

          <section style={{ marginTop: 32 }}>
            <h2 style={{ marginBottom: 12 }}>CA mensuel</h2>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 220, padding: "0 8px" }}>
              {data.monthly.map((m) => {
                const h = Math.round((m.revenue / maxRevenue) * 180) + 4;
                return (
                  <div
                    key={m.key}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      minWidth: 50,
                    }}
                    title={`${m.label} — ${formatPriceXof(m.revenue)} · ${m.orders} cmd`}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: h,
                        background: "linear-gradient(180deg, var(--gold, #c9a66b), rgba(201,166,107,0.4))",
                        borderRadius: "4px 4px 0 0",
                        marginBottom: 4,
                      }}
                    />
                    <span style={{ fontSize: 11, opacity: 0.7, transform: "rotate(-45deg)", whiteSpace: "nowrap", transformOrigin: "left top" }}>
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section style={{ marginTop: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <h2 style={{ marginBottom: 12 }}>Top produits</h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Qté</th>
                    <th>CA</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((p) => (
                    <tr key={p.slug}>
                      <td>{p.name}</td>
                      <td>{p.quantity}</td>
                      <td>{formatPriceXof(p.revenue)}</td>
                    </tr>
                  ))}
                  {data.topProducts.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: "center", opacity: 0.6 }}>Pas encore de données</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div>
              <h2 style={{ marginBottom: 12 }}>Top clients</h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Cmd</th>
                    <th>CA</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topCustomers.map((c) => (
                    <tr key={c.key}>
                      <td>
                        <div>{c.name}</div>
                        <small style={{ opacity: 0.6 }}>{c.email}</small>
                      </td>
                      <td>{c.orders}</td>
                      <td>{formatPriceXof(c.revenue)}</td>
                    </tr>
                  ))}
                  {data.topCustomers.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: "center", opacity: 0.6 }}>Pas encore de données</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}
