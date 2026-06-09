import { useEffect, useState, type FormEvent } from "react";
import { adminApi as api, type AdminPage } from "@/admin/api";

export function PagesAdmin() {
  const [pages, setPages] = useState<AdminPage[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string>("");

  const refresh = async () => {
    setLoading(true);
    try {
      const { pages } = await api.fetchPages();
      setPages(pages);
      if (!selectedSlug && pages[0]) {
        setSelectedSlug(pages[0].slug);
        setDraft(pages[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedSlug) {
      const found = pages.find((p) => p.slug === selectedSlug);
      if (found) setDraft(found);
    }
  }, [selectedSlug, pages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    setFeedback("");
    try {
      const { page } = await api.updatePage(draft.slug, {
        title: draft.title,
        intro: draft.intro,
        body: draft.body,
        enabled: draft.enabled,
      });
      setPages((prev) => prev.map((p) => (p.slug === page.slug ? page : p)));
      setDraft(page);
      setFeedback("Page enregistrée.");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Erreur d'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <h1>Pages éditoriales</h1>
        <p className="admin-page__hint">
          CGV, RGPD, mentions légales, FAQ, guide tailles, à propos, retours — contenu publié sur
          le site sur <code>/pages/&lt;slug&gt;</code>.
        </p>
      </header>

      {loading ? <p>Chargement…</p> : null}

      <div className="admin-pages__layout">
        <aside className="admin-pages__list">
          {pages.map((p) => (
            <button
              key={p.slug}
              type="button"
              className={
                p.slug === selectedSlug
                  ? "admin-pages__item admin-pages__item--active"
                  : "admin-pages__item"
              }
              onClick={() => setSelectedSlug(p.slug)}
            >
              <span className="admin-pages__item-title">{p.title}</span>
              <span className="admin-pages__item-slug">/{p.slug}</span>
            </button>
          ))}
        </aside>

        <section className="admin-pages__editor">
          {draft ? (
            <form onSubmit={handleSubmit} className="admin-form">
              <label className="form-field">
                <span>Slug (URL)</span>
                <input type="text" value={draft.slug} readOnly />
              </label>
              <label className="form-field">
                <span>Titre</span>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  required
                />
              </label>
              <label className="form-field">
                <span>Intro (optionnelle)</span>
                <textarea
                  rows={2}
                  value={draft.intro ?? ""}
                  onChange={(e) => setDraft({ ...draft, intro: e.target.value })}
                />
              </label>
              <label className="form-field">
                <span>Contenu</span>
                <textarea
                  rows={20}
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  required
                  style={{ fontFamily: "monospace", fontSize: 13 }}
                />
                <small style={{ display: "block", marginTop: 4, opacity: 0.7 }}>
                  Variables : <code>{"{{legalName}}"}</code>, <code>{"{{address}}"}</code>,{" "}
                  <code>{"{{contactEmail}}"}</code>, <code>{"{{contactPhone}}"}</code>. Séparez les
                  paragraphes par une ligne vide. <code>##</code> en début de ligne = sous-titre.
                </small>
              </label>
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={draft.enabled !== false}
                  onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
                />
                <span>Page publique</span>
              </label>
              {feedback ? <p className="form-feedback">{feedback}</p> : null}
              <div className="form-actions">
                <button type="submit" className="cta-primary" disabled={saving}>
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
                <a
                  href={`/pages/${draft.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cta-secondary"
                >
                  Voir la page publique →
                </a>
              </div>
              {draft.updatedAt ? (
                <p className="admin-page__hint">
                  Dernière mise à jour :{" "}
                  {new Date(draft.updatedAt).toLocaleString("fr-FR", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </p>
              ) : null}
            </form>
          ) : (
            <p>Sélectionnez une page à éditer.</p>
          )}
        </section>
      </div>
    </div>
  );
}
