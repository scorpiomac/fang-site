import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminApi, fileUrlFromPath } from "../api";
import { useAdmin } from "../AdminContext";
import { MediaSlot } from "../components/MediaSlot";
import type {
  AdminCatalogCharacter,
  AdminCatalogChapter,
  ChapterLoreOverride,
} from "../api";

export function ChapterEditor() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const { bundle, refresh, setToast } = useAdmin();
  const chapter = useMemo<AdminCatalogChapter | undefined>(
    () => bundle?.catalog.chapters.find((c) => c.id === chapterId),
    [bundle, chapterId]
  );
  const lore: ChapterLoreOverride = useMemo(
    () => bundle?.siteOverrides?.chapters?.[chapterId ?? ""] ?? {},
    [bundle, chapterId]
  );

  const [name, setName] = useState(chapter?.name ?? "");
  const [folder, setFolder] = useState(chapter?.sourceFolder ?? "");
  const [meaning, setMeaning] = useState(lore.meaning ?? "");
  const [intention, setIntention] = useState(lore.intention ?? "");
  const [role, setRole] = useState(lore.role ?? "");
  const [quote, setQuote] = useState(lore.quote ?? "");
  const [body, setBody] = useState(lore.body ?? "");
  const [palette, setPalette] = useState<string[]>(
    lore.palette ?? ["#3a261a", "#7d5c3a", "#c4b6a3"]
  );
  const [coverImage, setCoverImage] = useState<string | null>(lore.coverImage ?? null);
  const [posterImage, setPosterImage] = useState<string | null>(lore.posterImage ?? null);
  const [creatingChar, setCreatingChar] = useState(false);
  const [charName, setCharName] = useState("");
  const [dragSlug, setDragSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!chapter) return;
    setName(chapter.name);
    setFolder(chapter.sourceFolder ?? "");
    setMeaning(lore.meaning ?? "");
    setIntention(lore.intention ?? "");
    setRole(lore.role ?? "");
    setQuote(lore.quote ?? "");
    setBody(lore.body ?? "");
    setPalette(lore.palette ?? ["#3a261a", "#7d5c3a", "#c4b6a3"]);
    setCoverImage(lore.coverImage ?? null);
    setPosterImage(lore.posterImage ?? null);
  }, [chapter, lore]);

  if (!bundle) return <p className="admin-loading">Chargement…</p>;
  if (!chapter) {
    return (
      <section className="admin-page">
        <p>Chapitre introuvable.</p>
        <Link to="/admin/collections" className="admin-cta admin-cta--small">
          Retour
        </Link>
      </section>
    );
  }

  const saveMeta = async () => {
    try {
      await adminApi.patchChapter(chapter.id, { name, sourceFolder: folder });
      await adminApi.patchChapterLore(chapter.id, {
        meaning,
        intention,
        role,
        quote,
        body,
        palette,
        coverImage: coverImage ?? undefined,
        posterImage: posterImage ?? undefined,
      });
      await refresh();
      setToast("Chapitre enregistré");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur d'enregistrement");
    }
  };

  const createChar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!charName.trim()) return;
    try {
      await adminApi.createCharacter(chapter.id, charName.trim());
      setCharName("");
      setCreatingChar(false);
      await refresh();
      setToast("Archétype ajouté");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur de création");
    }
  };

  const deleteChar = async (ch: AdminCatalogCharacter) => {
    if (!confirm(`Supprimer « ${ch.name} » et toutes ses photos ?`)) return;
    try {
      await adminApi.deleteCharacter(chapter.id, ch.slug);
      await refresh();
      setToast("Archétype supprimé");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur de suppression");
    }
  };

  const reorderChars = async (overSlug: string) => {
    if (!dragSlug || dragSlug === overSlug) {
      setDragSlug(null);
      return;
    }
    const slugs = chapter.characters.map((c) => c.slug);
    const from = slugs.indexOf(dragSlug);
    const to = slugs.indexOf(overSlug);
    if (from === -1 || to === -1) return;
    const next = [...slugs];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDragSlug(null);
    try {
      await adminApi.reorderCharacters(chapter.id, next);
      await refresh();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur d'ordre");
    }
  };

  return (
    <section className="admin-page">
      <header className="admin-page__head admin-page__head--row">
        <div>
          <p className="admin-eyebrow">
            <Link to="/admin/collections">Collections</Link> / Chapitre
          </p>
          <h1>{chapter.name}</h1>
          <p className="admin-page__lede">
            Récit, identité visuelle et archétypes du chapitre {chapter.index}.
          </p>
        </div>
        <div className="admin-page__actions">
          <button
            type="button"
            className="admin-cta admin-cta--ghost"
            onClick={() => navigate("/admin/collections")}
          >
            ← Retour
          </button>
          <button type="button" className="admin-cta" onClick={saveMeta}>
            Enregistrer
          </button>
        </div>
      </header>

      <div className="admin-grid">
        <div className="admin-block">
          <h2>Identité</h2>
          <div className="admin-form">
            <label>
              <span>Nom du chapitre</span>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
              <span>Sens</span>
              <input value={meaning} onChange={(e) => setMeaning(e.target.value)} />
            </label>
            <label>
              <span>Intention</span>
              <input value={intention} onChange={(e) => setIntention(e.target.value)} />
            </label>
            <label>
              <span>Rôle de l&apos;archétype</span>
              <input value={role} onChange={(e) => setRole(e.target.value)} />
            </label>
            <label>
              <span>Citation / réplique</span>
              <input value={quote} onChange={(e) => setQuote(e.target.value)} />
            </label>
            <label>
              <span>Récit (paragraphe)</span>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
            </label>
            <label>
              <span>Dossier atelier</span>
              <input value={folder} onChange={(e) => setFolder(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="admin-block">
          <h2>Identité visuelle</h2>
          <div className="admin-slots">
            <MediaSlot
              label="Visuel de carte"
              value={coverImage}
              onChange={setCoverImage}
              hint="Cartes home + page collection"
              pickerTitle={`Visuel de carte — ${chapter.name}`}
              pickerHelper="Choisissez l'image qui représente le chapitre dans les listes."
            />
            <MediaSlot
              label="Visuel héros"
              value={posterImage}
              onChange={setPosterImage}
              hint="Bandeau page chapitre"
              pickerTitle={`Visuel héros — ${chapter.name}`}
              pickerHelper="L'image affichée en bandeau de la page du chapitre."
            />
          </div>

          <h2 style={{ marginTop: 18 }}>Palette de couleurs</h2>
          <div className="admin-palette">
            {palette.map((color, i) => (
              <label key={i} className="admin-palette__swatch">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    const next = [...palette];
                    next[i] = e.target.value;
                    setPalette(next);
                  }}
                />
                <span>{color}</span>
              </label>
            ))}
          </div>
          <p className="admin-help">
            Ces couleurs habillent les blocs narratifs du chapitre sur le site.
          </p>
        </div>
      </div>

      <section className="admin-block">
        <header className="admin-block__head">
          <div>
            <h2>Archétypes</h2>
            <p className="admin-help">
              Glissez pour réordonner. Cliquez pour gérer ses photos &amp; son produit.
            </p>
          </div>
          <button
            type="button"
            className="admin-cta admin-cta--small"
            onClick={() => setCreatingChar((v) => !v)}
          >
            {creatingChar ? "Annuler" : "Ajouter un archétype"}
          </button>
        </header>

        {creatingChar ? (
          <form className="admin-inline-form" onSubmit={createChar}>
            <label>
              <span>Nom de l&apos;archétype</span>
              <input
                value={charName}
                onChange={(e) => setCharName(e.target.value)}
                autoFocus
                placeholder="Ex. Aïssatou"
              />
            </label>
            <button className="admin-cta admin-cta--small" type="submit">
              Créer
            </button>
          </form>
        ) : null}

        <ul className="admin-cards">
          {chapter.characters.map((ch) => (
            <li
              key={ch.slug}
              className={`admin-card${dragSlug === ch.slug ? " is-dragging" : ""}`}
              draggable
              onDragStart={() => setDragSlug(ch.slug)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => reorderChars(ch.slug)}
            >
              <Link
                to={`/admin/collections/${chapter.id}/personnages/${ch.slug}`}
                className="admin-card__media"
              >
                {ch.cover ? (
                  <img src={fileUrlFromPath(ch.cover)} alt={ch.name} />
                ) : (
                  <span className="admin-card__placeholder">Pas de photo</span>
                )}
              </Link>
              <div className="admin-card__body">
                <strong>{ch.name}</strong>
                <span>
                  {ch.images.length} pièce{ch.images.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="admin-card__actions">
                <Link
                  to={`/admin/collections/${chapter.id}/personnages/${ch.slug}`}
                  className="admin-cta admin-cta--small admin-cta--ghost"
                >
                  Éditer
                </Link>
                <button
                  type="button"
                  className="admin-icon-btn admin-icon-btn--danger"
                  onClick={() => deleteChar(ch)}
                  aria-label="Supprimer"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
