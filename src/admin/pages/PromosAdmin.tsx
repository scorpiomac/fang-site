import { useEffect, useState } from "react";
import { adminApi, type PromoCode } from "../api";
import { useAdmin } from "../AdminContext";
import { formatPriceXof } from "@/content/shop";

const emptyPromo = (): Partial<PromoCode> => ({
  code: "",
  label: "",
  type: "percent",
  value: 10,
  active: true,
  minSubtotalXof: null,
  maxUses: null,
  expiresAt: null,
  description: "",
});

export function PromosAdmin() {
  const { setToast } = useAdmin();
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<PromoCode> | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const { promos: list } = await adminApi.fetchPromos();
      setPromos(list);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const save = async () => {
    if (!editing?.code?.trim()) {
      setToast("Code requis");
      return;
    }
    try {
      if (creating) {
        await adminApi.createPromo(editing);
        setToast("Code promo créé");
      } else if (editing.id) {
        await adminApi.patchPromo(editing.id, editing);
        setToast("Code promo mis à jour");
      }
      setEditing(null);
      setCreating(false);
      await refresh();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce code promo ?")) return;
    try {
      await adminApi.deletePromo(id);
      await refresh();
      setToast("Code supprimé");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <section className="admin-page">
      <header className="admin-page__head admin-page__head--row">
        <div>
          <p className="admin-eyebrow">Commerce</p>
          <h1>Codes promo</h1>
          <p className="admin-page__lede">
            Créez des remises en pourcentage ou montant fixe. Les clients les appliquent au
            checkout.
          </p>
        </div>
        <button
          type="button"
          className="admin-cta"
          onClick={() => {
            setCreating(true);
            setEditing(emptyPromo());
          }}
        >
          Nouveau code
        </button>
      </header>

      {loading ? <p className="admin-loading">Chargement…</p> : null}

      <ul className="admin-promo-list">
        {promos.map((p) => (
          <li key={p.id} className="admin-promo-row">
            <div className="admin-promo-row__main">
              <strong>{p.code}</strong>
              <span>{p.label}</span>
            </div>
            <div className="admin-promo-row__meta">
              <span>
                {p.type === "percent" ? `${p.value} %` : `${formatPriceXof(p.value)} XOF`}
              </span>
              <span>
                {p.usedCount}
                {p.maxUses != null ? ` / ${p.maxUses}` : ""} utilisations
              </span>
              <span className={`admin-tag ${p.active ? "admin-tag--accent" : "admin-tag--muted"}`}>
                {p.active ? "Actif" : "Inactif"}
              </span>
            </div>
            <div className="admin-promo-row__actions">
              <button
                type="button"
                className="admin-cta admin-cta--small admin-cta--ghost"
                onClick={() => {
                  setCreating(false);
                  setEditing(p);
                }}
              >
                Éditer
              </button>
              <button
                type="button"
                className="admin-icon-btn admin-icon-btn--danger"
                onClick={() => remove(p.id)}
              >
                ✕
              </button>
            </div>
          </li>
        ))}
        {!loading && promos.length === 0 ? (
          <li className="admin-photo-grid__empty">Aucun code promo. Créez-en un pour commencer.</li>
        ) : null}
      </ul>

      {editing ? (
        <div
          className="admin-modal"
          onClick={(e) => e.currentTarget === e.target && setEditing(null)}
        >
          <article className="admin-modal__panel">
            <header className="admin-modal__head">
              <h2>{creating ? "Nouveau code promo" : `Éditer ${editing.code}`}</h2>
              <button type="button" className="admin-icon-btn" onClick={() => setEditing(null)}>
                ✕
              </button>
            </header>
            <div className="admin-form">
              <label>
                <span>Code (affiché au client)</span>
                <input
                  value={editing.code ?? ""}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                  placeholder="FANG10"
                />
              </label>
              <label>
                <span>Libellé interne</span>
                <input
                  value={editing.label ?? ""}
                  onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                />
              </label>
              <label>
                <span>Type de remise</span>
                <select
                  value={editing.type ?? "percent"}
                  onChange={(e) =>
                    setEditing({ ...editing, type: e.target.value as "percent" | "fixed" })
                  }
                >
                  <option value="percent">Pourcentage (%)</option>
                  <option value="fixed">Montant fixe (XOF)</option>
                </select>
              </label>
              <label>
                <span>Valeur</span>
                <input
                  type="number"
                  min={0}
                  value={editing.value ?? 0}
                  onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })}
                />
              </label>
              <label>
                <span>Minimum commande (XOF, option)</span>
                <input
                  type="number"
                  min={0}
                  value={editing.minSubtotalXof ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      minSubtotalXof: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </label>
              <label>
                <span>Utilisations max (option)</span>
                <input
                  type="number"
                  min={1}
                  value={editing.maxUses ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      maxUses: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </label>
              <label>
                <span>Expiration (option)</span>
                <input
                  type="datetime-local"
                  value={editing.expiresAt?.slice(0, 16) ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      expiresAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                    })
                  }
                />
              </label>
              <label className="admin-variations__default">
                <input
                  type="checkbox"
                  checked={editing.active !== false}
                  onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                />
                <span>Code actif</span>
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
