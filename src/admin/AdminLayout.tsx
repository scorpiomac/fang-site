import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { adminApi, canAccessCommerce, canManageUsers, logout } from "./api";
import { useAdmin } from "./AdminContext";

type Props = {
  children: ReactNode;
  onLogout: () => void;
  unsavedHint?: string | null;
};

export function AdminLayout({ children, onLogout, unsavedHint }: Props) {
  const { user, setToast } = useAdmin();
  const commerce = canAccessCommerce(user?.role);
  const manageUsers = canManageUsers(user?.role);

  const [pendingCount, setPendingCount] = useState(0);
  const lastCheckRef = useRef<string>(new Date().toISOString());

  useEffect(() => {
    if (!commerce) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const data = await adminApi.fetchNotifications(lastCheckRef.current);
        if (cancelled) return;
        setPendingCount(data.pending);
        if (data.newSinceLast > 0 && data.newOrders.length > 0) {
          const top = data.newOrders[0];
          setToast(
            `🛒 ${data.newSinceLast} nouvelle${data.newSinceLast > 1 ? "s" : ""} commande${data.newSinceLast > 1 ? "s" : ""} — ${top.customerName}`
          );
          if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "granted") {
              new Notification(`Nouvelle commande FANG`, {
                body: `${top.customerName} — ${top.id}`,
              });
            } else if (Notification.permission === "default") {
              void Notification.requestPermission();
            }
          }
        }
        lastCheckRef.current = data.lastCheck;
      } catch {
        /* ignore */
      }
    };

    void tick();
    const timer = window.setInterval(tick, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [commerce, setToast]);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <header className="admin-sidebar__head">
          <p className="admin-sidebar__brand">FANG</p>
          <p className="admin-sidebar__sub">Atelier — backoffice</p>
        </header>
        <nav className="admin-sidebar__nav">
          <NavLink to="/admin" end>
            Tableau de bord
          </NavLink>
          {commerce ? (
            <>
              <NavLink to="/admin/commandes">
                Commandes
                {pendingCount > 0 ? (
                  <span
                    style={{
                      marginLeft: 8,
                      background: "var(--gold, #c9a66b)",
                      color: "#0c0c0d",
                      fontSize: 11,
                      padding: "1px 7px",
                      borderRadius: 99,
                      fontWeight: 600,
                    }}
                  >
                    {pendingCount}
                  </span>
                ) : null}
              </NavLink>
              <NavLink to="/admin/clients">Clients</NavLink>
              <NavLink to="/admin/promos">Codes promo</NavLink>
            </>
          ) : null}
          <NavLink to="/admin/collections">Collections</NavLink>
          <NavLink to="/admin/produits">Produits</NavLink>
          <NavLink to="/admin/medias">Médiathèque</NavLink>
          <NavLink to="/admin/cms">CMS — pages</NavLink>
          <NavLink to="/admin/contenu">Voix de la marque</NavLink>
          {manageUsers ? <NavLink to="/admin/utilisateurs">Utilisateurs</NavLink> : null}
          {commerce ? <NavLink to="/admin/stock">Stock</NavLink> : null}
          {commerce ? <NavLink to="/admin/avis">Avis</NavLink> : null}
          {commerce ? <NavLink to="/admin/pages">Pages</NavLink> : null}
          {commerce ? <NavLink to="/admin/rapports">Rapports</NavLink> : null}
          {commerce ? <NavLink to="/admin/audit">Audit</NavLink> : null}
          {manageUsers ? <NavLink to="/admin/backups">Backups</NavLink> : null}
          {commerce ? <NavLink to="/admin/livraison">Livraison</NavLink> : null}
          {commerce ? <NavLink to="/admin/emails">E-mails</NavLink> : null}
          {commerce ? <NavLink to="/admin/parametres">Paramètres</NavLink> : null}
          <NavLink to="/admin/securite">Sécurité</NavLink>
        </nav>
        <div className="admin-sidebar__foot">
          {user ? (
            <p className="admin-sidebar__user">
              {user.name}
              <span>{user.email}</span>
            </p>
          ) : null}
          <a href="/" target="_blank" rel="noreferrer" className="admin-sidebar__preview">
            Voir le site →
          </a>
          <button
            type="button"
            className="admin-sidebar__logout"
            onClick={async () => {
              await logout();
              onLogout();
            }}
          >
            Déconnexion
          </button>
        </div>
      </aside>
      <main className="admin-main">
        {unsavedHint ? (
          <div className="admin-toast admin-toast--saved">{unsavedHint}</div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
