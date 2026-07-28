import { useEffect, useMemo, useRef, useState } from "react";
import { adminApi, fileUrlFromPath, formatBytes, type MediaItem } from "../api";
import { useAdmin } from "../AdminContext";

type Filter = "all" | "used" | "orphans" | "duplicates";

export function MediaLibrary() {
  const { setToast } = useAdmin();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const { items: list } = await adminApi.fetchMedia();
      setItems(list);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const orphans = items.filter((i) => i.usedBy.length === 0).length;
    const dupGroups = new Set<string>();
    items.forEach((i) => {
      if (i.duplicates.length > 0 && i.hash) dupGroups.add(i.hash);
    });
    const duplicateCount = items.filter((i) => i.duplicates.length > 0).length;
    const weight = items.reduce((s, i) => s + i.size, 0);
    return {
      total,
      orphans,
      dupGroups: dupGroups.size,
      duplicateCount,
      weight,
    };
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (filter === "used") list = list.filter((i) => i.usedBy.length > 0);
    if (filter === "orphans") list = list.filter((i) => i.usedBy.length === 0);
    if (filter === "duplicates") list = list.filter((i) => i.duplicates.length > 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.filename.toLowerCase().includes(q) ||
          i.path.toLowerCase().includes(q) ||
          i.usedBy.some(
            (u) =>
              u.characterName.toLowerCase().includes(q) ||
              u.chapterName.toLowerCase().includes(q)
          )
      );
    }
    return list;
  }, [items, filter, search]);

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const { written, skipped } = await adminApi.uploadMedia(files);
      await refresh();
      if (skipped.length > 0) {
        setToast(
          `${written.length} ajoutées · ${skipped.length} doublon(s) ignoré(s)`
        );
      } else {
        setToast(`${written.length} média(s) ajouté(s)`);
      }
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur d'upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = async (item: MediaItem) => {
    if (item.usedBy.length > 0) {
      if (
        !confirm(
          `Cette image est utilisée par ${item.usedBy.length} archétype(s). La supprimer la retirera aussi de ces archétypes. Continuer ?`
        )
      )
        return;
      try {
        await adminApi.deleteMedia(item.path, true);
        await refresh();
        setToast("Média supprimé");
        setSelected(null);
      } catch (err) {
        setToast(err instanceof Error ? err.message : "Erreur");
      }
      return;
    }
    if (!confirm("Supprimer ce média ?")) return;
    try {
      await adminApi.deleteMedia(item.path);
      await refresh();
      setToast("Média supprimé");
      setSelected(null);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <section className="admin-page">
      <header className="admin-page__head admin-page__head--row">
        <div>
          <p className="admin-eyebrow">Médiathèque</p>
          <h1>Toutes les photos de l'atelier</h1>
          <p className="admin-page__lede">
            Chaque image est dédupliquée par empreinte (MD5). Repérez les doublons,
            voyez où une photo est utilisée, supprimez les orphelines.
          </p>
        </div>
        <label className="admin-cta">
          {uploading ? "Envoi…" : "Téléverser des photos"}
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*"
            hidden
            onChange={(e) => onUpload(e.target.files)}
          />
        </label>
      </header>

      <div className="admin-kpis admin-kpis--small">
        <article>
          <p className="admin-kpi__value">{stats.total}</p>
          <p>Médias</p>
        </article>
        <article>
          <p className="admin-kpi__value">{stats.dupGroups}</p>
          <p>Groupes de doublons</p>
        </article>
        <article>
          <p className="admin-kpi__value">{stats.orphans}</p>
          <p>Orphelins</p>
        </article>
        <article>
          <p className="admin-kpi__value">{formatBytes(stats.weight)}</p>
          <p>Poids total</p>
        </article>
      </div>

      <div className="admin-toolbar">
        <div className="admin-tabs">
          {(
            [
              { id: "all", label: `Tous (${items.length})` },
              {
                id: "used",
                label: `Utilisés (${items.filter((i) => i.usedBy.length > 0).length})`,
              },
              { id: "orphans", label: `Orphelins (${stats.orphans})` },
              {
                id: "duplicates",
                label: `Doublons (${stats.duplicateCount})`,
              },
            ] as { id: Filter; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              className={`admin-tab${filter === t.id ? " is-active" : ""}`}
              onClick={() => setFilter(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          className="admin-search"
          placeholder="Rechercher (fichier, archétype, chapitre)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? <p className="admin-loading">Analyse des médias…</p> : null}

      <ul className="admin-media-grid">
        {filtered.map((item) => (
          <li
            key={item.path}
            className={`admin-media${item.duplicates.length > 0 ? " is-duplicate" : ""}${
              item.usedBy.length === 0 ? " is-orphan" : ""
            }`}
            onClick={() => setSelected(item)}
          >
            <img src={fileUrlFromPath(item.path)} alt="" loading="lazy" />
            <div className="admin-media__tags">
              {item.duplicates.length > 0 ? (
                <span className="admin-tag admin-tag--warning">
                  ×{item.duplicates.length + 1}
                </span>
              ) : null}
              {item.usedBy.length === 0 ? (
                <span className="admin-tag admin-tag--muted">Orphelin</span>
              ) : (
                <span className="admin-tag admin-tag--accent">
                  {item.usedBy.length}×
                </span>
              )}
            </div>
            <div className="admin-media__foot">
              <strong title={item.filename}>{item.filename}</strong>
              <span>{formatBytes(item.size)}</span>
            </div>
          </li>
        ))}
        {!loading && filtered.length === 0 ? (
          <li className="admin-photo-grid__empty">Aucun média.</li>
        ) : null}
      </ul>

      {selected ? (
        <div
          className="admin-modal"
          onClick={(e) => {
            if (e.currentTarget === e.target) setSelected(null);
          }}
        >
          <article className="admin-modal__panel admin-modal__panel--wide">
            <header className="admin-modal__head">
              <h2>{selected.filename}</h2>
              <button
                type="button"
                className="admin-icon-btn"
                onClick={() => setSelected(null)}
                aria-label="Fermer"
              >
                ✕
              </button>
            </header>
            <div className="admin-modal__grid">
              <img src={fileUrlFromPath(selected.path)} alt={selected.filename} />
              <div className="admin-modal__details">
                <p className="admin-modal__path">{selected.path}</p>
                <dl className="admin-defs">
                  <div>
                    <dt>Poids</dt>
                    <dd>{formatBytes(selected.size)}</dd>
                  </div>
                  <div>
                    <dt>Empreinte</dt>
                    <dd className="admin-defs__mono">{selected.hash.slice(0, 14)}…</dd>
                  </div>
                  <div>
                    <dt>Modifié</dt>
                    <dd>{new Date(selected.modified).toLocaleString("fr-FR")}</dd>
                  </div>
                </dl>

                <h3>Utilisé par</h3>
                {selected.usedBy.length === 0 ? (
                  <p className="admin-help">
                    Aucun archétype. Vous pouvez supprimer ce média en toute sécurité.
                  </p>
                ) : (
                  <ul className="admin-usage">
                    {selected.usedBy.map((u, i) => (
                      <li key={`${u.chapterId}-${u.characterSlug}-${i}`}>
                        <strong>{u.characterName}</strong>
                        <span>{u.chapterName}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {selected.duplicates.length > 0 ? (
                  <>
                    <h3>Doublons détectés</h3>
                    <ul className="admin-usage admin-usage--mono">
                      {selected.duplicates.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                    <p className="admin-help">
                      Ces fichiers ont la même empreinte. Conservez-en un et supprimez
                      les autres pour gagner de l'espace.
                    </p>
                  </>
                ) : null}

                <div className="admin-modal__actions">
                  <button
                    type="button"
                    className="admin-cta admin-cta--ghost"
                    onClick={() => setSelected(null)}
                  >
                    Fermer
                  </button>
                  <button
                    type="button"
                    className="admin-cta admin-cta--danger"
                    onClick={() => remove(selected)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
