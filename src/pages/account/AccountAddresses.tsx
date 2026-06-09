import { useEffect, useState } from "react";
import { customerApi, type CustomerAddress } from "@/lib/customerApi";

function emptyAddress(): Partial<CustomerAddress> {
  return {
    label: "Adresse principale",
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    postalCode: "",
    country: "Sénégal",
    phone: "",
    type: "shipping",
    isDefault: false,
  };
}

const TYPE_LABELS: Record<CustomerAddress["type"], string> = {
  shipping: "Livraison",
  billing: "Facturation",
  both: "Livraison & facturation",
};

export function AccountAddresses() {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<CustomerAddress> | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const { addresses } = await customerApi.fetchAddresses();
      setAddresses(addresses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const startNew = () => {
    setEditing(emptyAddress());
    setCreating(true);
  };

  const startEdit = (a: CustomerAddress) => {
    setEditing({ ...a });
    setCreating(false);
  };

  const save = async () => {
    if (!editing) return;
    setError(null);
    try {
      if (creating) {
        await customerApi.addAddress(editing);
      } else if (editing.id) {
        await customerApi.updateAddress(editing.id, editing);
      }
      setEditing(null);
      setCreating(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const remove = async (a: CustomerAddress) => {
    if (!confirm(`Supprimer "${a.label}" ?`)) return;
    try {
      await customerApi.deleteAddress(a.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const setDefault = async (a: CustomerAddress) => {
    try {
      await customerApi.updateAddress(a.id, { isDefault: true });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <section className="account-page">
      <header className="account-page__head">
        <div>
          <h1>Mes adresses</h1>
          <p>Sauvegardez vos adresses pour aller plus vite au checkout.</p>
        </div>
        <button type="button" className="cta cta--solid" onClick={startNew}>
          + Ajouter une adresse
        </button>
      </header>

      {loading ? <p>Chargement…</p> : null}
      {error ? <p className="account-page__error">{error}</p> : null}

      <ul className="account-addresses">
        {addresses.map((a) => (
          <li key={a.id} className="account-address-card">
            <div className="account-address-card__head">
              <strong>{a.label}</strong>
              <span className="admin-tag admin-tag--muted">{TYPE_LABELS[a.type]}</span>
              {a.isDefault ? <span className="admin-tag admin-tag--accent">Par défaut</span> : null}
            </div>
            <p>{a.fullName}</p>
            <p>{a.line1}</p>
            {a.line2 ? <p>{a.line2}</p> : null}
            <p>
              {a.postalCode ? `${a.postalCode} ` : ""}
              {a.city}, {a.country}
            </p>
            {a.phone ? <p>Tél : {a.phone}</p> : null}
            <div className="account-address-card__actions">
              {!a.isDefault ? (
                <button type="button" className="account-form__link" onClick={() => setDefault(a)}>
                  Définir par défaut
                </button>
              ) : null}
              <button type="button" className="account-form__link" onClick={() => startEdit(a)}>
                Modifier
              </button>
              <button
                type="button"
                className="account-form__link account-form__link--danger"
                onClick={() => remove(a)}
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
        {!loading && addresses.length === 0 ? (
          <li className="account-addresses__empty">Aucune adresse enregistrée.</li>
        ) : null}
      </ul>

      {editing ? (
        <div
          className="admin-modal"
          onClick={(e) => e.currentTarget === e.target && setEditing(null)}
        >
          <article className="admin-modal__panel">
            <header className="admin-modal__head">
              <h2>{creating ? "Nouvelle adresse" : "Modifier l'adresse"}</h2>
              <button type="button" className="admin-icon-btn" onClick={() => setEditing(null)}>
                ✕
              </button>
            </header>

            <div className="admin-form admin-form--two">
              <label>
                <span>Libellé</span>
                <input
                  value={editing.label ?? ""}
                  onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                />
              </label>
              <label>
                <span>Type</span>
                <select
                  value={editing.type ?? "shipping"}
                  onChange={(e) =>
                    setEditing({ ...editing, type: e.target.value as CustomerAddress["type"] })
                  }
                >
                  <option value="shipping">Livraison</option>
                  <option value="billing">Facturation</option>
                  <option value="both">Les deux</option>
                </select>
              </label>
              <label className="admin-form__full">
                <span>Nom complet</span>
                <input
                  value={editing.fullName ?? ""}
                  onChange={(e) => setEditing({ ...editing, fullName: e.target.value })}
                />
              </label>
              <label className="admin-form__full">
                <span>Adresse</span>
                <input
                  value={editing.line1 ?? ""}
                  onChange={(e) => setEditing({ ...editing, line1: e.target.value })}
                />
              </label>
              <label className="admin-form__full">
                <span>Complément (optionnel)</span>
                <input
                  value={editing.line2 ?? ""}
                  onChange={(e) => setEditing({ ...editing, line2: e.target.value })}
                />
              </label>
              <label>
                <span>Code postal</span>
                <input
                  value={editing.postalCode ?? ""}
                  onChange={(e) => setEditing({ ...editing, postalCode: e.target.value })}
                />
              </label>
              <label>
                <span>Ville</span>
                <input
                  value={editing.city ?? ""}
                  onChange={(e) => setEditing({ ...editing, city: e.target.value })}
                />
              </label>
              <label>
                <span>Pays</span>
                <input
                  value={editing.country ?? ""}
                  onChange={(e) => setEditing({ ...editing, country: e.target.value })}
                />
              </label>
              <label>
                <span>Téléphone</span>
                <input
                  value={editing.phone ?? ""}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                />
              </label>
              <label className="admin-variations__default admin-form__full">
                <input
                  type="checkbox"
                  checked={Boolean(editing.isDefault)}
                  onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })}
                />
                <span>Adresse par défaut</span>
              </label>
            </div>

            <footer className="admin-modal__foot">
              <button
                type="button"
                className="admin-cta admin-cta--ghost"
                onClick={() => setEditing(null)}
              >
                Annuler
              </button>
              <button type="button" className="admin-cta" onClick={save}>
                Enregistrer
              </button>
            </footer>
          </article>
        </div>
      ) : null}
    </section>
  );
}
