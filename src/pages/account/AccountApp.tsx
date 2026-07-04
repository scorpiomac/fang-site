import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useCustomer } from "@/context/customerContext";
import { AccountAuth } from "./AccountAuth";
import { AccountLayout } from "./AccountLayout";
import { AccountOverview } from "./AccountOverview";
import { AccountOrders } from "./AccountOrders";
import { AccountOrderDetail } from "./AccountOrderDetail";
import { AccountProfile } from "./AccountProfile";
import { AccountSecurity } from "./AccountSecurity";
import { AccountResetPassword } from "./AccountResetPassword";
import { AccountAddresses } from "./AccountAddresses";
import { AccountWishlist } from "./AccountWishlist";

export function AccountApp() {
  const { customer, loading } = useCustomer();
  const location = useLocation();

  // Routes accessibles sans authentification
  if (location.pathname.endsWith("/reinitialiser") || location.pathname.includes("/reinitialiser?")) {
    return (
      <Routes>
        <Route path="reinitialiser" element={<AccountResetPassword />} />
      </Routes>
    );
  }

  if (loading) {
    return (
      <main id="contenu-principal" className="account-loading-page shop-shell">
        <p>Chargement de votre espace…</p>
      </main>
    );
  }

  if (!customer) {
    return (
      <Routes>
        <Route path="reinitialiser" element={<AccountResetPassword />} />
        <Route path="*" element={<AccountAuth />} />
      </Routes>
    );
  }

  return (
    <main id="contenu-principal">
      <Routes>
        <Route element={<AccountLayout />}>
          <Route index element={<AccountOverview />} />
          <Route path="commandes" element={<AccountOrders />} />
          <Route path="commandes/:orderId" element={<AccountOrderDetail />} />
          <Route path="profil" element={<AccountProfile />} />
          <Route path="adresses" element={<AccountAddresses />} />
          <Route path="favoris" element={<AccountWishlist />} />
          <Route path="securite" element={<AccountSecurity />} />
          <Route path="reinitialiser" element={<Navigate to="/compte/securite" replace />} />
          <Route path="*" element={<Navigate to="/compte" replace />} />
        </Route>
      </Routes>
    </main>
  );
}
