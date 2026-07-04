import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

export function AccountResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const [tokenInfo, setTokenInfo] = useState<{ email: string; expiresAt: string } | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError("Lien invalide.");
      return;
    }
    fetch(`/api/store/auth/reset-info?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setTokenError(body.error ?? "Lien invalide ou expiré.");
        } else {
          setTokenInfo(body);
        }
      })
      .catch(() => setTokenError("Erreur réseau"));
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/store/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Erreur");
      setDone(true);
      setTimeout(() => navigate("/compte"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main id="contenu-principal" className="account-auth shop-shell">
      <header className="account-auth__head">
        <p className="account-auth__eyebrow">Espace client FANG</p>
        <h1>Réinitialiser le mot de passe</h1>
        <Link to="/compte" className="account-auth__back">
          ← Espace client
        </Link>
      </header>

      <section className="account-auth__panel" style={{ maxWidth: 480, margin: "0 auto" }}>
        {tokenError ? (
          <p className="account-page__error">{tokenError}</p>
        ) : !tokenInfo ? (
          <p>Vérification du lien…</p>
        ) : done ? (
          <p>Mot de passe mis à jour ! Redirection…</p>
        ) : (
          <form className="account-form" onSubmit={onSubmit}>
            <p className="account-form__hint">
              Compte : <strong>{tokenInfo.email}</strong>
            </p>
            <label>
              Nouveau mot de passe
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <label>
              Confirmer
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            {error ? <p className="account-page__error">{error}</p> : null}
            <button type="submit" className="cta cta--solid" disabled={busy}>
              {busy ? "Enregistrement…" : "Enregistrer le nouveau mot de passe"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
