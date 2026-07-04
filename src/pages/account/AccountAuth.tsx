import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCustomer } from "@/context/customerContext";
import { trackGuestOrder } from "@/lib/customerApi";
import { OrderCard } from "@/components/account/OrderCard";
import type { CustomerOrder } from "@/lib/customerApi";

type AuthTab = "login" | "register" | "track" | "forgot";

export function AccountAuth() {
  const { login, register } = useCustomer();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") ?? "/compte";

  const [tab, setTab] = useState<AuthTab>(
    params.get("inscription") === "1" ? "register" : "login"
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    phone: "",
    city: "",
    country: "Sénégal",
  });
  const [trackForm, setTrackForm] = useState({ orderId: "", email: "" });
  const [trackedOrder, setTrackedOrder] = useState<CustomerOrder | null>(null);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const onForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/store/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Erreur");
      }
      setForgotSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const goAfterAuth = () => navigate(redirect, { replace: true });

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(loginForm.email, loginForm.password);
      goAfterAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await register({
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        phone: registerForm.phone,
        city: registerForm.city,
        country: registerForm.country,
      });
      goAfterAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const onTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTrackedOrder(null);
    setBusy(true);
    try {
      const { order } = await trackGuestOrder(trackForm.orderId, trackForm.email);
      setTrackedOrder(order);
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
        <h1>Mon compte</h1>
        <p>Suivez vos commandes, gérez vos coordonnées et commandez plus vite.</p>
        <Link to="/boutique" className="account-auth__back">
          ← Retour boutique
        </Link>
      </header>

      <div className="account-auth__grid">
        <section className="account-auth__panel">
          <div className="account-tabs">
            {(
              [
                ["login", "Connexion"],
                ["register", "Créer un compte"],
                ["track", "Suivre une commande"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`account-tab${tab === id ? " is-active" : ""}`}
                onClick={() => {
                  setTab(id);
                  setError(null);
                  setTrackedOrder(null);
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {error ? <p className="account-page__error">{error}</p> : null}

          {tab === "login" ? (
            <form className="account-form" onSubmit={onLogin}>
              <label>
                E-mail
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                />
              </label>
              <label>
                Mot de passe
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  minLength={8}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
              </label>
              <button type="submit" className="cta cta--solid" disabled={busy}>
                {busy ? "Connexion…" : "Se connecter"}
              </button>
              <button
                type="button"
                className="account-form__link"
                onClick={() => {
                  setTab("forgot");
                  setError(null);
                  setForgotEmail(loginForm.email);
                }}
              >
                Mot de passe oublié ?
              </button>
            </form>
          ) : null}

          {tab === "forgot" ? (
            <form className="account-form" onSubmit={onForgot}>
              {forgotSent ? (
                <p className="account-form__hint">
                  Si un compte existe avec cette adresse, un lien de réinitialisation vient
                  d'être envoyé. Vérifiez votre boîte mail (et le dossier indésirables).
                </p>
              ) : (
                <p className="account-form__hint">
                  Entrez votre e-mail. Vous recevrez un lien valable 30 minutes.
                </p>
              )}
              <label>
                E-mail
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </label>
              <button type="submit" className="cta cta--solid" disabled={busy || forgotSent}>
                {busy ? "Envoi…" : forgotSent ? "Envoyé ✓" : "Envoyer le lien"}
              </button>
              <button
                type="button"
                className="account-form__link"
                onClick={() => {
                  setTab("login");
                  setForgotSent(false);
                  setError(null);
                }}
              >
                ← Retour à la connexion
              </button>
            </form>
          ) : null}

          {tab === "register" ? (
            <form className="account-form" onSubmit={onRegister}>
              <label>
                Nom complet *
                <input
                  required
                  autoComplete="name"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                />
              </label>
              <label>
                E-mail *
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                />
              </label>
              <div className="account-form__row">
                <label>
                  Mot de passe *
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  />
                </label>
                <label>
                  Confirmer *
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={registerForm.confirm}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirm: e.target.value })}
                  />
                </label>
              </div>
              <label>
                Téléphone (WhatsApp)
                <input
                  type="tel"
                  autoComplete="tel"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                />
              </label>
              <label>
                Ville
                <input
                  value={registerForm.city}
                  onChange={(e) => setRegisterForm({ ...registerForm, city: e.target.value })}
                />
              </label>
              <label>
                Pays
                <input
                  value={registerForm.country}
                  onChange={(e) => setRegisterForm({ ...registerForm, country: e.target.value })}
                />
              </label>
              <button type="submit" className="cta cta--solid" disabled={busy}>
                {busy ? "Création…" : "Créer mon compte"}
              </button>
            </form>
          ) : null}

          {tab === "track" ? (
            <>
              <form className="account-form" onSubmit={onTrack}>
                <p className="account-form__hint">
                  Sans compte ? Entrez votre n° de commande et l&apos;e-mail utilisé lors de
                  l&apos;achat.
                </p>
                <label>
                  N° commande
                  <input
                    required
                    placeholder="FANG-20260609-0001"
                    value={trackForm.orderId}
                    onChange={(e) => setTrackForm({ ...trackForm, orderId: e.target.value })}
                  />
                </label>
                <label>
                  E-mail
                  <input
                    type="email"
                    required
                    value={trackForm.email}
                    onChange={(e) => setTrackForm({ ...trackForm, email: e.target.value })}
                  />
                </label>
                <button type="submit" className="cta cta--solid" disabled={busy}>
                  {busy ? "Recherche…" : "Suivre ma commande"}
                </button>
              </form>
              {trackedOrder ? (
                <div className="account-auth__tracked">
                  <OrderCard order={trackedOrder} detailLink={false} />
                </div>
              ) : null}
            </>
          ) : null}
        </section>

        <aside className="account-auth__aside">
          <h2>Pourquoi un compte ?</h2>
          <ul>
            <li>Suivi en temps réel de vos commandes atelier</li>
            <li>Coordonnées préremplies au checkout</li>
            <li>Historique de vos pièces FANG</li>
            <li>Relance automatique des commandes passées avec le même e-mail</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
