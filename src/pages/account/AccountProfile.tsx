import { useEffect, useState } from "react";
import { useCustomer } from "@/context/customerContext";

export function AccountProfile() {
  const { customer, updateProfile } = useCustomer();
  const [form, setForm] = useState({ name: "", phone: "", city: "", country: "Sénégal" });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!customer) return;
    setForm({
      name: customer.name,
      phone: customer.phone,
      city: customer.city,
      country: customer.country,
    });
  }, [customer]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await updateProfile(form);
      setMessage("Profil enregistré — vos prochaines commandes utiliseront ces coordonnées.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  if (!customer) return null;

  return (
    <section className="account-section">
      <header className="account-section__head">
        <h2>Mon profil</h2>
        <p>Informations utilisées pour le checkout et la livraison.</p>
      </header>

      {error ? <p className="account-page__error">{error}</p> : null}
      {message ? <p className="account-page__ok">{message}</p> : null}

      <form className="account-form account-form--wide" onSubmit={onSubmit}>
        <label>
          E-mail
          <input type="email" value={customer.email} disabled />
          <span className="account-form__hint">L&apos;e-mail ne peut pas être modifié.</span>
        </label>
        <label>
          Nom complet
          <input
            required
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          Téléphone (WhatsApp)
          <input
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </label>
        <div className="account-form__row">
          <label>
            Ville
            <input
              autoComplete="address-level2"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </label>
          <label>
            Pays
            <input
              autoComplete="country-name"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </label>
        </div>
        <button type="submit" className="cta cta--solid" disabled={busy}>
          {busy ? "Enregistrement…" : "Enregistrer mon profil"}
        </button>
      </form>
    </section>
  );
}
