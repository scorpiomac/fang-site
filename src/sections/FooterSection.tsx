import { Link } from "react-router-dom";
import { copy } from "@/content/copy";

export function FooterSection() {
  return (
    <footer className="footer" id="contact">
      <div className="footer__hero">
        <p className="footer__line">{copy.tagline}</p>
        <p className="footer__line footer__line--ghost">{copy.taglineFr}</p>
        <div className="footer__hero-actions">
          <Link to="/boutique" className="cta cta--solid">
            <span>Commander une pièce</span>
            <span aria-hidden="true">→</span>
          </Link>
          <a className="cta cta--ghost" href="mailto:contact@fang.studio">
            Écrire à l'atelier
          </a>
        </div>
      </div>

      <div className="footer__grid">
        <div className="footer__block footer__block--brand">
          <p className="footer__brand">{copy.brand}</p>
          <p className="footer__tagline">{copy.footerTagline}</p>
          <a
            className="footer__ig"
            href="https://www.instagram.com/fanglamarque/"
            target="_blank"
            rel="noreferrer"
          >
            @fanglamarque
          </a>
        </div>

        <nav className="footer__block" aria-label="Boutique">
          <p className="footer__label">Boutique</p>
          <Link to="/boutique">Toutes les pièces</Link>
          <a href="/#pieces-phares">Pièces phares</a>
          <a href="/#personnages">Casting</a>
        </nav>

        <nav className="footer__block" aria-label="Maison">
          <p className="footer__label">Maison</p>
          <a href="/#philosophie">Philosophie</a>
          <a href="/#createur">Créateur</a>
          <a href="/#manifeste">Manifeste</a>
        </nav>

        <div className="footer__block">
          <p className="footer__label">{copy.newsletter}</p>
          <p className="footer__hint">Nouveautés, ouvertures de commande et rendez-vous Dakar.</p>
          <form
            className="footer__form"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <label className="sr-only" htmlFor="newsletter-email">
              Adresse e-mail
            </label>
            <input
              id="newsletter-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={copy.newsletterPlaceholder}
              className="footer__input"
            />
            <button type="submit" className="footer__submit">
              S'inscrire
            </button>
          </form>
        </div>
      </div>

      <div className="footer__legal">
        <span>© {new Date().getFullYear()} FANG — Fallou Ngom</span>
        <span className="footer__stamp hand" aria-label="Fait à Dakar">
          Fait à Dakar
        </span>
      </div>
    </footer>
  );
}
