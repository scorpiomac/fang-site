import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminApi, fileUrlFromPath } from "../api";
import { useAdmin } from "../AdminContext";
import { MediaPicker } from "../components/MediaPicker";
import { MediaSlot } from "../components/MediaSlot";
import { VariationEditor } from "../components/VariationEditor";
import type { ProductVariation } from "@/content/productVariations";
import { pieceIdFromImageUrl } from "@/content/shop";

function pieceLabel(pieceId: string, index: number): string {
  if (pieceId === "cover") return "Cover";
  const match = pieceId.match(/produit-(\d+)/i);
  if (match) return `Pièce ${Number(match[1])}`;
  return `Pièce ${index + 1}`;
}

export function CharacterEditor() {
  const { chapterId, characterSlug } = useParams<{
    chapterId: string;
    characterSlug: string;
  }>();
  const navigate = useNavigate();
  const { bundle, refresh, setToast } = useAdmin();
  const chapter = useMemo(
    () => bundle?.catalog.chapters.find((c) => c.id === chapterId),
    [bundle, chapterId]
  );
  const character = useMemo(
    () => chapter?.characters.find((c) => c.slug === characterSlug),
    [chapter, characterSlug]
  );
  const overrideKey = `${chapterId}/${characterSlug}`;
  const productOv = bundle?.productsOverrides?.[overrideKey] ?? {};

  const [name, setName] = useState(character?.name ?? "");
  const [sourceFolder, setSourceFolder] = useState(character?.sourceFolder ?? "");
  const [coverImage, setCoverImage] = useState<string | null>(character?.coverImage ?? null);
  const [productCover, setProductCover] = useState<string | null>(productOv.coverImage ?? null);
  const [productImages, setProductImages] = useState<string[]>(productOv.images ?? []);
  const [variations, setVariations] = useState<ProductVariation[]>(productOv.variations ?? []);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [priceXof, setPriceXof] = useState<number>(productOv.priceXof ?? 125000);
  const [kind, setKind] = useState<"Silhouette" | "Ensemble" | "Pièce unique">(
    productOv.kind ?? "Silhouette"
  );
  const [material, setMaterial] = useState(productOv.material ?? "");
  const [excerpt, setExcerpt] = useState(productOv.excerpt ?? "");
  const [description, setDescription] = useState(productOv.description ?? "");
  const [sizes, setSizes] = useState<string[]>(
    productOv.sizes && productOv.sizes.length > 0 ? productOv.sizes : ["XS", "S", "M", "L", "XL"]
  );
  const [uploading, setUploading] = useState(false);
  const [dragSrc, setDragSrc] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!character) return;
    setName(character.name);
    setSourceFolder(character.sourceFolder ?? "");
    setCoverImage(character.coverImage ?? null);
  }, [character]);

  useEffect(() => {
    if (!bundle) return;
    const ov = bundle.productsOverrides?.[overrideKey] ?? {};
    setPriceXof(ov.priceXof ?? 125000);
    setKind(ov.kind ?? "Silhouette");
    setMaterial(ov.material ?? "");
    setExcerpt(ov.excerpt ?? "");
    setDescription(ov.description ?? "");
    setSizes(ov.sizes && ov.sizes.length > 0 ? ov.sizes : ["XS", "S", "M", "L", "XL"]);
    setProductCover(ov.coverImage ?? null);
    setProductImages(ov.images ?? []);
    setVariations(ov.variations ?? []);
  }, [bundle, overrideKey]);

  if (!bundle || !chapter || !character) {
    return (
      <section className="admin-page">
        <p>Archétype introuvable.</p>
        <Link to="/admin/collections" className="admin-cta admin-cta--small">
          Retour
        </Link>
      </section>
    );
  }

  const saveIdentity = async () => {
    try {
      await adminApi.patchCharacter(chapter.id, character.slug, {
        name,
        sourceFolder,
        coverImage: coverImage ?? "",
      });
      await refresh();
      setToast("Archétype enregistré");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    }
  };

  const saveProduct = async () => {
    try {
      const defaultPrice =
        variations.length > 0
          ? (variations.find((v) => v.default) ?? variations[0]).priceXof
          : Number(priceXof) || 0;
      await adminApi.setProductOverride(chapter.id, character.slug, {
        priceXof: defaultPrice,
        kind,
        material,
        excerpt,
        description,
        sizes,
        coverImage: productCover ?? undefined,
        images: productImages.length > 0 ? productImages : undefined,
        variations:
          variations.length > 0
            ? variations
                .map((v) => ({
                  ...v,
                  label: v.label.trim(),
                }))
                .filter((v) => v.label)
            : undefined,
      });
      await refresh();
      setToast("Produit mis à jour");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    }
  };

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const { uploaded, skippedDuplicates } = await adminApi.uploadImages(
        chapter.id,
        character.slug,
        files
      );
      await refresh();
      if (skippedDuplicates && skippedDuplicates.length > 0) {
        setToast(
          `${uploaded.length} ajoutée(s) · ${skippedDuplicates.length} doublon(s) ignoré(s)`
        );
      } else {
        setToast(`${uploaded.length || files.length} image(s) ajoutée(s)`);
      }
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Échec de l'upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onLinkFromLibrary = async (paths: string[]) => {
    setPickerOpen(false);
    if (paths.length === 0) return;
    try {
      const { linked, skipped } = await adminApi.linkMediaToCharacter(
        chapter.id,
        character.slug,
        paths
      );
      await refresh();
      if (skipped.length > 0) {
        setToast(`${linked.length} liée(s) · ${skipped.length} doublon(s) ignoré(s)`);
      } else {
        setToast(`${linked.length} photo(s) ajoutée(s) depuis la médiathèque`);
      }
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    }
  };

  const deleteImage = async (src: string) => {
    const filename = src.split("/").pop();
    if (!filename) return;
    if (!confirm("Supprimer cette image ?")) return;
    try {
      await adminApi.deleteImage(chapter.id, character.slug, filename);
      await refresh();
      setToast("Image supprimée");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    }
  };

  const reorderImages = async (overSrc: string) => {
    if (!dragSrc || dragSrc === overSrc) {
      setDragSrc(null);
      return;
    }
    const list = character.images.map((p) => p.split("/").pop() ?? "");
    const fromFile = dragSrc.split("/").pop() ?? "";
    const toFile = overSrc.split("/").pop() ?? "";
    const from = list.indexOf(fromFile);
    const to = list.indexOf(toFile);
    if (from === -1 || to === -1) return;
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDragSrc(null);
    try {
      await adminApi.reorderImages(chapter.id, character.slug, next);
      await refresh();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    }
  };

  const toggleSize = (s: string) => {
    setSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s].sort()));
  };

  const COMMON_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

  return (
    <section className="admin-page">
      <header className="admin-page__head admin-page__head--row">
        <div>
          <p className="admin-eyebrow">
            <Link to="/admin/collections">Collections</Link>
            {" / "}
            <Link to={`/admin/collections/${chapter.id}`}>{chapter.name}</Link>
            {" / Archétype"}
          </p>
          <h1>{character.name}</h1>
          <p className="admin-page__lede">
            {character.images.length} photo{character.images.length > 1 ? "s" : ""} ·{" "}
            {character.images.length} pièce{character.images.length > 1 ? "s" : ""} boutique ·{" "}
            <Link
              to={`/collection/${chapter.slug}/${character.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              Voir sur le site →
            </Link>
          </p>
        </div>
        <div className="admin-page__actions">
          <button
            type="button"
            className="admin-cta admin-cta--ghost"
            onClick={() => navigate(`/admin/collections/${chapter.id}`)}
          >
            ← Chapitre
          </button>
        </div>
      </header>

      <div className="admin-grid">
        <section className="admin-block">
          <header className="admin-block__head">
            <h2>Identité</h2>
            <button type="button" className="admin-cta admin-cta--small" onClick={saveIdentity}>
              Enregistrer
            </button>
          </header>
          <div className="admin-form">
            <label>
              <span>Nom affiché</span>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
              <span>Dossier source</span>
              <input value={sourceFolder} onChange={(e) => setSourceFolder(e.target.value)} />
            </label>
          </div>
          <MediaSlot
            label="Cover de l'archétype"
            value={coverImage}
            onChange={setCoverImage}
            hint="Vignette utilisée dans les listes (sinon : 1ʳᵉ photo)"
            pickerTitle={`Cover — ${character.name}`}
            pickerHelper="Choisissez le portrait à afficher comme vignette dans les listings."
          />
        </section>

        <section className="admin-block">
          <header className="admin-block__head">
            <h2>Valeurs par défaut</h2>
            <button type="button" className="admin-cta admin-cta--small" onClick={saveProduct}>
              Enregistrer
            </button>
          </header>
          <p className="admin-help">
            S&apos;appliquent à toutes les pièces de cet archétype, sauf surcharge individuelle
            ci-dessous.
          </p>
          <div className="admin-form">
            <VariationEditor
              variations={variations}
              onChange={setVariations}
              basePrice={priceXof}
              onBasePriceChange={setPriceXof}
            />
            <label>
              <span>Type</span>
              <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
                <option>Silhouette</option>
                <option>Ensemble</option>
                <option>Pièce unique</option>
              </select>
            </label>
            <label>
              <span>Matière / fabrication</span>
              <input value={material} onChange={(e) => setMaterial(e.target.value)} />
            </label>
            <label>
              <span>Accroche (1 ligne)</span>
              <input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
            </label>
            <label>
              <span>Description</span>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <div>
              <span className="admin-form__label">Tailles disponibles</span>
              <div className="admin-chips">
                {COMMON_SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`admin-chip${sizes.includes(s) ? " is-active" : ""}`}
                    onClick={() => toggleSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <MediaSlot
            label="Image principale (legacy)"
            value={productCover}
            onChange={setProductCover}
            hint="Utilisée seulement si vous surchargez manuellement les images produit"
            pickerTitle={`Image principale — ${character.name}`}
            pickerHelper="Optionnel — chaque photo atelier génère sa propre fiche boutique."
          />

          <div className="admin-slot">
            <div className="admin-slot__head">
              <span className="admin-form__label">Galerie produit groupée (legacy)</span>
              <span className="admin-slot__hint">
                {productImages.length === 0
                  ? "Non utilisé — une fiche par photo"
                  : `${productImages.length} image(s) groupée(s)`}
              </span>
            </div>
            {productImages.length > 0 ? (
              <ul className="admin-photo-grid admin-photo-grid--compact">
                {productImages.map((src) => (
                  <li key={src} className="admin-photo">
                    <img src={fileUrlFromPath(src)} alt="" />
                    <button
                      type="button"
                      className="admin-photo__remove"
                      onClick={() => setProductImages((prev) => prev.filter((x) => x !== src))}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="admin-slot__actions">
              <button
                type="button"
                className="admin-cta admin-cta--small admin-cta--ghost"
                onClick={() => setProductPickerOpen(true)}
              >
                Sélectionner les pièces
              </button>
              {productImages.length > 0 ? (
                <button
                  type="button"
                  className="admin-cta admin-cta--small admin-cta--ghost"
                  onClick={() => setProductImages([])}
                >
                  Réinitialiser (auto)
                </button>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <section className="admin-block">
        <header className="admin-block__head">
          <div>
            <h2>Photos &amp; pièces</h2>
            <p className="admin-help">
              La première image sert de couverture. Glissez pour réordonner.
            </p>
          </div>
          <div className="admin-page__actions">
            <button
              type="button"
              className="admin-cta admin-cta--small admin-cta--ghost"
              onClick={() => setPickerOpen(true)}
            >
              Depuis la médiathèque
            </button>
            <label className="admin-cta admin-cta--small">
              {uploading ? "Envoi…" : "Téléverser"}
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => onUpload(e.target.files)}
                hidden
              />
            </label>
          </div>
        </header>

        <ul className="admin-photo-grid">
          {character.images.map((src, i) => (
            <li
              key={src}
              className={`admin-photo${dragSrc === src ? " is-dragging" : ""}`}
              draggable
              onDragStart={() => setDragSrc(src)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => reorderImages(src)}
            >
              <img src={fileUrlFromPath(src)} alt="" />
              <span className="admin-photo__index">{i === 0 ? "Cover" : `#${i + 1}`}</span>
              <button
                type="button"
                className="admin-photo__remove"
                onClick={() => deleteImage(src)}
              >
                ✕
              </button>
            </li>
          ))}
          {character.images.length === 0 ? (
            <li className="admin-photo-grid__empty">
              Aucune image. Téléversez ou choisissez depuis la médiathèque.
            </li>
          ) : null}
        </ul>
      </section>

      <section className="admin-block">
        <header className="admin-block__head">
          <h2>Pièces boutique</h2>
        </header>
        <p className="admin-help">
          Chaque photo ci-dessus correspond à une fiche produit distincte. Ajoutez une{" "}
          <strong>galerie</strong> (looks / détails) sous chaque pièce pour la fiche boutique.
        </p>
        <ul className="admin-product-list">
          {character.images.map((src, i) => {
            const pieceId = pieceIdFromImageUrl(src);
            const charOv = bundle.productsOverrides?.[overrideKey] ?? {};
            const pieceOv = bundle.productsOverrides?.[`${overrideKey}/${pieceId}`] ?? {};
            const label = pieceLabel(pieceId, i);
            const shopSlug = `${chapter.slug}-${character.slug}-${pieceId}`;
            const galleryPaths =
              pieceOv.images && pieceOv.images.length > 0
                ? pieceOv.images
                : pieceOv.coverImage
                  ? [pieceOv.coverImage]
                  : [];
            return (
              <PieceRow
                key={src}
                id={`piece-${pieceId}`}
                pieceId={pieceId}
                label={label}
                image={src}
                galleryImages={galleryPaths}
                coverImage={pieceOv.coverImage ?? null}
                shopSlug={shopSlug}
                name={pieceOv.name ?? charOv.name ?? `${character.name} — ${label}`}
                priceXof={pieceOv.priceXof ?? charOv.priceXof ?? 125000}
                excerpt={pieceOv.excerpt ?? charOv.excerpt ?? ""}
                onSave={async (patch) => {
                  try {
                    await adminApi.setPieceProductOverride(
                      chapter.id,
                      character.slug,
                      pieceId,
                      patch
                    );
                    await refresh();
                    setToast(`${label} enregistrée`);
                  } catch (err) {
                    setToast(err instanceof Error ? err.message : "Erreur");
                  }
                }}
              />
            );
          })}
        </ul>
      </section>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={onLinkFromLibrary}
      />
      <MediaPicker
        open={productPickerOpen}
        onClose={() => setProductPickerOpen(false)}
        onConfirm={(paths) => {
          setProductPickerOpen(false);
          setProductImages((prev) => Array.from(new Set([...prev, ...paths])));
        }}
        title="Pièces affichées sur le produit"
        helper="Sélectionnez les photos à montrer dans la fiche produit. Laissez vide pour utiliser toutes les photos de l'archétype."
        confirmLabel="Ajouter les pièces"
      />
    </section>
  );
}

function PieceRow({
  id,
  pieceId,
  label,
  image,
  galleryImages: initialGallery,
  coverImage: initialCover,
  shopSlug,
  name: initialName,
  priceXof: initialPrice,
  excerpt: initialExcerpt,
  onSave,
}: {
  id: string;
  pieceId: string;
  label: string;
  image: string;
  galleryImages: string[];
  coverImage: string | null;
  shopSlug: string;
  name: string;
  priceXof: number;
  excerpt: string;
  onSave: (patch: {
    name: string;
    priceXof: number;
    excerpt: string;
    coverImage?: string;
    images?: string[];
  }) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [priceXof, setPriceXof] = useState(initialPrice);
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [gallery, setGallery] = useState<string[]>(initialGallery);
  const [coverImage, setCoverImage] = useState<string | null>(initialCover);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const galleryKey = initialGallery.join("|");

  useEffect(() => {
    setName(initialName);
    setPriceXof(initialPrice);
    setExcerpt(initialExcerpt);
    setGallery(initialGallery);
    setCoverImage(initialCover);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- galleryKey tracks initialGallery
  }, [initialName, initialPrice, initialExcerpt, galleryKey, initialCover, pieceId]);

  const thumbs = gallery.length > 0 ? gallery : [image];

  return (
    <li id={id} className="admin-product-row admin-product-row--gallery">
      <div className="admin-product-row__media">
        <img src={fileUrlFromPath(coverImage || thumbs[0])} alt={label} />
      </div>
      <div className="admin-product-row__main admin-form">
        <strong>{label}</strong>
        <label>
          <span>Nom boutique</span>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          <span>Prix (XOF)</span>
          <input
            type="number"
            min={0}
            value={priceXof}
            onChange={(e) => setPriceXof(Number(e.target.value) || 0)}
          />
        </label>
        <label>
          <span>Accroche</span>
          <input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
        </label>

        <div className="admin-product-row__gallery">
          <div className="admin-slot__head">
            <span className="admin-form__label">Galerie fiche produit</span>
            <span className="admin-slot__hint">
              {gallery.length > 0
                ? `${gallery.length} photo(s) sous l’image principale`
                : "1 photo (image de la pièce)"}
            </span>
          </div>
          <ul className="admin-photo-grid admin-photo-grid--compact">
            {thumbs.map((src, idx) => (
              <li key={`${src}-${idx}`} className="admin-photo">
                <img src={fileUrlFromPath(src)} alt="" />
                {idx === 0 ? <span className="admin-photo__index">Principale</span> : null}
                {gallery.length > 0 ? (
                  <button
                    type="button"
                    className="admin-photo__remove"
                    onClick={() => {
                      const next = gallery.filter((_, i) => i !== idx);
                      setGallery(next);
                      if (coverImage === src || idx === 0) {
                        setCoverImage(next[0] ?? null);
                      }
                    }}
                    aria-label="Retirer de la galerie"
                  >
                    ✕
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="admin-slot__actions">
            <button
              type="button"
              className="admin-cta admin-cta--small admin-cta--ghost"
              onClick={() => setPickerOpen(true)}
            >
              {gallery.length > 0 ? "Modifier la galerie" : "Ajouter des photos"}
            </button>
            {gallery.length > 0 ? (
              <button
                type="button"
                className="admin-cta admin-cta--small admin-cta--ghost"
                onClick={() => {
                  setGallery([]);
                  setCoverImage(null);
                }}
              >
                Réinitialiser
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <div className="admin-page__actions">
        <button
          type="button"
          className="admin-cta admin-cta--small"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await onSave({
                name,
                priceXof,
                excerpt,
                coverImage: gallery[0] ?? coverImage ?? undefined,
                images: gallery,
              });
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "…" : "Enregistrer"}
        </button>
        <a
          href={`/boutique/${shopSlug}`}
          target="_blank"
          rel="noreferrer"
          className="admin-cta admin-cta--small admin-cta--ghost"
        >
          Voir →
        </a>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={(paths) => {
          setPickerOpen(false);
          const next = Array.from(new Set([...gallery, ...paths]));
          setGallery(next);
          if (!coverImage && next[0]) setCoverImage(next[0]);
        }}
        title={`Galerie — ${label}`}
        helper="Ces photos apparaissent sous l’image principale sur la fiche boutique."
        confirmLabel="Ajouter à la galerie"
      />
    </li>
  );
}
