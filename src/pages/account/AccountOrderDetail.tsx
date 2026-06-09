import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { customerApi, getCustomerToken, orderStatusLabel, paymentStatusLabel } from "@/lib/customerApi";
import { formatPriceXof, whatsappOrderNumber } from "@/content/shop";
import { resolveMediaUrl } from "@/lib/publicUrl";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import type { CustomerOrder } from "@/lib/customerApi";

export function AccountOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    customerApi
      .fetchOrder(decodeURIComponent(orderId))
      .then(({ order: o }) => setOrder(o))
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [orderId]);

  const waText = useMemo(() => {
    if (!order) return "";
    const lines = order.lines
      .map(
        (l) =>
          `• ${l.title} — ${l.variationLabel !== "Pièce" ? `${l.variationLabel}, ` : ""}taille ${l.size} × ${l.qty}`
      )
      .join("\n");
    return `Bonjour, j'ai une question sur ma commande ${order.id}.\n\n${lines}\n\nTotal : ${formatPriceXof(order.totalXof)} FCFA`;
  }, [order]);

  if (loading) return <p className="account-loading">Chargement…</p>;
  if (error || !order) {
    return (
      <section className="account-section">
        <p className="account-page__error">{error ?? "Commande introuvable"}</p>
        <Link to="/compte/commandes" className="cta cta--ghost">
          ← Mes commandes
        </Link>
      </section>
    );
  }

  return (
    <section className="account-section account-section--detail">
      <header className="account-section__head account-section__head--row">
        <div>
          <Link to="/compte/commandes" className="account-back">
            ← Mes commandes
          </Link>
          <h2>{order.id}</h2>
          <p>
            Passée le{" "}
            {new Date(order.createdAt).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="order-detail__badges">
          <span className={`order-badge order-badge--${order.status}`}>
            {orderStatusLabel(order.status)}
          </span>
          <span className="order-badge order-badge--payment">
            {paymentStatusLabel(order.paymentStatus)}
          </span>
          <button
            type="button"
            className="cta cta--ghost"
            style={{ fontSize: "0.8rem", padding: "0.45rem 0.8rem" }}
            onClick={() => {
              const tok = getCustomerToken();
              const url = `/api/store/orders/${encodeURIComponent(order.id)}/invoice.html${tok ? `?session=${encodeURIComponent(tok)}` : ""}`;
              window.open(url, "_blank");
            }}
          >
            Télécharger la facture
          </button>
        </div>
      </header>

      <OrderTimeline status={order.status} />

      <div className="order-detail__grid">
        <div className="order-detail__lines">
          <h3>Articles</h3>
          <ul>
            {order.lines.map((l, i) => (
              <li key={i}>
                {l.image ? <img src={resolveMediaUrl(l.image)} alt="" /> : <span className="order-detail__ph" />}
                <div>
                  <strong>{l.title}</strong>
                  <span>
                    {l.variationLabel !== "Pièce" ? `${l.variationLabel} · ` : ""}
                    Taille {l.size} × {l.qty}
                  </span>
                </div>
                <strong>{formatPriceXof(l.priceXof * l.qty)} FCFA</strong>
              </li>
            ))}
          </ul>
        </div>

        <aside className="order-detail__summary">
          <h3>Récapitulatif</h3>
          <dl>
            <div>
              <dt>Sous-total</dt>
              <dd>{formatPriceXof(order.subtotalXof ?? order.totalXof)} FCFA</dd>
            </div>
            {order.discountXof > 0 ? (
              <div>
                <dt>Remise{order.promoCode ? ` (${order.promoCode})` : ""}</dt>
                <dd>-{formatPriceXof(order.discountXof)} FCFA</dd>
              </div>
            ) : null}
            <div className="order-detail__total">
              <dt>Total</dt>
              <dd>{formatPriceXof(order.totalXof)} FCFA</dd>
            </div>
          </dl>

          {order.notes ? (
            <p className="order-detail__note">
              <strong>Votre note :</strong> {order.notes}
            </p>
          ) : null}

          <div className="order-detail__help">
            <p>Questions sur cette commande ?</p>
            <a
              href={`https://wa.me/${whatsappOrderNumber}?text=${encodeURIComponent(waText)}`}
              className="cta cta--solid"
              target="_blank"
              rel="noreferrer"
            >
              Contacter l&apos;atelier
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
}
