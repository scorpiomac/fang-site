import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/useCart";
import { useCustomer } from "@/context/customerContext";
import { useSiteSettings } from "@/context/siteSettingsContext";
import { formatPriceXof, whatsappOrderNumber } from "@/content/shop";
import { resolveMediaUrl } from "@/lib/publicUrl";
import {
  submitOrder,
  validatePromoCode,
  fetchShippingZones,
  quoteShipping,
  startCheckout,
  fetchPendingStatus,
  type ShippingZoneOption,
} from "@/lib/storeApi";
import { openPaytechPopup } from "@/lib/paytechSdk";
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
        <div
          key={s.n}
          className={`checkout-step ${step === s.n ? "checkout-step--active" : step > s.n ? "checkout-step--done" : ""}`}
        >
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
  const { customer, updateProfile } = useCustomer();
  const { settings } = useSiteSettings();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Sénégal");
  const [notes, setNotes] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [discountXof, setDiscountXof] = useState(0);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  /* Livraison */
  const [zones, setZones] = useState<ShippingZoneOption[]>([]);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [shippingXof, setShippingXof] = useState(0);
  const [shippingEta, setShippingEta] = useState<string>("");

  /* Paiement */
  const paymentMethods = settings.payments.methods;
  const [paymentMethod, setPaymentMethod] = useState<string>(
    paymentMethods[0]?.id ?? "whatsapp"
  );
  useEffect(() => {
    if (!paymentMethods.find((m) => m.id === paymentMethod)) {
      setPaymentMethod(paymentMethods[0]?.id ?? "whatsapp");
    }
  }, [paymentMethods, paymentMethod]);

  /* Charger les zones disponibles */
  useEffect(() => {
    fetchShippingZones().then(setZones);
  }, []);

  /* Recalcul livraison quand pays/ville/zone/subtotal/promo change */
  useEffect(() => {
    if (subtotalXof <= 0) return;
    const baseForShipping = Math.max(0, subtotalXof - discountXof);
    quoteShipping({
      zoneId,
      country,
      city,
      subtotalXof: baseForShipping,
    }).then((q) => {
      setShippingXof(q.shippingXof);
      setShippingEta(q.zone?.etaDays ?? "");
      if (q.zone && !zoneId) setZoneId(q.zone.id);
    });
  }, [zoneId, country, city, subtotalXof, discountXof]);

  /* Calcul TVA */
  const taxXof = useMemo(() => {
    if (!settings.tax.enabled || settings.tax.included) return 0;
    const base = Math.max(0, subtotalXof - discountXof) + shippingXof;
    return Math.round(base * (settings.tax.rate / 100));
  }, [settings.tax, subtotalXof, discountXof, shippingXof]);

  const totalXof = useMemo(
    () => Math.max(0, subtotalXof - discountXof) + shippingXof + taxXof,
    [subtotalXof, discountXof, shippingXof, taxXof]
  );

  const [orderSnapshot, setOrderSnapshot] = useState<{
    lines: CartLine[];
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    promo: string | null;
  } | null>(null);

  useEffect(() => {
    if (!customer) return;
    setName(customer.name);
    setEmail(customer.email);
    if (customer.phone) setPhone(customer.phone);
    if (customer.city) setCity(customer.city);
    if (customer.country) setCountry(customer.country);
  }, [customer]);

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await validatePromoCode(code, subtotalXof);
      if (!res.valid) {
        setPromoCode(null);
        setDiscountXof(0);
        setPromoError(res.error ?? "Code invalide");
        return;
      }
      setPromoCode(res.promo?.code ?? code.toUpperCase());
      setDiscountXof(res.discountXof ?? 0);
      setPromoInput(res.promo?.code ?? code.toUpperCase());
    } catch {
      setPromoError("Impossible de vérifier le code");
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setPromoInput("");
    setPromoCode(null);
    setDiscountXof(0);
    setPromoError(null);
  };

  const selectedPayment = paymentMethods.find((m) => m.id === paymentMethod);

  const plainOrderText = useMemo(() => {
    const src = submitted && orderSnapshot ? orderSnapshot.lines : lines;
    const sub = submitted && orderSnapshot ? orderSnapshot.subtotal : subtotalXof;
    const disc = submitted && orderSnapshot ? orderSnapshot.discount : discountXof;
    const ship = submitted && orderSnapshot ? orderSnapshot.shipping : shippingXof;
    const tax = submitted && orderSnapshot ? orderSnapshot.tax : taxXof;
    const totalVal = submitted && orderSnapshot ? orderSnapshot.total : totalXof;
    const promo = submitted && orderSnapshot ? orderSnapshot.promo : promoCode;
    const header = `Commande ${settings.brand.name}${orderId ? ` — ${orderId}` : ""} — ${new Date().toLocaleDateString("fr-FR")}\n`;
    const client = `Client: ${name}\nEmail: ${email}\nTél: ${phone}\n${city}, ${country}\n\n`;
    const items = src
      .map(
        (l) =>
          `• ${l.title} — ${l.variationLabel !== "Pièce" ? `${l.variationLabel}, ` : ""}taille ${l.size} × ${l.qty} — ${formatPriceXof(l.priceXof * l.qty)} ${settings.currency.label}`
      )
      .join("\n");
    const totals =
      `\n\nSous-total: ${formatPriceXof(sub)} ${settings.currency.label}` +
      (disc > 0 ? `\nRemise${promo ? ` (${promo})` : ""}: -${formatPriceXof(disc)} ${settings.currency.label}` : "") +
      (ship > 0 ? `\nLivraison: ${formatPriceXof(ship)} ${settings.currency.label}` : "") +
      (tax > 0 ? `\n${settings.tax.label}: ${formatPriceXof(tax)} ${settings.currency.label}` : "") +
      `\nTotal: ${formatPriceXof(totalVal)} ${settings.currency.label}`;
    const note = notes.trim() ? `\n\nNote: ${notes}` : "";
    return header + client + items + totals + note;
  }, [
    lines,
    subtotalXof,
    discountXof,
    shippingXof,
    taxXof,
    totalXof,
    promoCode,
    submitted,
    orderSnapshot,
    orderId,
    name,
    email,
    phone,
    city,
    country,
    notes,
    settings,
  ]);

  const waLink = useMemo(() => {
    const wa = settings.contact.whatsapp || whatsappOrderNumber;
    return `https://wa.me/${wa}?text=${encodeURIComponent(plainOrderText)}`;
  }, [plainOrderText, settings.contact.whatsapp]);

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
        {orderId ? (
          <p className="checkout-page__order-id">
            Commande <strong>{orderId}</strong>
          </p>
        ) : null}
        <p className="checkout-page__thanks-body">
          Votre commande est enregistrée. L'atelier vous confirme sous 24 à 48 h.
        </p>
        {selectedPayment?.instructions ? (
          <p className="checkout-page__payment-instructions">
            <strong>Paiement — {selectedPayment.label} :</strong> {selectedPayment.instructions}
          </p>
        ) : null}
        <div className="checkout-page__thanks-actions">
          <a href={waLink} className="cta cta--solid" target="_blank" rel="noreferrer">
            Envoyer sur WhatsApp
          </a>
          {orderId ? (
            <Link to={`/compte/commandes/${encodeURIComponent(orderId)}`} className="cta cta--ghost">
              Voir ma commande
            </Link>
          ) : null}
          <a
            href={`mailto:${settings.contact.email}?subject=${encodeURIComponent(`Commande ${settings.brand.name} ${orderId ?? ""}`)}&body=${encodeURIComponent(plainOrderText)}`}
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

  const onlineProvider = settings.checkout?.paymentProvider ?? "off";
  const [payOnline, setPayOnline] = useState(onlineProvider !== "off");

  useEffect(() => {
    setPayOnline(onlineProvider !== "off");
  }, [onlineProvider]);

  const buildOrderPayload = () => {
    let finalDiscount = discountXof;
    return new Promise<{
      customer: { name: string; email: string; phone: string; city: string; country: string };
      lines: CartLine[];
      subtotalXof: number;
      discountXof: number;
      shippingXof: number;
      taxXof: number;
      totalXof: number;
      promoCode: string | null;
      notes?: string;
      shippingZoneId: string | null | undefined;
      paymentMethod: string;
    } | null>((resolve) => {
      (async () => {
        if (promoCode) {
          const check = await validatePromoCode(promoCode, subtotalXof);
          if (!check.valid) {
            setPromoError(check.error ?? "Code promo expiré ou invalide");
            resolve(null);
            return;
          }
          finalDiscount = check.discountXof ?? 0;
        }
        const finalShipping = shippingXof;
        const baseAfterDiscount = Math.max(0, subtotalXof - finalDiscount);
        const finalTax =
          settings.tax.enabled && !settings.tax.included
            ? Math.round((baseAfterDiscount + finalShipping) * (settings.tax.rate / 100))
            : 0;
        const finalTotal = baseAfterDiscount + finalShipping + finalTax;
        resolve({
          customer: { name, email, phone, city, country },
          lines,
          subtotalXof,
          discountXof: finalDiscount,
          shippingXof: finalShipping,
          taxXof: finalTax,
          totalXof: finalTotal,
          promoCode,
          notes: notes.trim() || undefined,
          shippingZoneId: zoneId,
          paymentMethod,
        });
      })();
    });
  };

  const handleOnlinePaymentSuccess = async (
    orderId: string,
    snap: NonNullable<Awaited<ReturnType<typeof buildOrderPayload>>>
  ) => {
    setOrderSnapshot({
      lines: [...snap.lines],
      subtotal: snap.subtotalXof,
      discount: snap.discountXof,
      shipping: snap.shippingXof,
      tax: snap.taxXof,
      total: snap.totalXof,
      promo: snap.promoCode,
    });
    setOrderId(orderId);
    if (customer) {
      try {
        await updateProfile({ name, phone, city, country });
      } catch {
        /* non bloquant */
      }
    }
    setSubmitted(true);
    clearCart();
  };

  const pollPendingUntilPaid = async (ref: string, maxSeconds = 120) => {
    const started = Date.now();
    while (Date.now() - started < maxSeconds * 1000) {
      try {
        const status = await fetchPendingStatus(ref);
        if (status.paymentStatus === "paid" && status.orderId) {
          return status.orderId;
        }
      } catch {
        return null;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = await buildOrderPayload();
      if (!payload) {
        setSubmitting(false);
        return;
      }

      /* ─── Flux paiement en ligne ─── */
      if (payOnline && onlineProvider !== "off") {
        const start = await startCheckout(payload);

        if (start.provider === "simulated") {
          await handleOnlinePaymentSuccess(start.order.id, payload);
          return;
        }

        if (start.provider === "paydunya") {
          window.location.href = start.redirectUrl;
          return;
        }

        if (start.provider === "paytech") {
          await openPaytechPopup({
            ref: start.ref,
            itemPrice: payload.totalXof,
            itemName: `Commande FANG ${start.ref}`,
            env: start.env,
            customField: {
              customerName: payload.customer.name,
              customerEmail: payload.customer.email,
            },
            onSuccess: async () => {
              const orderId = await pollPendingUntilPaid(start.ref);
              if (orderId) {
                await handleOnlinePaymentSuccess(orderId, payload);
              } else {
                setSubmitError(
                  "Paiement en attente de confirmation. Votre commande " +
                    start.orderId +
                    " est visible dans votre compte ; vous serez notifié par e-mail dès validation."
                );
              }
            },
            onCancel: () => {
              setSubmitError(
                `Paiement annulé. Votre commande ${start.orderId} reste en attente — vous pouvez la reprendre depuis votre compte.`
              );
            },
          });
          // Polling de secours en parallèle (au cas où onSuccess ne se déclenche pas)
          const orderId = await pollPendingUntilPaid(start.ref);
          if (orderId) await handleOnlinePaymentSuccess(orderId, payload);
          return;
        }
      }

      /* ─── Flux hors-ligne (WhatsApp / Mobile Money manuel / virement) ─── */
      const order = await submitOrder(payload);
      await handleOnlinePaymentSuccess(order.id, payload);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main id="contenu-principal" className="checkout-page shop-shell">
      <CheckoutSteps step={2} />

      <header className="checkout-page__head">
        <p className="checkout-page__eyebrow">Commande</p>
        <h1 className="checkout-page__title">Finaliser votre sélection</h1>
        <p className="checkout-page__lede">
          Renseignez vos coordonnées et choisissez le mode de paiement et de livraison.
          L'atelier vous confirme sous 24 à 48 h.
        </p>
        {customer ? (
          <p className="checkout-page__logged">
            Connecté en tant que <strong>{customer.name}</strong> — la commande apparaîtra dans{" "}
            <Link to="/compte">votre espace client</Link>.
          </p>
        ) : (
          <p className="checkout-page__logged">
            <Link to="/compte?redirect=/commande">Connectez-vous</Link> ou{" "}
            <Link to="/compte?inscription=1&redirect=/commande">créez un compte</Link> pour
            préremplir vos coordonnées et suivre vos commandes.
          </p>
        )}
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
              <input required name="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </label>
            <label className="checkout-label">
              Pays
              <input name="country" value={country} onChange={(e) => setCountry(e.target.value)} />
            </label>
            <label className="checkout-label checkout-label--full">
              Note pour l&apos;atelier (optionnel)
              <textarea name="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
          </fieldset>

          {zones.length > 0 ? (
            <fieldset className="checkout-fieldset">
              <legend>Livraison</legend>
              {zones.map((z) => {
                const free = z.freeAboveXof != null && subtotalXof - discountXof >= z.freeAboveXof;
                return (
                  <label key={z.id} className="checkout-option">
                    <input
                      type="radio"
                      name="shippingZone"
                      checked={zoneId === z.id}
                      onChange={() => setZoneId(z.id)}
                    />
                    <span>
                      <strong>{z.name}</strong>
                      <span className="checkout-option__hint">
                        {z.etaDays ? `${z.etaDays} · ` : ""}
                        {free ? "Offert" : `${formatPriceXof(z.priceXof)} ${settings.currency.label}`}
                        {z.freeAboveXof != null && !free
                          ? ` · gratuit dès ${formatPriceXof(z.freeAboveXof)} ${settings.currency.label}`
                          : ""}
                      </span>
                    </span>
                  </label>
                );
              })}
            </fieldset>
          ) : null}

          {paymentMethods.length > 0 ? (
            <fieldset className="checkout-fieldset">
              <legend>Paiement</legend>
              {paymentMethods.map((m) => (
                <label key={m.id} className="checkout-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === m.id}
                    onChange={() => setPaymentMethod(m.id)}
                  />
                  <span>
                    <strong>{m.label}</strong>
                    {m.instructions ? (
                      <span className="checkout-option__hint">{m.instructions}</span>
                    ) : null}
                  </span>
                </label>
              ))}
            </fieldset>
          ) : null}

          {onlineProvider !== "off" ? (
            <fieldset className="checkout-fieldset">
              <legend>Paiement en ligne</legend>
              <label className="checkout-option">
                <input
                  type="checkbox"
                  checked={payOnline}
                  onChange={(e) => setPayOnline(e.target.checked)}
                />
                <span>
                  <strong>
                    {payOnline ? "Payer maintenant" : "Régler hors-ligne"}
                  </strong>
                  <span className="checkout-option__hint">
                    {payOnline
                      ? onlineProvider === "paytech"
                        ? "Paiement sécurisé PayTech (Wave, Orange Money, carte) — popup."
                        : "Paiement sécurisé PayDunya (Wave, Orange Money, carte) — redirection."
                      : "L'atelier vous recontacte pour finaliser le règlement."}
                  </span>
                </span>
              </label>
            </fieldset>
          ) : null}

          {submitError ? <p className="checkout-form__error">{submitError}</p> : null}

          <button type="submit" className="cta cta--solid checkout-form__submit" disabled={submitting}>
            {submitting
              ? payOnline
                ? "Redirection vers le paiement…"
                : "Enregistrement…"
              : payOnline && onlineProvider !== "off"
                ? "Payer maintenant"
                : "Valider et envoyer la commande"}
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
                    {l.variationLabel !== "Pièce" ? `${l.variationLabel} · ` : ""}
                    {l.size} × {l.qty}
                  </span>
                </div>
                <span>{formatPriceXof(l.priceXof * l.qty)} {settings.currency.label}</span>
              </li>
            ))}
          </ul>

          <div className="checkout-promo">
            <label className="checkout-promo__label">
              Code promo
              <div className="checkout-promo__row">
                <input
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="FANG10"
                  disabled={Boolean(promoCode)}
                />
                {promoCode ? (
                  <button type="button" className="checkout-promo__btn" onClick={removePromo}>
                    Retirer
                  </button>
                ) : (
                  <button
                    type="button"
                    className="checkout-promo__btn checkout-promo__btn--apply"
                    onClick={applyPromo}
                    disabled={promoLoading || !promoInput.trim()}
                  >
                    {promoLoading ? "…" : "Appliquer"}
                  </button>
                )}
              </div>
            </label>
            {promoError ? <p className="checkout-promo__error">{promoError}</p> : null}
            {promoCode && !promoError ? (
              <p className="checkout-promo__ok">Code {promoCode} appliqué</p>
            ) : null}
          </div>

          <dl className="checkout-summary__totals">
            <div>
              <dt>Sous-total</dt>
              <dd>{formatPriceXof(subtotalXof)} {settings.currency.label}</dd>
            </div>
            {discountXof > 0 ? (
              <div className="checkout-summary__discount">
                <dt>Remise</dt>
                <dd>-{formatPriceXof(discountXof)} {settings.currency.label}</dd>
              </div>
            ) : null}
            <div>
              <dt>Livraison{shippingEta ? ` (${shippingEta})` : ""}</dt>
              <dd>
                {shippingXof === 0 ? "Offert" : `${formatPriceXof(shippingXof)} ${settings.currency.label}`}
              </dd>
            </div>
            {settings.tax.enabled && !settings.tax.included && taxXof > 0 ? (
              <div>
                <dt>{settings.tax.label} ({settings.tax.rate}%)</dt>
                <dd>{formatPriceXof(taxXof)} {settings.currency.label}</dd>
              </div>
            ) : null}
            {settings.tax.enabled && settings.tax.included ? (
              <div className="checkout-summary__hint">
                <dt>{settings.tax.label} incluse</dt>
                <dd></dd>
              </div>
            ) : null}
          </dl>
          <p className="checkout-summary__total">
            <span>Total</span>
            <strong>{formatPriceXof(totalXof)} {settings.currency.label}</strong>
          </p>
        </aside>
      </div>
    </main>
  );
}
