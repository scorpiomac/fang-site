import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main id="contenu-principal" className="not-found-page">
      <div className="not-found-page__panel">
        <p className="not-found-page__eyebrow">404</p>
        <h1 className="not-found-page__title">Cette page n'existe pas.</h1>
        <p className="not-found-page__body">
          Le lien est peut-être ancien ou la page a été déplacée. Continuez votre visite :
        </p>
        <div className="not-found-page__actions">
          <Link to="/" className="cta cta--solid">
            Accueil
          </Link>
          <Link to="/boutique" className="cta cta--ghost">
            Boutique
          </Link>
          <Link to="/archetype" className="cta cta--ghost">
            Archétype
          </Link>
        </div>
      </div>
    </main>
  );
}
