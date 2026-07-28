import { useEffect, useMemo, useState } from "react";
import { adminApi, fileUrlFromPath, type MediaItem } from "../api";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (paths: string[]) => void;
  /** Limite la sélection à 1 image (cover, hero, etc.) */
  singleSelect?: boolean;
  /** Empreintes MD5 à exclure (déjà présentes sur l'entité) */
  excludeHashes?: string[];
  title?: string;
  helper?: string;
  confirmLabel?: string;
};

export function MediaPicker({
  open,
  onClose,
  onConfirm,
  singleSelect = false,
  excludeHashes = [],
  title = "Choisir des photos existantes",
  helper = "Les photos déjà présentes sont masquées (dédup auto).",
  confirmLabel = "Ajouter",
}: Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelected(new Set());
    adminApi
      .fetchMedia()
      .then(({ items: list }) => setItems(list))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open]);

  const excluded = useMemo(
    () => new Set(excludeHashes.filter(Boolean)),
    [excludeHashes]
  );

  const filtered = useMemo(() => {
    let list = items.filter((i) => !excluded.has(i.hash));
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
  }, [items, search, excluded]);

  if (!open) return null;

  const toggle = (path: string) => {
    setSelected((prev) => {
      if (singleSelect) return new Set([path]);
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <div
      className="admin-modal"
      onClick={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <article className="admin-modal__panel admin-modal__panel--wide">
        <header className="admin-modal__head">
          <div>
            <p className="admin-eyebrow">Médiathèque</p>
            <h2>{title}</h2>
            <p className="admin-help">{helper}</p>
          </div>
          <button
            type="button"
            className="admin-icon-btn"
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </header>

        <div className="admin-toolbar">
          <input
            className="admin-search"
            placeholder="Rechercher (fichier, archétype, chapitre)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <span className="admin-tag admin-tag--muted">
            {selected.size} sélection{selected.size > 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <p className="admin-loading">Chargement de la médiathèque…</p>
        ) : (
          <ul className="admin-media-grid admin-media-grid--picker">
            {filtered.map((item) => {
              const isSel = selected.has(item.path);
              return (
                <li
                  key={item.path}
                  className={`admin-media admin-media--pick${isSel ? " is-picked" : ""}`}
                  onClick={() => toggle(item.path)}
                >
                  <img src={fileUrlFromPath(item.path)} alt="" loading="lazy" />
                  <div className="admin-media__check" aria-hidden>
                    {isSel ? "✓" : ""}
                  </div>
                  <div className="admin-media__foot">
                    <strong title={item.filename}>{item.filename}</strong>
                    <span>
                      {item.usedBy.length > 0
                        ? `${item.usedBy[0].characterName} · ${item.usedBy[0].chapterName}`
                        : "Orphelin"}
                    </span>
                  </div>
                </li>
              );
            })}
            {filtered.length === 0 ? (
              <li className="admin-photo-grid__empty">
                Aucune image — téléversez-en depuis la page Médiathèque.
              </li>
            ) : null}
          </ul>
        )}

        <footer className="admin-modal__foot">
          <button type="button" className="admin-cta admin-cta--ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="admin-cta"
            disabled={selected.size === 0}
            onClick={() => onConfirm(Array.from(selected))}
          >
            {confirmLabel} {selected.size > 0 && !singleSelect ? `(${selected.size})` : ""}
          </button>
        </footer>
      </article>
    </div>
  );
}
