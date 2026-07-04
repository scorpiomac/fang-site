import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { AdminAuth } from "./AdminAuth";
import { AdminLayout } from "./AdminLayout";
import { AdminProvider, useAdmin } from "./AdminContext";
import { AdminDashboard } from "./pages/AdminDashboard";
import { CollectionsAdmin } from "./pages/CollectionsAdmin";
import { ChapterEditor } from "./pages/ChapterEditor";
import { CharacterEditor } from "./pages/CharacterEditor";
import { ProductsAdmin } from "./pages/ProductsAdmin";
import { SiteContentAdmin } from "./pages/SiteContentAdmin";
import { MediaLibrary } from "./pages/MediaLibrary";
import { OrdersAdmin } from "./pages/OrdersAdmin";
import { PromosAdmin } from "./pages/PromosAdmin";
import { SecurityAdmin } from "./pages/SecurityAdmin";
import { UsersAdmin } from "./pages/UsersAdmin";
import { CustomersAdmin } from "./pages/CustomersAdmin";
import { SettingsAdmin } from "./pages/SettingsAdmin";
import { ShippingAdmin } from "./pages/ShippingAdmin";
import { StockAdmin } from "./pages/StockAdmin";
import { MailAdmin } from "./pages/MailAdmin";
import { ReviewsAdmin } from "./pages/ReviewsAdmin";
import { PagesAdmin } from "./pages/PagesAdmin";
import { ReportsAdmin } from "./pages/ReportsAdmin";
import { AuditAdmin } from "./pages/AuditAdmin";
import { BackupsAdmin } from "./pages/BackupsAdmin";
import { CmsAdmin } from "./pages/CmsAdmin";
import { getToken } from "./api";
import "./admin.css";

function AdminBody() {
  const { toast, error, loading, refresh } = useAdmin();
  return (
    <AdminLayout onLogout={() => location.reload()} unsavedHint={toast}>
      {error ? (
        <div className="admin-error">
          <p>{error}</p>
          <button type="button" onClick={() => refresh()} className="admin-cta admin-cta--small">
            Réessayer
          </button>
        </div>
      ) : null}
      {loading && !error ? <p className="admin-loading">Chargement du catalogue…</p> : null}
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="collections" element={<CollectionsAdmin />} />
        <Route path="collections/:chapterId" element={<ChapterEditor />} />
        <Route
          path="collections/:chapterId/personnages/:characterSlug"
          element={<CharacterEditor />}
        />
        <Route path="commandes" element={<OrdersAdmin />} />
        <Route path="clients" element={<CustomersAdmin />} />
        <Route path="promos" element={<PromosAdmin />} />
        <Route path="produits" element={<ProductsAdmin />} />
        <Route path="medias" element={<MediaLibrary />} />
        <Route path="contenu" element={<SiteContentAdmin />} />
        <Route path="cms" element={<CmsAdmin />} />
        <Route path="utilisateurs" element={<UsersAdmin />} />
        <Route path="parametres" element={<SettingsAdmin />} />
        <Route path="livraison" element={<ShippingAdmin />} />
        <Route path="stock" element={<StockAdmin />} />
        <Route path="emails" element={<MailAdmin />} />
        <Route path="avis" element={<ReviewsAdmin />} />
        <Route path="pages" element={<PagesAdmin />} />
        <Route path="rapports" element={<ReportsAdmin />} />
        <Route path="audit" element={<AuditAdmin />} />
        <Route path="backups" element={<BackupsAdmin />} />
        <Route path="securite" element={<SecurityAdmin />} />
      </Routes>
    </AdminLayout>
  );
}

export function AdminApp() {
  const [authed, setAuthed] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!authed) document.title = "FANG — Connexion atelier";
    else document.title = "FANG — Backoffice";
  }, [authed]);

  if (!authed) return <AdminAuth onAuthenticated={() => setAuthed(true)} />;
  return (
    <AdminProvider>
      <AdminBody />
    </AdminProvider>
  );
}
