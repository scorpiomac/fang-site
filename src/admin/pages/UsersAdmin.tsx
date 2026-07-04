import { useEffect, useState } from "react";
import { adminApi, type AdminRole, type AdminUser } from "../api";
import { useAdmin } from "../AdminContext";

const ROLE_LABELS: Record<AdminRole, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  editor: "Éditeur",
};

const ROLE_HINTS: Record<AdminRole, string> = {
  owner: "Accès total, compte principal atelier",
  admin: "Commerce, catalogue, utilisateurs (sauf propriétaire)",
  editor: "Collections, produits, médiathèque, contenu",
};

const emptyUser = (): {
  email: string;
  name: string;
  password: string;
  role: AdminRole;
  active: boolean;
} => ({
  email: "",
  name: "",
  password: "",
  role: "editor",
  active: true,
});

export function UsersAdmin() {
  const { user: currentUser, setToast } = useAdmin();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(Partial<AdminUser> & { password?: string }) | null>(
    null
  );
  const [creating, setCreating] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const { users: list, roles: r } = await adminApi.fetchUsers();
      setUsers(list);
      setRoles(r);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const creatableRoles = roles.filter((r) => {
    if (r === "owner") return false;
    if (r === "admin" && currentUser?.role !== "owner") return false;
    return true;
  });

  const save = async () => {
    if (!editing) return;
    try {
      if (creating) {
        if (!editing.email?.trim() || !editing.password || editing.password.length < 12) {
          setToast("E-mail et mot de passe (12 car.) requis");
          return;
        }
        await adminApi.createUser({
          email: editing.email,
          name: editing.name,
          password: editing.password,
          role: editing.role ?? "editor",
          active: editing.active !== false,
        });
        setToast("Utilisateur créé");
      } else if (editing.id) {
        const patch: Parameters<typeof adminApi.patchUser>[1] = {
          email: editing.email,
          name: editing.name,
          role: editing.role,
          active: editing.active,
        };
        if (editing.password?.trim()) patch.password = editing.password;
        await adminApi.patchUser(editing.id, patch);
        setToast("Utilisateur mis à jour");
      }
      setEditing(null);
      setCreating(false);
      await refresh();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    try {
      await adminApi.deleteUser(id);
      await refresh();
      setToast("Utilisateur supprimé");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <section className="admin-page">
      <header className="admin-page__head admin-page__head--row">
        <div>
          <p className="admin-eyebrow">Équipe</p>
          <h1>Utilisateurs</h1>
          <p className="admin-page__lede">
            Comptes de l&apos;équipe atelier. Chaque membre se connecte avec son e-mail et son mot
            de passe.
          </p>
        </div>
        <button
          type="button"
          className="admin-cta"
          onClick={() => {
            setCreating(true);
            setEditing(emptyUser());
          }}
        >
          Nouvel utilisateur
        </button>
      </header>

      <div className="admin-block admin-block--compact">
        <ul className="admin-quick">
          {Object.entries(ROLE_HINTS).map(([role, hint]) => (
            <li key={role}>
              <strong>{ROLE_LABELS[role as AdminRole]}</strong>
              <span>{hint}</span>
            </li>
          ))}
        </ul>
      </div>

      {loading ? <p className="admin-loading">Chargement…</p> : null}

      <ul className="admin-promo-list">
        {users.map((u) => (
          <li key={u.id} className="admin-promo-row">
            <div className="admin-promo-row__main">
              <strong>{u.name}</strong>
              <span>{u.email}</span>
            </div>
            <div className="admin-promo-row__meta">
              <span className={`admin-tag ${u.active ? "admin-tag--accent" : "admin-tag--muted"}`}>
                {u.active ? "Actif" : "Inactif"}
              </span>
              <span className="admin-tag admin-tag--muted">{ROLE_LABELS[u.role]}</span>
              {u.lastLoginAt ? (
                <span>Dernière connexion {new Date(u.lastLoginAt).toLocaleString("fr-FR")}</span>
              ) : (
                <span>Jamais connecté</span>
              )}
            </div>
            <div className="admin-promo-row__actions">
              <button
                type="button"
                className="admin-cta admin-cta--small admin-cta--ghost"
                onClick={() => {
                  setCreating(false);
                  setEditing({ ...u, password: "" });
                }}
              >
                Éditer
              </button>
              {u.role !== "owner" && u.id !== currentUser?.id ? (
                <button
                  type="button"
                  className="admin-icon-btn admin-icon-btn--danger"
                  onClick={() => remove(u.id)}
                >
                  ✕
                </button>
              ) : null}
            </div>
          </li>
        ))}
        {!loading && users.length === 0 ? (
          <li className="admin-photo-grid__empty">Aucun utilisateur.</li>
        ) : null}
      </ul>

      {editing ? (
        <div
          className="admin-modal"
          onClick={(e) => e.currentTarget === e.target && setEditing(null)}
        >
          <article className="admin-modal__panel">
            <header className="admin-modal__head">
              <h2>{creating ? "Nouvel utilisateur" : `Éditer ${editing.name}`}</h2>
              <button type="button" className="admin-icon-btn" onClick={() => setEditing(null)}>
                ✕
              </button>
            </header>
            <div className="admin-form">
              <label>
                <span>Nom affiché</span>
                <input
                  value={editing.name ?? ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </label>
              <label>
                <span>E-mail (identifiant)</span>
                <input
                  type="email"
                  value={editing.email ?? ""}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                  disabled={editing.role === "owner" && !creating}
                />
              </label>
              <label>
                <span>{creating ? "Mot de passe" : "Nouveau mot de passe (option)"}</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={editing.password ?? ""}
                  onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                  placeholder={creating ? "Min. 12 caractères" : "Laisser vide pour conserver"}
                  required={creating}
                  minLength={creating ? 12 : undefined}
                />
              </label>
              {editing.role !== "owner" ? (
                <label>
                  <span>Rôle</span>
                  <select
                    value={editing.role ?? "editor"}
                    onChange={(e) =>
                      setEditing({ ...editing, role: e.target.value as AdminRole })
                    }
                  >
                    {creatableRoles.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                    {!creating && editing.role === "admin" && !creatableRoles.includes("admin") ? (
                      <option value="admin">{ROLE_LABELS.admin}</option>
                    ) : null}
                  </select>
                </label>
              ) : null}
              {editing.role !== "owner" ? (
                <label className="admin-variations__default">
                  <input
                    type="checkbox"
                    checked={editing.active !== false}
                    onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                  />
                  <span>Compte actif</span>
                </label>
              ) : null}
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
