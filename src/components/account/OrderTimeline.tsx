import { ORDER_STATUS_FLOW, orderStatusIndex, orderStatusLabel } from "@/lib/orderStatus";

type Props = {
  status: string;
};

export function OrderTimeline({ status }: Props) {
  if (status === "cancelled") {
    return (
      <div className="order-timeline order-timeline--cancelled">
        <p>Commande annulée</p>
      </div>
    );
  }

  const current = orderStatusIndex(status);

  return (
    <ol className="order-timeline" aria-label="Suivi de commande">
      {ORDER_STATUS_FLOW.map((step, i) => {
        const done = i <= current;
        const active = i === current;
        return (
          <li
            key={step}
            className={`order-timeline__step${done ? " is-done" : ""}${active ? " is-active" : ""}`}
          >
            <span className="order-timeline__dot" aria-hidden="true">
              {done && !active ? "✓" : i + 1}
            </span>
            <span className="order-timeline__label">{orderStatusLabel(step)}</span>
          </li>
        );
      })}
    </ol>
  );
}
