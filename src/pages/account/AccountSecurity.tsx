import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { customerApi } from "@/lib/customerApi";
import { useCustomer } from "@/context/customerContext";

export function AccountSecurity() {
  const { logout } = useCustomer();
  const navigate = useNavigate();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.next !== form.confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await customerApi.changePassword(form.current, form.next);
      setMessage(res.message);
      await logout();
      navigate("/compte");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="account-section">
      <header className="account-section__head">
        <h2>Sécurité</h2>
        <p>Modifiez votre mot de passe. Vous serez déconnecté après la mise à jour.</p>
      </header>

      {error ? <p className="account-page__error">{error}</p> : null}
      {message ? <p className="account-page__ok">{message}</p> : null}

      <form className="account-form account-form--wide" onSubmit={onSubmit}>
        <label>
          Mot de passe actuel
          <input
            type="password"
            required
            autoComplete="current-password"
            value={form.current}
            onChange={(e) => setForm({ ...form, current: e.target.value })}
          />
        </label>
        <label>
          Nouveau mot de passe
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.next}
            onChange={(e) => setForm({ ...form, next: e.target.value })}
          />
        </label>
        <label>
          Confirmer le nouveau mot de passe
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          />
        </label>
        <button type="submit" className="cta cta--solid" disabled={busy}>
          {busy ? "Mise à jour…" : "Changer mon mot de passe"}
        </button>
      </form>
    </section>
  );
}
