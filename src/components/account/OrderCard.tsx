import { Link } from "react-router-dom";
import { formatPriceXof } from "@/content/shop";
import { orderStatusLabel, paymentStatusLabel, type CustomerOrder } from "@/lib/customerApi";
import { resolveMediaUrl } from "@/lib/publicUrl";

type Props = {
  order: CustomerOrder;
  detailLink?: boolean;
};

export function OrderCard({ order, detailLink = true }: Props) {
  const content = (
    <>
      <div className="order-card__head">
        <div>
          <strong className="order-card__id">{order.id}</strong>
          <time dateTime={order.createdAt}>
            {new Date(order.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
        </div>
        <div className="order-card__badges">
          <span className={`order-badge order-badge--${order.status}`}>
            {orderStatusLabel(order.status)}
          </span>
          <span className="order-badge order-badge--payment">{paymentStatusLabel(order.paymentStatus)}</span>
        </div>
      </div>

      <ul className="order-card__lines">
        {order.lines.slice(0, 3).map((l, i) => (
          <li key={i}>
            {l.image ? <img src={resolveMediaUrl(l.image)} alt="" /> : null}
            <div>
              <strong>{l.title}</strong>
              <span>
                {l.variationLabel !== "Pièce" ? `${l.variationLabel} · ` : ""}
                {l.size} × {l.qty}
              </span>
            </div>
            <span>{formatPriceXof(l.priceXof * l.qty)} FCFA</span>
          </li>
        ))}
        {(order.lineCount ?? order.lines.length) > 3 ? (
          <li className="order-card__more">
            + {(order.lineCount ?? order.lines.length) - 3} autre(s) article(s)
          </li>
        ) : null}
      </ul>

      <div className="order-card__foot">
        <span>{order.lines.length} article{order.lines.length > 1 ? "s" : ""}</span>
        <strong>{formatPriceXof(order.totalXof)} FCFA</strong>
      </div>
    </>
  );

  if (detailLink) {
    return (
      <Link to={`/compte/commandes/${encodeURIComponent(order.id)}`} className="order-card">
        {content}
      </Link>
    );
  }

  return <article className="order-card order-card--static">{content}</article>;
}
