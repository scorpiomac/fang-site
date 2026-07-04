import { useEffect, useMemo, useState } from "react";
import { adminApi, getToken, type AdminOrder, type OrderStatus, type PaymentStatus } from "../api";
import { useAdmin } from "../AdminContext";
import { formatPriceXof } from "@/content/shop";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  in_production: "En production",
  ready: "Prête",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: "Non payée",
  partial: "Partiel",
  paid: "Payée",
  refunded: "Remboursée",
};

export function OrdersAdmin() {
  const { setToast } = useAdmin();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [exporting, setExporting] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const { orders: list } = await adminApi.fetchOrders(filter || undefined);
      setOrders(list);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [filter]);

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === "pending").length;
    const revenue = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((s, o) => s + o.totalXof, 0);
    return { pending, revenue, count: orders.length };
  }, [orders]);

  const patchOrder = async (
    id: string,
    patch: Partial<Pick<AdminOrder, "status" | "paymentStatus" | "internalNote">>
  ) => {
    try {
      const { order } = await adminApi.patchOrder(id, patch);
      setOrders((prev) => prev.map((o) => (o.id === id ? order : o)));
      setSelected(order);
      setToast("Commande mise à jour");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <section className="admin-page">
      <header className="admin-page__head admin-page__head--row">
        <div>
          <p className="admin-eyebrow">Commerce</p>
          <h1>Commandes</h1>
          <p className="admin-page__lede">
            Toutes les commandes passées sur le site. Mettez à jour le statut et le paiement
            au fil de la production atelier.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" className="admin-cta admin-cta--ghost" onClick={refresh}>
            Actualiser
          </button>
          <button
            type="button"
            className="admin-cta"
            disabled={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                const params = new URLSearchParams();
                if (filter) params.set("status", filter);
                if (dateFrom) params.set("from", dateFrom);
                if (dateTo) params.set("to", dateTo);
                const token = getToken();
                const res = await fetch(`/api/admin/orders.csv?${params.toString()}`, {
                  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });
                if (!res.ok) throw new Error("Export impossible");
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `fang-commandes-${new Date().toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                setToast("Export CSV téléchargé");
              } catch (err) {
                setToast(err instanceof Error ? err.message : "Erreur export");
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? "Export…" : "Exporter CSV"}
          </button>
        </div>
      </header>

      <div className="admin-filters" style={{ display: "flex", gap: 10, alignItems: "end", marginBottom: 12, flexWrap: "wrap" }}>
        <label style={{ display: "flex", flexDirection: "column", fontSize: 12 }}>
          <span style={{ opacity: 0.7 }}>Du</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ padding: 6 }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", fontSize: 12 }}>
          <span style={{ opacity: 0.7 }}>Au</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ padding: 6 }}
          />
        </label>
        {(dateFrom || dateTo) && (
          <button
            type="button"
            className="admin-cta admin-cta--ghost admin-cta--small"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
          >
            Réinitialiser
          </button>
        )}
      </div>

      <div className="admin-kpis admin-kpis--small">
        <article>
          <p className="admin-kpi__value">{stats.count}</p>
          <p>Commandes affichées</p>
        </article>
        <article>
          <p className="admin-kpi__value">{stats.pending}</p>
          <p>En attente</p>
        </article>
        <article>
          <p className="admin-kpi__value">{formatPriceXof(stats.revenue)}</p>
          <p>CA (filtre actuel)</p>
        </article>
      </div>

      <div className="admin-tabs">
        {[
          { id: "", label: "Toutes" },
          ...Object.entries(STATUS_LABELS).map(([id, label]) => ({ id, label })),
        ].map((t) => (
          <button
            key={t.id || "all"}
            type="button"
            className={`admin-tab${filter === t.id ? " is-active" : ""}`}
            onClick={() => setFilter(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <p className="admin-loading">Chargement…</p> : null}

      <ul className="admin-orders-list">
        {orders.map((o) => (
          <li key={o.id} className="admin-order-row" onClick={() => setSelected(o)}>
            <div className="admin-order-row__main">
              <strong>{o.id}</strong>
              <span>{o.customer.name}</span>
              <span>{new Date(o.createdAt).toLocaleString("fr-FR")}</span>
            </div>
            <div className="admin-order-row__meta">
              <span className={`admin-tag admin-tag--${o.status === "pending" ? "warning" : "accent"}`}>
                {STATUS_LABELS[o.status]}
              </span>
              <span className="admin-tag admin-tag--muted">{PAYMENT_LABELS[o.paymentStatus]}</span>
              <strong>{formatPriceXof(o.totalXof)} XOF</strong>
            </div>
          </li>
        ))}
        {!loading && orders.length === 0 ? (
          <li className="admin-photo-grid__empty">Aucune commande pour ce filtre.</li>
        ) : null}
      </ul>

      {selected ? (
        <div
          className="admin-modal"
          onClick={(e) => e.currentTarget === e.target && setSelected(null)}
        >
          <article className="admin-modal__panel admin-modal__panel--wide">
            <header className="admin-modal__head">
              <div>
                <h2>{selected.id}</h2>
                <p className="admin-help">
                  {selected.customer.name} · {selected.customer.email} · {selected.customer.phone}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="admin-cta admin-cta--ghost admin-cta--small"
                  onClick={async () => {
                    const token = getToken();
                    const res = await fetch(`/api/admin/orders/${selected.id}/invoice.html`, {
                      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                    });
                    if (!res.ok) {
                      setToast("Impossible d'ouvrir la facture");
                      return;
                    }
                    const html = await res.text();
                    const w = window.open("", "_blank");
                    if (w) {
                      w.document.write(html);
                      w.document.close();
                    }
                  }}
                >
                  Facture
                </button>
                <button type="button" className="admin-icon-btn" onClick={() => setSelected(null)}>
                  ✕
                </button>
              </div>
            </header>

            <div className="admin-order-detail">
              <div className="admin-form admin-form--two">
                <label>
                  <span>Statut commande</span>
                  <select
                    value={selected.status}
                    onChange={(e) =>
                      patchOrder(selected.id, { status: e.target.value as OrderStatus })
                    }
                  >
                    {Object.entries(STATUS_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Paiement</span>
                  <select
                    value={selected.paymentStatus}
                    onChange={(e) =>
                      patchOrder(selected.id, {
                        paymentStatus: e.target.value as PaymentStatus,
                      })
                    }
                  >
                    {Object.entries(PAYMENT_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <ul className="admin-order-lines">
                {selected.lines.map((l) => (
                  <li key={l.lineId}>
                    <span>{l.title}</span>
                    <span>
                      {l.variationLabel !== "Pièce" ? `${l.variationLabel} · ` : ""}
                      {l.size} × {l.qty}
                    </span>
                    <strong>{formatPriceXof(l.priceXof * l.qty)} XOF</strong>
                  </li>
                ))}
              </ul>

              <dl className="admin-defs">
                <div>
                  <dt>Sous-total</dt>
                  <dd>{formatPriceXof(selected.subtotalXof)} XOF</dd>
                </div>
                {selected.discountXof > 0 ? (
                  <div>
                    <dt>Remise {selected.promoCode ? `(${selected.promoCode})` : ""}</dt>
                    <dd>-{formatPriceXof(selected.discountXof)} XOF</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Total</dt>
                  <dd>
                    <strong>{formatPriceXof(selected.totalXof)} XOF</strong>
                  </dd>
                </div>
              </dl>

              {selected.notes ? (
                <p className="admin-help">
                  <strong>Note client :</strong> {selected.notes}
                </p>
              ) : null}

              <label>
                <span>Note interne atelier</span>
                <textarea
                  rows={2}
                  defaultValue={selected.internalNote ?? ""}
                  onBlur={(e) => {
                    if (e.target.value !== (selected.internalNote ?? "")) {
                      patchOrder(selected.id, { internalNote: e.target.value });
                    }
                  }}
                />
              </label>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
