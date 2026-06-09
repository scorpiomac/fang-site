import { useEffect, useState } from "react";
import { adminApi, type ShippingZone } from "../api";
import { useAdmin } from "../AdminContext";

function emptyZone(): ShippingZone {
  return {
    id: "",
    name: "",
    countries: [],
    cities: [],
    priceXof: 0,
    freeAboveXof: null,
    etaDays: "",
    active: true,
  };
}

export function ShippingAdmin() {
  const { setToast } = useAdmin();
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ShippingZone | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const { zones } = await adminApi.fetchShippingZones();
      setZones(zones);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const startCreate = () => {
    setEditing(emptyZone());
    setCreating(true);
  };

  const startEdit = (z: ShippingZone) => {
    setEditing({ ...z });
    setCreating(false);
  };

  const save = async () => {
    if (!editing) return;
    try {
      if (creating) {
        await adminApi.createShippingZone(editing);
      } else {
        await adminApi.updateShippingZone(editing.id, editing);
      }
      setEditing(null);
      setCreating(false);
      await refresh();
      setToast("Zone enregistrée");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    }
  };

  const removeZone = async (id: string) => {
    if (!confirm("Supprimer cette zone ?")) return;
    try {
      await adminApi.deleteShippingZone(id);
      await refresh();
      setToast("Zone supprimée");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <section className="admin-page">
      <header className="admin-page__head admin-page__head--row">
        <div>
          <p className="admin-eyebrow">Logistique</p>
          <h1>Zones & frais de livraison</h1>
          <p className="admin-page__lede">
            Définissez les pays, villes, tarifs et conditions de gratuité par zone. Le client
            verra la zone correspondant à son adresse à l'étape commande.
          </p>
        </div>
        <button type="button" className="admin-cta" onClick={startCreate}>
          + Ajouter une zone
        </button>
      </header>

      {loading ? <p className="admin-loading">Chargement…</p> : null}

      <ul className="admin-promo-list">
        {zones.map((z) => (
          <li key={z.id} className="admin-promo-row">
            <div className="admin-promo-row__main">
              <strong>{z.name}</strong>
              <span className="admin-help">
                {z.countries.length === 0
                  ? "Tous pays (catch-all)"
                  : z.countries.join(", ")}
                {z.cities.length > 0 ? ` · villes : ${z.cities.slice(0, 4).join(", ")}${z.cities.length > 4 ? "…" : ""}` : ""}
              </span>
              {z.etaDays ? <span className="admin-help">Délai : {z.etaDays}</span> : null}
            </div>
            <div className="admin-promo-row__meta">
              <strong>{z.priceXof.toLocaleString("fr-SN")} XOF</strong>
              {z.freeAboveXof != null ? (
                <span className="admin-tag admin-tag--muted">
                  Gratuit dès {z.freeAboveXof.toLocaleString("fr-SN")} XOF
                </span>
              ) : null}
              <span className={`admin-tag ${z.active ? "admin-tag--accent" : "admin-tag--muted"}`}>
                {z.active ? "Actif" : "Désactivé"}
              </span>
            </div>
            <div className="admin-promo-row__actions">
              <button type="button" className="admin-link" onClick={() => startEdit(z)}>
                Éditer
              </button>
              <button
                type="button"
                className="admin-link admin-link--danger"
                onClick={() => removeZone(z.id)}
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
        {!loading && zones.length === 0 ? (
          <li className="admin-photo-grid__empty">Aucune zone configurée.</li>
        ) : null}
      </ul>

      {editing ? (
        <div
          className="admin-modal"
          onClick={(e) => e.currentTarget === e.target && setEditing(null)}
        >
          <article className="admin-modal__panel">
            <header className="admin-modal__head">
              <h2>{creating ? "Nouvelle zone" : `Modifier — ${editing.name}`}</h2>
              <button type="button" className="admin-icon-btn" onClick={() => setEditing(null)}>
                ✕
              </button>
            </header>

            <div className="admin-form admin-form--two">
              <label>
                <span>Nom (visible client)</span>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </label>
              <label>
                <span>Identifiant (laisser vide pour auto)</span>
                <input
                  value={editing.id}
                  disabled={!creating}
                  placeholder="dakar"
                  onChange={(e) =>
                    setEditing({ ...editing, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })
                  }
                />
              </label>
              <label className="admin-form__full">
                <span>Pays (séparés par virgule, vide = catch-all)</span>
                <input
                  value={editing.countries.join(", ")}
                  placeholder="Sénégal, Côte d'Ivoire"
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      countries: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>
              <label className="admin-form__full">
                <span>Villes (optionnel, virgule)</span>
                <input
                  value={editing.cities.join(", ")}
                  placeholder="Dakar, Almadies, Plateau"
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      cities: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>
              <label>
                <span>Prix (XOF)</span>
                <input
                  type="number"
                  min={0}
                  value={editing.priceXof}
                  onChange={(e) =>
                    setEditing({ ...editing, priceXof: Number(e.target.value) || 0 })
                  }
                />
              </label>
              <label>
                <span>Gratuit au-dessus de (XOF, vide = jamais)</span>
                <input
                  type="number"
                  min={0}
                  value={editing.freeAboveXof ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      freeAboveXof: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                <span>Délai estimé (texte)</span>
                <input
                  value={editing.etaDays}
                  placeholder="24-48 h"
                  onChange={(e) => setEditing({ ...editing, etaDays: e.target.value })}
                />
              </label>
              <label className="admin-variations__default">
                <input
                  type="checkbox"
                  checked={editing.active}
                  onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                />
                <span>Zone active</span>
              </label>
            </div>

            <footer className="admin-modal__foot">
              <button type="button" className="admin-cta admin-cta--ghost" onClick={() => setEditing(null)}>
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
