import { useState } from "react";
import { login } from "./api";

type Props = {
  onAuthenticated: () => void;
};

export function AdminAuth({ onAuthenticated }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-auth">
      <form className="admin-auth__card" onSubmit={onSubmit}>
        <h1>Backoffice FANG</h1>
        <p>Accès réservé à l&apos;équipe atelier.</p>
        <label>
          <span>E-mail</span>
          <input
            type="email"
            autoFocus
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@fang.studio"
            required
          />
        </label>
        <label>
          <span>Mot de passe</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            minLength={12}
          />
        </label>
        {error ? <p className="admin-auth__error">{error}</p> : null}
        <button type="submit" disabled={loading || password.length < 12 || !email.includes("@")}>
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
