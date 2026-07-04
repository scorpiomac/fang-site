import type { CheckoutPaymentId } from "@/lib/checkoutPayments";

export type PaymentFormState = {
  mobileNumber: string;
  cardHolder: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
};

export const EMPTY_PAYMENT_FORM: PaymentFormState = {
  mobileNumber: "",
  cardHolder: "",
  cardNumber: "",
  cardExpiry: "",
  cardCvv: "",
};

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCardNumber(value: string): string {
  return digitsOnly(value)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();
}

export function formatCardExpiry(value: string): string {
  const digits = digitsOnly(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function validatePaymentForm(
  method: string,
  state: PaymentFormState,
  payOnline: boolean
): string | null {
  if (method === "wave" || method === "orange_money") {
    const mobile = digitsOnly(state.mobileNumber);
    if (mobile.length < 8) {
      return "Indiquez un numéro mobile valide pour le paiement.";
    }
    return null;
  }

  if (method === "card") {
    if (!state.cardHolder.trim()) {
      return "Indiquez le nom du titulaire de la carte.";
    }
    if (payOnline) return null;

    const cardDigits = digitsOnly(state.cardNumber);
    if (cardDigits.length < 13) {
      return "Numéro de carte invalide.";
    }
    const expiry = digitsOnly(state.cardExpiry);
    if (expiry.length !== 4) {
      return "Date d'expiration invalide (MM/AA).";
    }
    if (state.cardCvv.trim().length < 3) {
      return "Code de sécurité (CVV) invalide.";
    }
    return null;
  }

  return null;
}

export function buildPaymentNote(
  method: string,
  state: PaymentFormState,
  label: string
): string {
  if (method === "wave" || method === "orange_money") {
    return `${label} — téléphone : ${state.mobileNumber.trim()}`;
  }
  if (method === "card") {
    const last4 = digitsOnly(state.cardNumber).slice(-4);
    const holder = state.cardHolder.trim();
    if (last4) {
      return `Carte bancaire — titulaire : ${holder}, fin **** ${last4}`;
    }
    return `Carte bancaire — titulaire : ${holder}`;
  }
  return label;
}

type Props = {
  method: CheckoutPaymentId;
  label: string;
  totalLabel: string;
  payOnline: boolean;
  contactPhone: string;
  value: PaymentFormState;
  onChange: (next: PaymentFormState) => void;
};

export function PaymentDetailsForm({
  method,
  label,
  totalLabel,
  payOnline,
  contactPhone,
  value,
  onChange,
}: Props) {
  const patch = (partial: Partial<PaymentFormState>) => {
    onChange({ ...value, ...partial });
  };

  const useContactPhone = () => {
    if (contactPhone.trim()) patch({ mobileNumber: contactPhone.trim() });
  };

  return (
    <div className="checkout-payment-form" aria-live="polite">
      <div className="checkout-payment-form__head">
        <h3 className="checkout-payment-form__title">Formulaire {label}</h3>
        <p className="checkout-payment-form__amount">
          Montant à régler : <strong>{totalLabel}</strong>
        </p>
      </div>

      {method === "wave" || method === "orange_money" ? (
        <div className="checkout-payment-form__body">
          <label className="checkout-label">
            Numéro {label}
            <input
              required
              type="tel"
              name={`${method}Phone`}
              autoComplete="tel"
              inputMode="tel"
              placeholder="Ex. 77 123 45 67"
              value={value.mobileNumber}
              onChange={(e) => patch({ mobileNumber: e.target.value })}
            />
          </label>
          {contactPhone.trim() && value.mobileNumber.trim() !== contactPhone.trim() ? (
            <button type="button" className="checkout-payment-form__link" onClick={useContactPhone}>
              Utiliser le numéro WhatsApp ({contactPhone.trim()})
            </button>
          ) : null}
          <ol className="checkout-payment-form__steps">
            <li>Validez votre commande ci-dessous.</li>
            <li>
              {payOnline
                ? `Confirmez le paiement sur ${label} depuis votre téléphone.`
                : "L'atelier vous enverra une demande de paiement sur ce numéro."}
            </li>
          </ol>
        </div>
      ) : null}

      {method === "card" ? (
        <div className="checkout-payment-form__body checkout-payment-form__body--card">
          {payOnline ? (
            <p className="checkout-payment-form__secure">
              Paiement sécurisé — le numéro de carte et le code CVV seront demandés sur la
              page de paiement après validation.
            </p>
          ) : null}
          <label className="checkout-label">
            Titulaire de la carte
            <input
              required
              type="text"
              name="cardHolder"
              autoComplete="cc-name"
              placeholder="Comme inscrit sur la carte"
              value={value.cardHolder}
              onChange={(e) => patch({ cardHolder: e.target.value })}
            />
          </label>
          {!payOnline ? (
            <>
              <label className="checkout-label">
                Numéro de carte
                <input
                  required
                  type="text"
                  name="cardNumber"
                  autoComplete="cc-number"
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  value={value.cardNumber}
                  onChange={(e) => patch({ cardNumber: formatCardNumber(e.target.value) })}
                />
              </label>
              <div className="checkout-payment-form__row">
                <label className="checkout-label">
                  Expiration
                  <input
                    required
                    type="text"
                    name="cardExpiry"
                    autoComplete="cc-exp"
                    inputMode="numeric"
                    placeholder="MM/AA"
                    value={value.cardExpiry}
                    onChange={(e) => patch({ cardExpiry: formatCardExpiry(e.target.value) })}
                  />
                </label>
                <label className="checkout-label">
                  CVV
                  <input
                    required
                    type="password"
                    name="cardCvv"
                    autoComplete="cc-csc"
                    inputMode="numeric"
                    placeholder="123"
                    maxLength={4}
                    value={value.cardCvv}
                    onChange={(e) => patch({ cardCvv: digitsOnly(e.target.value).slice(0, 4) })}
                  />
                </label>
              </div>
            </>
          ) : (
            <div className="checkout-payment-form__card-preview" aria-hidden="true">
              <span className="checkout-payment-form__card-chip" />
              <span className="checkout-payment-form__card-dots">•••• •••• •••• ••••</span>
              <span className="checkout-payment-form__card-name">
                {value.cardHolder.trim() || "NOM DU TITULAIRE"}
              </span>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
