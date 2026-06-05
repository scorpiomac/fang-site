import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/useCart";
import { formatPriceXof, whatsappOrderNumber } from "@/content/shop";
import { resolveMediaUrl } from "@/lib/publicUrl";
import type { CartLine } from "@/context/cartTypes";

function CheckoutSteps({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Panier" },
    { n: 2, label: "Coordonnées" },
    { n: 3, label: "Confirmation" },
  ];
  return (
    <nav className="checkout-steps" aria-label="Étapes de commande">
      {steps.map((s, i) => (
        <div key={s.n} className={`checkout-step ${step === s.n ? "checkout-step--active" : step > s.n ? "checkout-step--done" : ""}`}>
          <span className="checkout-step__num">{step > s.n ? "✓" : s.n}</span>
          <span className="checkout-step__label">{s.label}</span>
          {i < steps.length - 1 && <span className="checkout-step__sep" aria-hidden="true" />}
        </div>
      ))}
    </nav>
  );
}

export function CheckoutPage() {
  const { lines, subtotalXof, clearCart, countItems } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Sénégal");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [orderSnapshot, setOrderSnapshot] = useState<{
    lines: CartLine[];
    total: number;
  } | null>(null);

  const plainOrderText = useMemo(() => {
    const src = submitted && orderSnapshot ? orderSnapshot.lines : lines;
    const totalVal = submitted && orderSnapshot ? orderSnapshot.total : subtotalXof;
    const header = `Commande FANG — ${new Date().toLocaleDateString("fr-FR")}\n`;
    const client = `Client: ${name}\nEmail: ${email}\nTél: ${phone}\n${city}, ${country}\n\n`;
    const items = src
      .map(
        (l) =>
          `• ${l.title} — taille ${l.size} × ${l.qty} — ${formatPriceXof(l.priceXof * l.qty)} FCFA`
      )
      .join("\n");
    const total = `\n\nSous-total: ${formatPriceXof(totalVal)} FCFA`;
    const note = notes.trim() ? `\n\nNote: ${notes}` : "";
    return header + client + items + total + note;
  }, [lines, subtotalXof, submitted, orderSnapshot, name, email, phone, city, country, notes]);

  const waLink = useMemo(() => {
    return `https://wa.me/${whatsappOrderNumber}?text=${encodeURIComponent(plainOrderText)}`;
  }, [plainOrderText]);

  if (lines.length === 0 && !submitted) {
    return (
      <main id="contenu-principal" className="checkout-page checkout-page--empty shop-shell">
        <p>Votre panier est vide.</p>
        <Link to="/boutique" className="cta cta--solid">
          Parcourir la boutique
        </Link>
      </main>
    );
  }

  if (submitted) {
    return (
      <main id="contenu-principal" className="checkout-page checkout-page--thanks shop-shell">
        <CheckoutSteps step={3} />
        <p className="checkout-page__thanks-title">Merci</p>
        <p className="checkout-page__thanks-body">
          Votre demande est prête à être envoyée à l'atelier. Utilisez WhatsApp ou l'e-mail pour
          finaliser le paiement et la livraison.
        </p>
        <div className="checkout-page__thanks-actions">
          <a href={waLink} className="cta cta--solid" target="_blank" rel="noreferrer">
            Envoyer sur WhatsApp
          </a>
          <a
            href={`mailto:contact@fang.studio?subject=${encodeURIComponent("Commande FANG")}&body=${encodeURIComponent(plainOrderText)}`}
            className="cta cta--ghost"
          >
            Envoyer par e-mail
          </a>
        </div>
        <Link to="/boutique" className="checkout-page__link-back">
          Retour boutique
        </Link>
      </main>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderSnapshot({ lines: [...lines], total: subtotalXof });
    setSubmitted(true);
    clearCart();
  };

  return (
    <main id="contenu-principal" className="checkout-page shop-shell">
      <CheckoutSteps step={2} />

      <header className="checkout-page__head">
        <p className="checkout-page__eyebrow">Commande</p>
        <h1 className="checkout-page__title">Finaliser votre sélection</h1>
        <p className="checkout-page__lede">
          Renseignez vos coordonnées. Le paiement se fait hors ligne (Mobile Money, virement ou
          espèces selon accord) — l'atelier vous confirme sous 24 à 48 h.
        </p>
        <Link to="/boutique" className="checkout-page__back">
          ← Boutique
        </Link>
      </header>

      <div className="checkout-page__grid">
        <form className="checkout-form" onSubmit={onSubmit}>
          <fieldset className="checkout-fieldset">
            <legend>Coordonnées</legend>
            <label className="checkout-label">
              Nom complet
              <input
                required
                name="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="checkout-label">
              E-mail
              <input
                required
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="checkout-label">
              Téléphone (WhatsApp)
              <input
                required
                name="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            <label className="checkout-label">
              Ville
              <input
                required
                name="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </label>
            <label className="checkout-label">
              Pays
              <input
                name="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </label>
            <label className="checkout-label checkout-label--full">
              Note pour l'atelier (optionnel)
              <textarea
                name="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
          </fieldset>

          <button type="submit" className="cta cta--solid checkout-form__submit">
            Valider et envoyer la commande
          </button>
        </form>

        <aside className="checkout-summary" aria-label="Récapitulatif">
          <h2 className="checkout-summary__title">Panier ({countItems})</h2>
          <ul className="checkout-summary__lines">
            {lines.map((l) => (
              <li key={l.lineId}>
                <img src={resolveMediaUrl(l.image)} alt="" />
                <div>
                  <strong>{l.title}</strong>
                  <span>
                    {l.size} × {l.qty}
                  </span>
                </div>
                <span>{formatPriceXof(l.priceXof * l.qty)} FCFA</span>
              </li>
            ))}
          </ul>
          <p className="checkout-summary__total">
            <span>Total</span>
            <strong>{formatPriceXof(subtotalXof)} FCFA</strong>
          </p>
        </aside>
      </div>
    </main>
  );
}
