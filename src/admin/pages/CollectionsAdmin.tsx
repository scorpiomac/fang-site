import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminApi, fileUrlFromPath } from "../api";
import { useAdmin } from "../AdminContext";
import type { AdminCatalogChapter } from "../api";

export function CollectionsAdmin() {
  const { bundle, refresh, setToast } = useAdmin();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const navigate = useNavigate();
  const chapters = useMemo(() => bundle?.catalog.chapters ?? [], [bundle]);

  if (!bundle) return <p className="admin-loading">Chargement…</p>;

  const onDragStart = (id: string) => setDragId(id);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = async (overId: string) => {
    if (!dragId || dragId === overId) {
      setDragId(null);
      return;
    }
    const ids = chapters.map((c) => c.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(overId);
    if (from === -1 || to === -1) return;
    const next = [...ids];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDragId(null);
    try {
      await adminApi.reorderChapters(next);
      await refresh();
      setToast("Ordre des collections mis à jour");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur de réordonnancement");
    }
  };

  const createChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const { chapter } = await adminApi.createChapter(newName.trim());
      setNewName("");
      setCreating(false);
      await refresh();
      setToast(`Chapitre « ${chapter.name} » créé`);
      navigate(`/admin/collections/${chapter.id}`);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur de création");
    }
  };

  const deleteChapter = async (chapter: AdminCatalogChapter) => {
    if (!confirm(`Supprimer le chapitre « ${chapter.name} » et toutes ses images ?`)) return;
    try {
      await adminApi.deleteChapter(chapter.id);
      await refresh();
      setToast(`Chapitre « ${chapter.name} » supprimé`);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur de suppression");
    }
  };

  return (
    <section className="admin-page">
      <header className="admin-page__head admin-page__head--row">
        <div>
          <p className="admin-eyebrow">Collections</p>
          <h1>Chapitres &amp; archétypes</h1>
          <p className="admin-page__lede">
            Glissez les chapitres pour modifier l&apos;ordre du site. Cliquez sur un chapitre
            pour gérer son récit et ses archétypes.
          </p>
        </div>
        <button
          type="button"
          className="admin-cta"
          onClick={() => setCreating((v) => !v)}
        >
          {creating ? "Annuler" : "Nouveau chapitre"}
        </button>
      </header>

      {creating ? (
        <form className="admin-inline-form" onSubmit={createChapter}>
          <label>
            <span>Nom du chapitre</span>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex. Lumière du matin"
              autoFocus
            />
          </label>
          <button type="submit" className="admin-cta admin-cta--small">
            Créer
          </button>
        </form>
      ) : null}

      <ul className="admin-chapter-list">
        {chapters.map((c) => (
          <li
            key={c.id}
            className={`admin-chapter-row${dragId === c.id ? " is-dragging" : ""}`}
            draggable
            onDragStart={() => onDragStart(c.id)}
            onDragOver={onDragOver}
            onDrop={() => onDrop(c.id)}
          >
            <span className="admin-chapter-row__handle" aria-hidden>⋮⋮</span>
            <Link to={`/admin/collections/${c.id}`} className="admin-chapter-row__main">
              <span className="admin-chapter-row__index">{c.index}</span>
              <span>
                <strong>{c.name}</strong>
                <em>{c.sourceFolder ? `📁 ${c.sourceFolder}` : "Pas de dossier source"}</em>
              </span>
            </Link>
            <div className="admin-chapter-row__previews">
              {(c.characters.flatMap((ch) => ch.images).slice(0, 4) ?? []).map((src) => (
                <img key={src} src={fileUrlFromPath(src)} alt="" />
              ))}
              {c.characters.length === 0 ? (
                <span className="admin-chapter-row__empty">Pas d&apos;archétype</span>
              ) : null}
            </div>
            <div className="admin-chapter-row__meta">
              <span>{c.characters.length} archétype{c.characters.length > 1 ? "s" : ""}</span>
              <span>
                {c.characters.reduce((s, ch) => s + ch.images.length, 0)} pièces
              </span>
            </div>
            <button
              type="button"
              className="admin-icon-btn admin-icon-btn--danger"
              onClick={(e) => {
                e.preventDefault();
                deleteChapter(c);
              }}
              aria-label="Supprimer"
              title="Supprimer ce chapitre"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
