import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../api";
import { useAdmin } from "../AdminContext";
import { editableCopyDefaults } from "@/content/copy";

type Group = {
  title: string;
  keys: (keyof typeof editableCopyDefaults)[];
};

const GROUPS: Group[] = [
  {
    title: "Hero (page d'accueil)",
    keys: ["heroEyebrow", "heroTitle", "heroSubtitle", "heroPrimary", "heroSecondary"],
  },
  {
    title: "Section chapitres",
    keys: ["chaptersEyebrow", "chaptersTitle", "chaptersIntro"],
  },
  {
    title: "Manifeste",
    keys: ["manifestEyebrow", "manifestLine", "manifestBody"],
  },
  {
    title: "Créateur",
    keys: ["creatorEyebrow", "creatorName", "creatorRole", "creatorQuote"],
  },
  {
    title: "Reconnaissance / JOJ",
    keys: ["recognitionEyebrow", "recognitionTitle", "recognitionBody"],
  },
  {
    title: "Marque & identité",
    keys: ["brand", "tagline", "taglineFr"],
  },
  {
    title: "Pied de page",
    keys: ["footerTagline", "newsletter", "contact", "boutique", "instagram"],
  },
  {
    title: "Boutique — boutons & messages",
    keys: [
      "addToCart",
      "checkoutDirect",
      "shopAllPieces",
      "shopFromCollection",
      "fromPrice",
      "chapterShopCta",
      "narrativeAndShop",
      "conversionTagline",
    ],
  },
];

export function SiteContentAdmin() {
  const { bundle, refresh, setToast } = useAdmin();
  const overrides = bundle?.siteOverrides?.copy ?? {};

  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const initial = useMemo(() => {
    const base: Record<string, string> = {};
    (Object.keys(editableCopyDefaults) as Array<keyof typeof editableCopyDefaults>).forEach(
      (k) => {
        const v = (overrides as Record<string, unknown>)[k as string];
        base[k as string] =
          typeof v === "string" ? v : String(editableCopyDefaults[k] ?? "");
      }
    );
    return base;
  }, [overrides]);

  useEffect(() => {
    setValues(initial);
  }, [initial]);

  const onChange = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const onSave = async () => {
    setSaving(true);
    try {
      const diff: Record<string, string> = {};
      Object.entries(values).forEach(([k, v]) => {
        const defaultValue = String(
          editableCopyDefaults[k as keyof typeof editableCopyDefaults] ?? ""
        );
        if (v !== defaultValue) diff[k] = v;
      });
      await adminApi.setSiteCopy(diff);
      await refresh();
      setToast("Contenu enregistré");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const resetField = (key: string) => {
    const defaultValue = String(
      editableCopyDefaults[key as keyof typeof editableCopyDefaults] ?? ""
    );
    setValues((prev) => ({ ...prev, [key]: defaultValue }));
  };

  return (
    <section className="admin-page">
      <header className="admin-page__head admin-page__head--row">
        <div>
          <p className="admin-eyebrow">Contenu</p>
          <h1>Voix de la marque</h1>
          <p className="admin-page__lede">
            Modifiez les textes affichés sur tout le site. Laissez vide ou cliquez sur
            « rétablir » pour revenir au texte par défaut.
          </p>
        </div>
        <button
          type="button"
          className="admin-cta"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </header>

      {GROUPS.map((g) => (
        <section key={g.title} className="admin-block">
          <h2>{g.title}</h2>
          <div className="admin-form admin-form--two">
            {g.keys.map((key) => {
              const longText =
                key === "heroSubtitle" ||
                key === "manifestBody" ||
                key === "chaptersIntro" ||
                key === "recognitionBody" ||
                key === "conversionTagline";
              const k = key as string;
              return (
                <label key={k}>
                  <span>
                    {k}
                    <button
                      type="button"
                      className="admin-link"
                      onClick={() => resetField(k)}
                    >
                      rétablir
                    </button>
                  </span>
                  {longText ? (
                    <textarea
                      rows={3}
                      value={values[k] ?? ""}
                      onChange={(e) => onChange(k, e.target.value)}
                    />
                  ) : (
                    <input
                      value={values[k] ?? ""}
                      onChange={(e) => onChange(k, e.target.value)}
                    />
                  )}
                </label>
              );
            })}
          </div>
        </section>
      ))}
    </section>
  );
}
