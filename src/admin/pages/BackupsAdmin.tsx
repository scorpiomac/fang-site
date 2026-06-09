import { useEffect, useState } from "react";
import { adminApi } from "../api";
import { useAdmin } from "../AdminContext";

export function BackupsAdmin() {
  const { setToast } = useAdmin();
  const [backups, setBackups] = useState<{ name: string; size: number; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const { backups } = await adminApi.fetchBackups();
      setBackups(backups);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const create = async () => {
    setBusy(true);
    try {
      const { file } = await adminApi.createBackup();
      setToast(`Backup créé : ${file}`);
      await refresh();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur backup");
    } finally {
      setBusy(false);
    }
  };

  const restore = async (name: string) => {
    if (!confirm(`Restaurer le backup ${name} ? Les données actuelles seront remplacées (snapshot conservé).`))
      return;
    setBusy(true);
    try {
      const r = await adminApi.restoreBackup(name);
      setToast(`Restauré : ${r.restoredFiles.length} fichier(s)`);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur restauration");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-page">
      <header className="admin-page__head admin-page__head--row">
        <div>
          <p className="admin-eyebrow">Sécurité</p>
          <h1>Backups</h1>
          <p className="admin-page__lede">
            Sauvegardes quotidiennes automatiques des données (commandes, clients, stock, etc.).
            Rotation sur 7 jours.
          </p>
        </div>
        <button type="button" className="admin-cta" onClick={create} disabled={busy}>
          {busy ? "…" : "Créer un backup maintenant"}
        </button>
      </header>

      {loading ? <p>Chargement…</p> : null}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Fichier</th>
            <th>Taille</th>
            <th>Créé le</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {backups.map((b) => (
            <tr key={b.name}>
              <td><code>{b.name}</code></td>
              <td>{(b.size / 1024).toFixed(1)} ko</td>
              <td>{new Date(b.createdAt).toLocaleString("fr-FR")}</td>
              <td>
                <button
                  type="button"
                  className="admin-cta admin-cta--ghost admin-cta--small"
                  onClick={() => restore(b.name)}
                  disabled={busy}
                >
                  Restaurer
                </button>
              </td>
            </tr>
          ))}
          {backups.length === 0 && !loading ? (
            <tr><td colSpan={4} style={{ textAlign: "center", opacity: 0.6, padding: 24 }}>Aucun backup</td></tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
}
