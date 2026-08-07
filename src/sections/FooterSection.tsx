import { useState } from "react";
import { Link } from "react-router-dom";
import { copy } from "@/content/copy";
import { useSiteSettings } from "@/context/siteSettingsContext";
import { useCmsText } from "@/context/CmsContext";

export function FooterSection() {
  const { settings } = useSiteSettings();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const footerTagline = useCmsText("brand.footerTagline", copy.footerTagline);

  const onSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newsletterEmail.trim();
    if (!email) return;
    try {
      await fetch("/api/store/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubscribed(true);
      setNewsletterEmail("");
    } catch {
      /* silencieux */
    }
  };

  const instagramUrl = settings.social.instagram;
  const instagramHandle = instagramUrl
    ? `@${instagramUrl.replace(/\/$/, "").split("/").pop()}`
    : "@fanglamarque";

  return (
    <footer className="footer" id="contact">
      <div className="footer__grid">
        <div className="footer__block footer__block--brand">
          <p className="footer__brand">{settings.brand.name}</p>
          <p className="footer__tagline">{footerTagline}</p>
          <a
            className="footer__ig"
            href={instagramUrl || "https://www.instagram.com/fanglamarque/"}
            target="_blank"
            rel="noreferrer"
          >
            {instagramHandle}
          </a>
        </div>

        <nav className="footer__block" aria-label="Boutique">
          <p className="footer__label">Boutique</p>
          <Link to="/boutique">Toutes les pièces</Link>
          <a href="/#collections">Chapitres</a>
          <Link to="/archetype">Archétype</Link>
        </nav>

        <nav className="footer__block" aria-label="Maison">
          <p className="footer__label">Maison</p>
          <Link to="/pages/about">À propos</Link>
          <Link to="/pages/faq">FAQ</Link>
          <Link to="/pages/guide-tailles">Guide des tailles</Link>
          <Link to="/contact">Contact</Link>
        </nav>

        <nav className="footer__block" aria-label="Légal">
          <p className="footer__label">Légal</p>
          <Link to="/pages/cgv">CGV</Link>
          <Link to="/pages/confidentialite">Confidentialité</Link>
          <Link to="/pages/mentions-legales">Mentions légales</Link>
          <Link to="/pages/retours">Retours & échanges</Link>
        </nav>

        <div className="footer__block">
          <p className="footer__label">{copy.newsletter}</p>
          <p className="footer__hint">Nouveautés, ouvertures de commande et rendez-vous Dakar.</p>
          <form className="footer__form" onSubmit={onSubscribe}>
            <label className="sr-only" htmlFor="newsletter-email">
              Adresse e-mail
            </label>
            <input
              id="newsletter-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={newsletterEmail}
              placeholder={copy.newsletterPlaceholder}
              className="footer__input"
              onChange={(e) => setNewsletterEmail(e.target.value)}
            />
            <button type="submit" className="footer__submit">
              {subscribed ? "Merci ✓" : "S'inscrire"}
            </button>
          </form>
        </div>
      </div>

      <div className="footer__legal">
        <span>
          © {new Date().getFullYear()}{" "}
          {settings.brand.legalName?.includes(settings.brand.name)
            ? settings.brand.legalName
            : `${settings.brand.name} — Fallou Ngom`}
        </span>
        <span className="footer__stamp hand" aria-label="Fait à Dakar">
          Fait à {settings.brand.address?.split(",")[0]?.trim() || "Dakar"}
        </span>
      </div>
    </footer>
  );
}
