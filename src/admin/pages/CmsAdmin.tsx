import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adminApi, type CmsField, type CmsSection, type CmsState } from "../api";
import { useAdmin } from "../AdminContext";

type DraftValues = Record<string, Record<string, unknown>>;
type DirtyState = Record<string, boolean>;
type DeviceMode = "desktop" | "mobile";

export function CmsAdmin() {
  const { setToast } = useAdmin();
  const [state, setState] = useState<CmsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSectionId, setActiveSectionId] = useState<string>("home.hero");
  const [draft, setDraft] = useState<DraftValues>({});
  const [dirty, setDirty] = useState<DirtyState>({});
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [previewBust, setPreviewBust] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.fetchCms();
      setState(data);
      setDraft(data.draft ?? {});
      setDirty({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    // Token de preview pour l'iframe
    adminApi
      .createCmsPreviewToken()
      .then(({ token }) => setPreviewToken(token))
      .catch(() => undefined);
  }, [refresh]);

  const activeSection = useMemo<CmsSection | null>(() => {
    if (!state) return null;
    return state.schema.sections.find((s) => s.id === activeSectionId) ?? state.schema.sections[0] ?? null;
  }, [state, activeSectionId]);

  /** Auto-save un champ après 700ms d'inactivité, puis rafraîchit l'iframe preview */
  const scheduleSave = useCallback(
    (sectionId: string) => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(async () => {
        const sectionDraft = (draftRef.current[sectionId] ?? {}) as Record<string, unknown>;
        setSaving(true);
        try {
          await adminApi.patchCmsSection(sectionId, sectionDraft);
          setDirty((d) => ({ ...d, [sectionId]: false }));
          // Rafraîchir l'iframe de preview
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage("cms:refresh", "*");
          }
          setPreviewBust((n) => n + 1);
          // Met à jour le compteur de modifs non publiées en arrière-plan
          adminApi.fetchCms().then(setState).catch(() => undefined);
        } catch (e) {
          setToast(e instanceof Error ? e.message : "Erreur d'enregistrement");
        } finally {
          setSaving(false);
        }
      }, 700);
    },
    [setToast]
  );

  // Pour éviter les closures stale dans le timer
  const draftRef = useRef<DraftValues>(draft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const updateField = (sectionId: string, fieldId: string, value: unknown) => {
    setDraft((d) => ({
      ...d,
      [sectionId]: { ...(d[sectionId] ?? {}), [fieldId]: value },
    }));
    setDirty((d) => ({ ...d, [sectionId]: true }));
    scheduleSave(sectionId);
  };

  const publish = async () => {
    setPublishing(true);
    try {
      await adminApi.publishCms();
      setToast("✓ Contenu publié — visible publiquement");
      await refresh();
      setPreviewBust((n) => n + 1);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Erreur de publication");
    } finally {
      setPublishing(false);
    }
  };

  const revert = async () => {
    if (!window.confirm("Annuler toutes les modifications non publiées ?")) return;
    try {
      await adminApi.revertCmsDraft();
      setToast("Brouillon restauré depuis la version publiée");
      await refresh();
      setPreviewBust((n) => n + 1);
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage("cms:refresh", "*");
      }
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Erreur");
    }
  };

  const previewUrl = useMemo(() => {
    if (!previewToken) return "";
    // L'iframe affiche la page d'accueil avec le token de preview ; bust force le reload
    return `/?cmsPreview=${encodeURIComponent(previewToken)}&_=${previewBust}`;
  }, [previewToken, previewBust]);

  const hasChanges = state?.hasUnpublishedChanges ?? false;
  const changesCount = state?.sectionsWithChanges.length ?? 0;

  if (loading || !state || !activeSection) {
    return (
      <section className="admin-page">
        <p>Chargement du contenu…</p>
      </section>
    );
  }

  return (
    <section className="cms-admin">
      <header className="cms-admin__head">
        <div>
          <p className="admin-eyebrow">CMS éditorial</p>
          <h1>Contenu des pages</h1>
          <p className="admin-page__lede">
            Modifiez les textes du site. Les changements sont enregistrés automatiquement en brouillon.
            Publiez pour les rendre visibles.
          </p>
        </div>
        <div className="cms-admin__actions">
          {hasChanges ? (
            <span className="cms-admin__pill cms-admin__pill--draft">
              {changesCount} section{changesCount > 1 ? "s" : ""} non publiée{changesCount > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="cms-admin__pill cms-admin__pill--clean">Tout publié</span>
          )}
          <button type="button" className="admin-link" onClick={revert} disabled={!hasChanges}>
            Restaurer
          </button>
          <button
            type="button"
            className="admin-cta"
            onClick={publish}
            disabled={!hasChanges || publishing}
          >
            {publishing ? "Publication…" : "Publier"}
          </button>
        </div>
      </header>

      <div className="cms-admin__layout">
        <aside className="cms-admin__sidebar">
          <p className="cms-admin__sidebar-title">Sections</p>
          <ul className="cms-admin__nav">
            {state.schema.sections.map((s) => {
              const isActive = s.id === activeSection.id;
              const isDirty = dirty[s.id] || (state.sectionsWithChanges ?? []).includes(s.id);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    className={[
                      "cms-admin__nav-btn",
                      isActive ? "is-active" : "",
                      isDirty ? "is-dirty" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setActiveSectionId(s.id)}
                  >
                    <span className="cms-admin__nav-icon" aria-hidden>
                      {s.icon}
                    </span>
                    <span className="cms-admin__nav-label">{s.label}</span>
                    {isDirty ? <span className="cms-admin__nav-dot" aria-label="Modifié" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="cms-admin__editor">
          <div className="cms-admin__editor-head">
            <div>
              <p className="admin-eyebrow">{activeSection.icon} Édition</p>
              <h2>{activeSection.label}</h2>
              <p className="cms-admin__editor-lede">{activeSection.lede}</p>
            </div>
            {saving ? <span className="cms-admin__saving">Enregistrement…</span> : null}
          </div>

          <form
            className="cms-admin__form"
            onSubmit={(e) => e.preventDefault()}
            aria-label="Édition de section"
          >
            {activeSection.fields.map((field) => (
              <FieldEditor
                key={field.id}
                field={field}
                value={(draft[activeSection.id] ?? {})[field.id]}
                defaultValue={
                  (state.published[activeSection.id] ?? {})[field.id]
                }
                onChange={(v) => updateField(activeSection.id, field.id, v)}
              />
            ))}
          </form>
        </div>

        <div className="cms-admin__preview">
          <div className="cms-admin__preview-head">
            <p className="admin-eyebrow">Aperçu — brouillon en direct</p>
            <div className="cms-admin__device-toggle" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={device === "desktop"}
                className={device === "desktop" ? "is-active" : ""}
                onClick={() => setDevice("desktop")}
              >
                Bureau
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={device === "mobile"}
                className={device === "mobile" ? "is-active" : ""}
                onClick={() => setDevice("mobile")}
              >
                Mobile
              </button>
              <button
                type="button"
                className="cms-admin__device-refresh"
                onClick={() => setPreviewBust((n) => n + 1)}
                aria-label="Rafraîchir l'aperçu"
                title="Rafraîchir"
              >
                ↻
              </button>
              {previewToken ? (
                <a
                  href={`/?cmsPreview=${previewToken}`}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-link"
                >
                  Nouvel onglet ↗
                </a>
              ) : null}
            </div>
          </div>
          <div className={`cms-admin__preview-frame cms-admin__preview-frame--${device}`}>
            {previewToken ? (
              <iframe
                ref={iframeRef}
                key={previewBust}
                src={previewUrl}
                title="Aperçu du site"
                loading="lazy"
              />
            ) : (
              <div className="cms-admin__preview-loading">Initialisation de l'aperçu…</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FieldEditor({
  field,
  value,
  defaultValue,
  onChange,
}: {
  field: CmsField;
  value: unknown;
  defaultValue: unknown;
  onChange: (v: unknown) => void;
}) {
  if (field.type === "list") {
    const items = Array.isArray(value) ? (value as unknown[]).map((v) => String(v)) : [];
    return (
      <div className="cms-field">
        <div className="cms-field__head">
          <label>{field.label}</label>
          {field.hint ? <span className="cms-field__hint">{field.hint}</span> : null}
        </div>
        <div className="cms-field__list">
          {items.map((item, i) => (
            <div key={i} className="cms-field__list-row">
              <input
                type="text"
                value={item}
                placeholder={`${field.itemLabel ?? "Élément"} ${i + 1}`}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = e.target.value;
                  onChange(next);
                }}
              />
              <button
                type="button"
                className="admin-link cms-field__list-remove"
                onClick={() => {
                  const next = items.filter((_, idx) => idx !== i);
                  onChange(next);
                }}
                aria-label="Supprimer"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            className="cms-field__list-add"
            onClick={() => onChange([...items, ""])}
          >
            + Ajouter un {field.itemLabel?.toLowerCase() ?? "élément"}
          </button>
        </div>
      </div>
    );
  }

  const strVal = typeof value === "string" ? value : value == null ? "" : String(value);
  const defStr =
    typeof defaultValue === "string"
      ? defaultValue
      : defaultValue == null
      ? ""
      : String(defaultValue);

  return (
    <div className="cms-field">
      <div className="cms-field__head">
        <label>{field.label}</label>
        {field.hint ? <span className="cms-field__hint">{field.hint}</span> : null}
        {strVal !== defStr ? (
          <button
            type="button"
            className="admin-link cms-field__reset"
            onClick={() => onChange(defStr)}
          >
            réinitialiser
          </button>
        ) : null}
      </div>
      {field.type === "textarea" || field.type === "richtext" ? (
        <textarea
          rows={field.rows ?? 4}
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={field.type === "url" ? "url" : "text"}
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
