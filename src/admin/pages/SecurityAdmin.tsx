import { useState } from "react";
import { adminApi } from "../api";
import { useAdmin } from "../AdminContext";

export function SecurityAdmin() {
  const { setToast } = useAdmin();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      setToast("Les mots de passe ne correspondent pas");
      return;
    }
    if (next.length < 12) {
      setToast("Minimum 12 caractères");
      return;
    }
    setBusy(true);
    try {
      const res = await adminApi.changePassword(current, next);
      setToast(res.message ?? "Mot de passe mis à jour");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-page">
      <header className="admin-page__head">
        <p className="admin-eyebrow">Sécurité</p>
        <h1>Mot de passe atelier</h1>
        <p className="admin-page__lede">
          Changez le mot de passe du backoffice. Utilisez au moins 12 caractères — le mot de passe
          n&apos;est jamais affiché dans le code source.
        </p>
      </header>

      <form className="admin-form admin-form--narrow" onSubmit={submit}>
        <label>
          <span>Mot de passe actuel</span>
          <input
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
        </label>
        <label>
          <span>Nouveau mot de passe</span>
          <input
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
            minLength={12}
          />
        </label>
        <label>
          <span>Confirmer</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={12}
          />
        </label>
        <button type="submit" className="admin-cta" disabled={busy}>
          {busy ? "Enregistrement…" : "Mettre à jour"}
        </button>
      </form>
    </section>
  );
}
