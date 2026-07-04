import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useCustomer } from "@/context/customerContext";

const NAV = [
  { to: "/compte", end: true, label: "Tableau de bord" },
  { to: "/compte/commandes", label: "Mes commandes" },
  { to: "/compte/favoris", label: "Mes favoris" },
  { to: "/compte/profil", label: "Mon profil" },
  { to: "/compte/adresses", label: "Mes adresses" },
  { to: "/compte/securite", label: "Sécurité" },
];

export function AccountLayout() {
  const { customer, logout } = useCustomer();
  const navigate = useNavigate();

  if (!customer) return null;

  return (
    <div className="account-shell shop-shell">
      <header className="account-shell__hero">
        <p className="account-shell__eyebrow">Espace client</p>
        <h1>Bonjour, {customer.name.split(" ")[0]}</h1>
        <p className="account-shell__sub">{customer.email}</p>
        <Link to="/boutique" className="account-shell__shop-link">
          Continuer mes achats →
        </Link>
      </header>

      <div className="account-shell__grid">
        <aside className="account-shell__nav">
          <nav aria-label="Menu compte">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className="account-shell__link">
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            className="account-shell__logout"
            onClick={async () => {
              await logout();
              navigate("/compte");
            }}
          >
            Déconnexion
          </button>
        </aside>

        <div className="account-shell__content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
