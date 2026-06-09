import { useEffect, useState } from "react";
import { adminApi } from "../api";

type AuditEntry = Awaited<ReturnType<typeof adminApi.fetchAudit>>["entries"][number];

const ACTION_LABELS: Record<string, string> = {
  "admin.login": "Connexion admin",
  "admin.login.failed": "Tentative échouée",
  "order.update": "Commande modifiée",
  "user.delete": "Utilisateur supprimé",
  "settings.update": "Réglages modifiés",
  "promo.delete": "Code promo supprimé",
};

function actionLabel(a: string): string {
  return ACTION_LABELS[a] ?? a;
}

export function AuditAdmin() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await adminApi.fetchAudit({ action: filter || undefined, limit: 200 });
      setEntries(data.entries);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <section className="admin-page">
      <header className="admin-page__head admin-page__head--row">
        <div>
          <p className="admin-eyebrow">Sécurité</p>
          <h1>Journal d'audit</h1>
          <p className="admin-page__lede">
            Connexions, modifications de commandes, suppressions, changements de réglages. {total} évènements consignés.
          </p>
        </div>
        <div>
          <label style={{ display: "flex", flexDirection: "column", fontSize: 12 }}>
            <span style={{ opacity: 0.7 }}>Filtrer par action</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">Toutes</option>
              {Object.entries(ACTION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {loading ? <p>Chargement…</p> : null}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Quand</th>
            <th>Action</th>
            <th>Acteur</th>
            <th>Cible</th>
            <th>Détails</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              <td>{new Date(e.at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "medium" })}</td>
              <td><strong>{actionLabel(e.action)}</strong><br/><small style={{ opacity: 0.5 }}>{e.action}</small></td>
              <td>
                {e.actor ? (
                  <>
                    <div>{e.actor.name ?? e.actor.email ?? "—"}</div>
                    <small style={{ opacity: 0.6 }}>{e.actor.role ?? ""}</small>
                  </>
                ) : <em style={{ opacity: 0.5 }}>—</em>}
              </td>
              <td>
                {e.target ? (
                  <>
                    {e.target.type}: <code>{e.target.id}</code>
                  </>
                ) : <em style={{ opacity: 0.5 }}>—</em>}
              </td>
              <td style={{ fontSize: 11, maxWidth: 280, wordBreak: "break-word" }}>
                {e.meta ? <code>{JSON.stringify(e.meta)}</code> : null}
              </td>
              <td style={{ fontSize: 11, opacity: 0.6 }}>{e.ip ?? ""}</td>
            </tr>
          ))}
          {entries.length === 0 && !loading ? (
            <tr><td colSpan={6} style={{ textAlign: "center", opacity: 0.6, padding: 24 }}>Aucun évènement</td></tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
}
