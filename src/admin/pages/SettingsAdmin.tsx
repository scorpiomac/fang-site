import { useEffect, useState } from "react";
import { adminApi, type SiteSettings } from "../api";
import { useAdmin } from "../AdminContext";

type PayStatus = Awaited<ReturnType<typeof adminApi.fetchPaymentsStatus>>;

type Tab =
  | "brand"
  | "contact"
  | "currency"
  | "tax"
  | "payments"
  | "online"
  | "production"
  | "mail"
  | "maintenance"
  | "legal";

const TABS: { id: Tab; label: string }[] = [
  { id: "brand", label: "Marque" },
  { id: "contact", label: "Contact" },
  { id: "currency", label: "Devise" },
  { id: "tax", label: "TVA / Taxes" },
  { id: "payments", label: "Paiements" },
  { id: "online", label: "Paiement en ligne" },
  { id: "production", label: "Production" },
  { id: "mail", label: "E-mails" },
  { id: "maintenance", label: "Maintenance" },
  { id: "legal", label: "Mentions légales" },
];

export function SettingsAdmin() {
  const { setToast } = useAdmin();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("brand");
  const [payStatus, setPayStatus] = useState<PayStatus | null>(null);

  useEffect(() => {
    adminApi
      .fetchSettings()
      .then(({ settings }) => setSettings(settings))
      .catch((err) => setToast(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [setToast]);

  useEffect(() => {
    if (tab !== "online") return;
    adminApi
      .fetchPaymentsStatus()
      .then(setPayStatus)
      .catch(() => {});
  }, [tab]);

  if (loading || !settings) {
    return (
      <section className="admin-page">
        <p className="admin-loading">Chargement…</p>
      </section>
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      const { settings: next } = await adminApi.patchSettings(settings);
      setSettings(next);
      setToast("Réglages enregistrés");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const patch = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) =>
    setSettings({ ...settings, [key]: value });

  return (
    <section className="admin-page">
      <header className="admin-page__head admin-page__head--row">
        <div>
          <p className="admin-eyebrow">Configuration</p>
          <h1>Réglages boutique</h1>
          <p className="admin-page__lede">
            Tout ce qui est commun au site et à la boutique : marque, contact, devise, paiements,
            mode maintenance. Ces valeurs sont utilisées partout sur le site.
          </p>
        </div>
        <button type="button" className="admin-cta" onClick={save} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </header>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`admin-tab${tab === t.id ? " is-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "brand" ? (
        <div className="admin-form admin-form--two">
          <label>
            <span>Nom de la marque</span>
            <input
              value={settings.brand.name}
              onChange={(e) => patch("brand", { ...settings.brand, name: e.target.value })}
            />
          </label>
          <label>
            <span>Slogan / tagline</span>
            <input
              value={settings.brand.tagline}
              onChange={(e) => patch("brand", { ...settings.brand, tagline: e.target.value })}
            />
          </label>
          <label>
            <span>Raison sociale</span>
            <input
              value={settings.brand.legalName}
              onChange={(e) => patch("brand", { ...settings.brand, legalName: e.target.value })}
            />
          </label>
          <label>
            <span>Adresse atelier</span>
            <input
              value={settings.brand.address}
              onChange={(e) => patch("brand", { ...settings.brand, address: e.target.value })}
            />
          </label>
          <label>
            <span>URL publique du site (SEO)</span>
            <input
              type="url"
              placeholder="https://www.fang.studio"
              value={settings.brand.siteUrl ?? ""}
              onChange={(e) => patch("brand", { ...settings.brand, siteUrl: e.target.value })}
            />
            <small>Utilisé pour sitemap.xml, balises canoniques et Schema.org.</small>
          </label>
        </div>
      ) : null}

      {tab === "contact" ? (
        <div className="admin-form admin-form--two">
          <label>
            <span>E-mail public</span>
            <input
              type="email"
              value={settings.contact.email}
              onChange={(e) => patch("contact", { ...settings.contact, email: e.target.value })}
            />
          </label>
          <label>
            <span>Téléphone</span>
            <input
              value={settings.contact.phone}
              onChange={(e) => patch("contact", { ...settings.contact, phone: e.target.value })}
            />
          </label>
          <label>
            <span>WhatsApp (sans +)</span>
            <input
              value={settings.contact.whatsapp}
              placeholder="221770000000"
              onChange={(e) => patch("contact", { ...settings.contact, whatsapp: e.target.value })}
            />
          </label>
          <label>
            <span>Horaires support</span>
            <input
              value={settings.contact.supportHours}
              onChange={(e) =>
                patch("contact", { ...settings.contact, supportHours: e.target.value })
              }
            />
          </label>

          <h3 className="admin-form__section">Réseaux sociaux</h3>
          {(["instagram", "facebook", "tiktok", "youtube"] as const).map((k) => (
            <label key={k}>
              <span>{k.charAt(0).toUpperCase() + k.slice(1)}</span>
              <input
                value={settings.social[k]}
                placeholder="https://…"
                onChange={(e) => patch("social", { ...settings.social, [k]: e.target.value })}
              />
            </label>
          ))}
        </div>
      ) : null}

      {tab === "currency" ? (
        <div className="admin-form admin-form--two">
          <label>
            <span>Code (ISO 4217)</span>
            <input
              value={settings.currency.code}
              onChange={(e) => patch("currency", { ...settings.currency, code: e.target.value })}
            />
          </label>
          <label>
            <span>Libellé (affichage)</span>
            <input
              value={settings.currency.label}
              onChange={(e) => patch("currency", { ...settings.currency, label: e.target.value })}
            />
          </label>
          <label>
            <span>Symbole</span>
            <input
              value={settings.currency.symbol}
              onChange={(e) =>
                patch("currency", { ...settings.currency, symbol: e.target.value })
              }
            />
          </label>
          <label>
            <span>Locale (ex. fr-SN)</span>
            <input
              value={settings.currency.locale}
              onChange={(e) =>
                patch("currency", { ...settings.currency, locale: e.target.value })
              }
            />
          </label>
        </div>
      ) : null}

      {tab === "tax" ? (
        <div className="admin-form admin-form--two">
          <label className="admin-variations__default">
            <input
              type="checkbox"
              checked={settings.tax.enabled}
              onChange={(e) => patch("tax", { ...settings.tax, enabled: e.target.checked })}
            />
            <span>Activer la TVA / taxes sur les commandes</span>
          </label>
          <label>
            <span>Taux (%)</span>
            <input
              type="number"
              step={0.01}
              min={0}
              value={settings.tax.rate}
              onChange={(e) =>
                patch("tax", { ...settings.tax, rate: Number(e.target.value) || 0 })
              }
            />
          </label>
          <label>
            <span>Libellé</span>
            <input
              value={settings.tax.label}
              onChange={(e) => patch("tax", { ...settings.tax, label: e.target.value })}
            />
          </label>
          <label className="admin-variations__default">
            <input
              type="checkbox"
              checked={settings.tax.included}
              onChange={(e) => patch("tax", { ...settings.tax, included: e.target.checked })}
            />
            <span>Prix TTC (taxe incluse dans les prix affichés)</span>
          </label>
        </div>
      ) : null}

      {tab === "payments" ? (
        <div className="admin-form">
          <p className="admin-help">
            Activez les méthodes de paiement proposées au checkout. Les instructions sont affichées
            au client après commande.
          </p>
          <ul className="admin-promo-list">
            {settings.payments.methods.map((m, i) => (
              <li key={m.id} className="admin-promo-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <strong>{m.label}</strong>
                  <label className="admin-variations__default">
                    <input
                      type="checkbox"
                      checked={m.active}
                      onChange={(e) => {
                        const methods = [...settings.payments.methods];
                        methods[i] = { ...m, active: e.target.checked };
                        patch("payments", { methods });
                      }}
                    />
                    <span>Actif</span>
                  </label>
                </div>
                <label>
                  <span>Instructions</span>
                  <textarea
                    rows={2}
                    value={m.instructions}
                    onChange={(e) => {
                      const methods = [...settings.payments.methods];
                      methods[i] = { ...m, instructions: e.target.value };
                      patch("payments", { methods });
                    }}
                  />
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === "online" ? (
        <div className="admin-form">
          <label>
            <span>Passerelle de paiement en ligne</span>
            <select
              value={settings.checkout?.paymentProvider ?? "off"}
              onChange={(e) =>
                patch("checkout", {
                  ...(settings.checkout ?? {
                    paymentProvider: "off",
                    allowSimulated: false,
                    minOnlineAmount: 200,
                  }),
                  paymentProvider: e.target.value as "off" | "paytech" | "paydunya",
                })
              }
            >
              <option value="off">Désactivé (paiement hors-ligne uniquement)</option>
              <option value="paytech">PayTech (Sénégal) — Wave, Orange Money, Carte…</option>
              <option value="paydunya">PayDunya — multi-pays (Sénégal, Côte d'Ivoire, etc.)</option>
            </select>
            <small>
              Le choix n'est effectif que si les clés .env correspondantes sont configurées. Le
              statut réel est indiqué ci-dessous.
            </small>
          </label>

          <label>
            <span>Montant minimum pour paiement en ligne (FCFA)</span>
            <input
              type="number"
              min="0"
              step="100"
              value={settings.checkout?.minOnlineAmount ?? 200}
              onChange={(e) =>
                patch("checkout", {
                  ...(settings.checkout ?? {
                    paymentProvider: "off",
                    allowSimulated: false,
                    minOnlineAmount: 200,
                  }),
                  minOnlineAmount: Number(e.target.value) || 0,
                })
              }
            />
            <small>PayDunya impose 200 FCFA minimum.</small>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={settings.checkout?.allowSimulated ?? false}
              onChange={(e) =>
                patch("checkout", {
                  ...(settings.checkout ?? {
                    paymentProvider: "off",
                    allowSimulated: false,
                    minOnlineAmount: 200,
                  }),
                  allowSimulated: e.target.checked,
                })
              }
            />
            <span>Autoriser un paiement simulé en dev (si aucun provider configuré)</span>
          </label>

          {payStatus ? (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(242,235,227,0.1)",
                borderRadius: 6,
              }}
            >
              <p style={{ marginTop: 0, fontWeight: 600 }}>Statut des passerelles</p>
              <ul style={{ paddingLeft: 18, lineHeight: 1.8 }}>
                <li>
                  <strong>PayTech</strong> :{" "}
                  {payStatus.paytech.ready ? (
                    <span style={{ color: "#9fd99f" }}>
                      ✓ Configurée ({payStatus.paytech.env})
                    </span>
                  ) : (
                    <span style={{ color: "#f0a3a3" }}>
                      ⚠ Clés API absentes (voir .env : PAYTECH_API_KEY / PAYTECH_API_SECRET)
                    </span>
                  )}
                </li>
                <li>
                  <strong>PayDunya</strong> :{" "}
                  {payStatus.paydunya.ready ? (
                    <span style={{ color: "#9fd99f" }}>
                      ✓ Configurée ({payStatus.paydunya.mode})
                    </span>
                  ) : (
                    <span style={{ color: "#f0a3a3" }}>
                      ⚠ Clés absentes (PAYDUNYA_MASTER_KEY / PAYDUNYA_PRIVATE_KEY /
                      PAYDUNYA_TOKEN)
                    </span>
                  )}
                </li>
                <li>
                  <strong>Provider actif effectif</strong> :{" "}
                  {payStatus.active ? (
                    <code>{payStatus.active}</code>
                  ) : (
                    <span style={{ opacity: 0.7 }}>
                      Aucun (sélection : <code>{payStatus.selected}</code>)
                    </span>
                  )}
                </li>
                {payStatus.simulatedAllowed ? (
                  <li style={{ opacity: 0.7 }}>
                    Mode simulé autorisé (CHECKOUT_ALLOW_SIMULATED_PAYMENT=true)
                  </li>
                ) : null}
              </ul>
              <p style={{ marginBottom: 0, fontSize: 12, opacity: 0.6 }}>
                Routes IPN/callback :
                <br />
                <code>POST /api/store/checkout/paytech/ipn</code>
                <br />
                <code>POST /api/store/checkout/paydunya/callback</code>
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "production" ? (
        <div className="admin-form">
          <label>
            <span>Délai de production (texte affiché)</span>
            <input
              value={settings.production.leadTime}
              onChange={(e) =>
                patch("production", { ...settings.production, leadTime: e.target.value })
              }
            />
          </label>
          <label className="admin-variations__default">
            <input
              type="checkbox"
              checked={settings.production.showLeadTime}
              onChange={(e) =>
                patch("production", { ...settings.production, showLeadTime: e.target.checked })
              }
            />
            <span>Afficher le délai sur les pages produit</span>
          </label>
        </div>
      ) : null}

      {tab === "mail" ? (
        <div className="admin-form">
          <label>
            <span>Adresse e-mail expéditeur</span>
            <input
              value={settings.mail.from}
              placeholder="FANG Atelier <contact@fang.studio>"
              onChange={(e) => patch("mail", { ...settings.mail, from: e.target.value })}
            />
          </label>
          <label className="admin-variations__default">
            <input
              type="checkbox"
              checked={settings.mail.notifyAdmins}
              onChange={(e) =>
                patch("mail", { ...settings.mail, notifyAdmins: e.target.checked })
              }
            />
            <span>Notifier l'équipe à chaque nouvelle commande</span>
          </label>
          <label>
            <span>Destinataires admin (séparés par virgule)</span>
            <input
              value={settings.mail.adminRecipients}
              placeholder="contact@fang.studio, atelier@fang.studio"
              onChange={(e) =>
                patch("mail", { ...settings.mail, adminRecipients: e.target.value })
              }
            />
          </label>
          <p className="admin-help">
            La configuration SMTP se fait dans le fichier <code>.env</code> (FANG_SMTP_HOST, USER,
            PASS, PORT, SECURE).
          </p>
        </div>
      ) : null}

      {tab === "maintenance" ? (
        <div className="admin-form">
          <label className="admin-variations__default">
            <input
              type="checkbox"
              checked={settings.maintenance.enabled}
              onChange={(e) =>
                patch("maintenance", { ...settings.maintenance, enabled: e.target.checked })
              }
            />
            <span>Activer le mode maintenance (le site est inaccessible)</span>
          </label>
          <label>
            <span>Message affiché</span>
            <textarea
              rows={3}
              value={settings.maintenance.message}
              onChange={(e) =>
                patch("maintenance", { ...settings.maintenance, message: e.target.value })
              }
            />
          </label>
        </div>
      ) : null}

      {tab === "legal" ? (
        <div className="admin-form admin-form--two">
          <label>
            <span>SIRET</span>
            <input
              value={settings.legal.siret}
              onChange={(e) => patch("legal", { ...settings.legal, siret: e.target.value })}
            />
          </label>
          <label>
            <span>RCS</span>
            <input
              value={settings.legal.rcs}
              onChange={(e) => patch("legal", { ...settings.legal, rcs: e.target.value })}
            />
          </label>
          <label>
            <span>N° TVA intracommunautaire</span>
            <input
              value={settings.legal.vatNumber}
              onChange={(e) => patch("legal", { ...settings.legal, vatNumber: e.target.value })}
            />
          </label>
        </div>
      ) : null}
    </section>
  );
}
