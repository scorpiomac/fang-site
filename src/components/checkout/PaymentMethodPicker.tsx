import type { CheckoutPaymentChoice } from "@/lib/checkoutPayments";

type Props = {
  name: string;
  value: string;
  options: CheckoutPaymentChoice[];
  onChange: (id: string) => void;
};

function PaymentBrandIcon({ brand }: { brand: CheckoutPaymentChoice["brand"] }) {
  if (brand === "wave") {
    return (
      <span className="checkout-payment__icon checkout-payment__icon--wave" aria-hidden="true">
        W
      </span>
    );
  }
  if (brand === "orange") {
    return (
      <span className="checkout-payment__icon checkout-payment__icon--orange" aria-hidden="true">
        OM
      </span>
    );
  }
  return (
    <span className="checkout-payment__icon checkout-payment__icon--card" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    </span>
  );
}

export function PaymentMethodPicker({ name, value, options, onChange }: Props) {
  return (
    <fieldset className="checkout-payment">
      <legend>Paiement</legend>
      <div className="checkout-payment__grid" role="radiogroup" aria-label="Moyen de paiement">
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <label
              key={option.id}
              className={`checkout-payment__card${selected ? " is-selected" : ""}`}
            >
              <input
                type="radio"
                name={name}
                value={option.id}
                checked={selected}
                onChange={() => onChange(option.id)}
                className="checkout-payment__input"
              />
              <PaymentBrandIcon brand={option.brand} />
              <span className="checkout-payment__copy">
                <strong>{option.label}</strong>
                {option.hint ? <span className="checkout-payment__hint">{option.hint}</span> : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
