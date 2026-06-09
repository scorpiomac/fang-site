import { useEffect, useState } from "react";
import { adminApi, type MailTemplate } from "../api";
import { useAdmin } from "../AdminContext";

const VARIABLES: Record<string, string[]> = {
  order_confirmation: [
    "brand",
    "contactEmail",
    "leadTime",
    "orderId",
    "orderSummary",
    "subtotal",
    "shipping",
    "taxLine",
    "discountLine",
    "total",
    "paymentLabel",
    "paymentInstructions",
    "customerName",
    "accountUrl",
  ],
  order_status_change: [
    "brand",
    "orderId",
    "statusLabel",
    "statusBody",
    "total",
    "customerName",
  ],
  customer_welcome: ["brand", "customerName", "accountUrl"],
  password_reset: ["brand", "customerName", "resetUrl"],
  admin_new_order: [
    "brand",
    "orderId",
    "customerName",
    "customerEmail",
    "customerPhone",
    "customerCity",
    "customerCountry",
    "total",
    "paymentLabel",
    "orderSummary",
    "adminOrderUrl",
  ],
  contact_message: ["brand", "contactName", "contactEmail", "contactPhone", "contactMessage"],
};

export function MailAdmin() {
  const { setToast } = useAdmin();
  const [templates, setTemplates] = useState<Record<string, MailTemplate>>({});
  const [status, setStatus] = useState<{ smtpConfigured: boolean; ok: boolean; reason?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MailTemplate | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const [tplRes, statusRes] = await Promise.all([
        adminApi.fetchMailTemplates(),
        adminApi.fetchMailStatus(),
      ]);
      setTemplates(tplRes.templates);
      setStatus(statusRes);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const startEdit = (id: string) => {
    setEditingId(id);
    setDraft({ ...templates[id] });
  };

  const save = async () => {
    if (!editingId || !draft) return;
    try {
      const { template } = await adminApi.updateMailTemplate(editingId, draft);
      setTemplates((prev) => ({ ...prev, [editingId]: template }));
      setEditingId(null);
      setDraft(null);
      setToast("Template enregistré");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    }
  };

  const sendTest = async () => {
    if (!testEmail.trim()) return;
    setTesting(true);
    try {
      const res = await adminApi.sendMailTest(testEmail.trim());
      if (res.ok) setToast(`E-mail test envoyé à ${testEmail}`);
      else setToast(res.error ?? "Erreur SMTP");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <section className="admin-page">
        <p className="admin-loading">Chargement…</p>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <header className="admin-page__head">
        <p className="admin-eyebrow">Notifications</p>
        <h1>E-mails transactionnels</h1>
        <p className="admin-page__lede">
          Configurez le contenu des e-mails envoyés automatiquement par le site
          (confirmation, changements de statut, mot de passe oublié, etc.).
        </p>
      </header>

      <div className="admin-block">
        <h2>État SMTP</h2>
        {status?.smtpConfigured ? (
          <p>
            <span className={`admin-tag ${status.ok ? "admin-tag--accent" : "admin-tag--warning"}`}>
              {status.ok ? "Connecté" : "Erreur"}
            </span>{" "}
            {status.reason ? <em className="admin-help">{status.reason}</em> : null}
          </p>
        ) : (
          <p className="admin-help">
            SMTP non configuré. Renseignez dans <code>.env</code> :{" "}
            <code>FANG_SMTP_HOST</code>, <code>FANG_SMTP_PORT</code>,{" "}
            <code>FANG_SMTP_USER</code>, <code>FANG_SMTP_PASS</code>,{" "}
            <code>FANG_SMTP_SECURE</code>.
          </p>
        )}
        <div className="admin-form admin-form--two">
          <label>
            <span>Tester l'envoi à :</span>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="vous@example.com"
            />
          </label>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              type="button"
              className="admin-cta admin-cta--small"
              onClick={sendTest}
              disabled={testing || !testEmail.trim()}
            >
              {testing ? "Envoi…" : "Envoyer un test"}
            </button>
          </div>
        </div>
      </div>

      <ul className="admin-promo-list">
        {Object.entries(templates).map(([id, tpl]) => (
          <li key={id} className="admin-promo-row">
            <div className="admin-promo-row__main">
              <strong>{tpl.label}</strong>
              <span className="admin-help">Sujet : {tpl.subject}</span>
            </div>
            <button
              type="button"
              className="admin-cta admin-cta--small admin-cta--ghost"
              onClick={() => startEdit(id)}
            >
              Éditer
            </button>
          </li>
        ))}
      </ul>

      {editingId && draft ? (
        <div
          className="admin-modal"
          onClick={(e) => e.currentTarget === e.target && setEditingId(null)}
        >
          <article className="admin-modal__panel admin-modal__panel--wide">
            <header className="admin-modal__head">
              <h2>{draft.label}</h2>
              <button type="button" className="admin-icon-btn" onClick={() => setEditingId(null)}>
                ✕
              </button>
            </header>

            <div className="admin-form">
              <label>
                <span>Sujet de l'e-mail</span>
                <input
                  value={draft.subject}
                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                />
              </label>
              <label>
                <span>Corps du message</span>
                <textarea
                  rows={14}
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                />
              </label>
              <p className="admin-help">
                Variables disponibles :{" "}
                {VARIABLES[editingId]?.map((v) => (
                  <code key={v} style={{ marginRight: 8 }}>{`{{${v}}}`}</code>
                ))}
              </p>
            </div>

            <footer className="admin-modal__foot">
              <button
                type="button"
                className="admin-cta admin-cta--ghost"
                onClick={() => setEditingId(null)}
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
