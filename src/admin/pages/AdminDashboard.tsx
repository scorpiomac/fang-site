import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAdmin } from "../AdminContext";
import { adminApi } from "../api";
import { formatPriceXof } from "@/content/shop";

export function AdminDashboard() {
  const { bundle, loading } = useAdmin();
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    revenueXof: number;
  } | null>(null);

  useEffect(() => {
    adminApi
      .fetchStats()
      .then(({ orders }) =>
        setStats({
          total: orders.total,
          pending: orders.pending,
          revenueXof: orders.revenueXof,
        })
      )
      .catch(() => setStats(null));
  }, []);

  if (loading || !bundle) return <p className="admin-loading">Chargement…</p>;

  const chapters = bundle.catalog.chapters ?? [];
  const totalChars = chapters.reduce((acc, c) => acc + c.characters.length, 0);
  const totalImages = chapters.reduce(
    (acc, c) => acc + c.characters.reduce((s, ch) => s + ch.images.length, 0),
    0
  );
  const overrides = Object.keys(bundle.productsOverrides ?? {}).length;

  return (
    <section className="admin-page">
      <header className="admin-page__head">
        <p className="admin-eyebrow">Tableau de bord</p>
        <h1>Bonjour, atelier FANG</h1>
        <p className="admin-page__lede">
          Vous pilotez la saison <strong>{bundle.catalog.season?.title ?? "Saison 0 — Neel Fang"}</strong>.
          Tout ce que vous modifiez ici se met à jour instantanément sur le site.
        </p>
      </header>

      {stats ? (
        <div className="admin-kpis admin-kpis--small">
          <article>
            <p className="admin-kpi__value">{stats.total}</p>
            <p>Commandes totales</p>
            <Link to="/admin/commandes" className="admin-kpi__cta">
              Voir les commandes →
            </Link>
          </article>
          <article>
            <p className="admin-kpi__value">{stats.pending}</p>
            <p>En attente</p>
          </article>
          <article>
            <p className="admin-kpi__value">{formatPriceXof(stats.revenueXof)}</p>
            <p>Chiffre d&apos;affaires</p>
          </article>
        </div>
      ) : null}

      <div className="admin-kpis">
        <article>
          <p className="admin-kpi__value">{chapters.length}</p>
          <p>Collections / chapitres</p>
          <Link to="/admin/collections" className="admin-kpi__cta">
            Gérer les chapitres →
          </Link>
        </article>
        <article>
          <p className="admin-kpi__value">{totalChars}</p>
          <p>Archétypes</p>
          <Link to="/admin/collections" className="admin-kpi__cta">
            Ajouter / éditer →
          </Link>
        </article>
        <article>
          <p className="admin-kpi__value">{totalImages}</p>
          <p>Pièces / photos</p>
          <Link to="/admin/produits" className="admin-kpi__cta">
            Tarifs &amp; tailles →
          </Link>
        </article>
        <article>
          <p className="admin-kpi__value">{overrides}</p>
          <p>Produits personnalisés</p>
          <Link to="/admin/produits" className="admin-kpi__cta">
            Catalogue produits →
          </Link>
        </article>
      </div>

      <div className="admin-quick-links">
        <Link to="/admin/commandes" className="admin-quick-link">
          <strong>Commandes</strong>
          <span>Suivre les statuts, paiements et notes internes atelier.</span>
        </Link>
        <Link to="/admin/promos" className="admin-quick-link">
          <strong>Codes promo</strong>
          <span>Remises en % ou montant fixe pour le checkout.</span>
        </Link>
        <Link to="/admin/medias" className="admin-quick-link">
          <strong>Médiathèque</strong>
          <span>Détecter et nettoyer les doublons, voir les photos orphelines.</span>
        </Link>
        <Link to="/admin/contenu" className="admin-quick-link">
          <strong>Contenu site</strong>
          <span>Hero, manifeste, voix de marque, boutique.</span>
        </Link>
        <Link to="/admin/securite" className="admin-quick-link">
          <strong>Sécurité</strong>
          <span>Changer le mot de passe backoffice.</span>
        </Link>
        <Link to="/admin/utilisateurs" className="admin-quick-link">
          <strong>Utilisateurs</strong>
          <span>Comptes équipe, rôles et accès.</span>
        </Link>
      </div>

      <section className="admin-block">
        <h2>Démarrer rapidement</h2>
        <ul className="admin-quick">
          <li>
            <strong>1. Ajouter une collection</strong>
            <span>Onglet Collections → bouton « Nouveau chapitre ».</span>
          </li>
          <li>
            <strong>2. Créer un archétype</strong>
            <span>Ouvrir une collection → ajouter un archétype → glisser-déposer ses photos.</span>
          </li>
          <li>
            <strong>3. Régler son produit</strong>
            <span>Onglet Produits → choisir l&apos;archétype → prix, tailles, description.</span>
          </li>
          <li>
            <strong>4. Affiner le récit</strong>
            <span>Onglet Contenu pour ajuster le hero, le manifeste, la voix de chaque chapitre.</span>
          </li>
        </ul>
      </section>
    </section>
  );
}
