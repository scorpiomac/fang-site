import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { CartProvider } from "@/context/cartContext";
import { ScenePhaseProvider } from "@/context/ScenePhaseProvider";
import { GrainOverlay } from "@/components/ui/GrainOverlay";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { MusicToggle } from "@/components/ui/MusicToggle";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { CartToast } from "@/components/ui/CartToast";
import { HomePage } from "@/pages/HomePage";
import { ProductPage } from "@/pages/ProductPage";
import { CollectionPage } from "@/pages/CollectionPage";
import { ChapterHubPage } from "@/pages/ChapterHubPage";
import { CharacterPage } from "@/pages/CharacterPage";
import { CustomerProvider } from "@/context/customerContext";
import { SiteSettingsProvider } from "@/context/siteSettingsContext";
import { StockProvider } from "@/context/stockContext";
import { WishlistProvider } from "@/context/wishlistContext";
import { MaintenanceGate } from "@/components/ui/MaintenanceGate";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { StaticPage } from "@/pages/StaticPage";
import { ContactPage } from "@/pages/ContactPage";
import { CmsProvider } from "@/context/CmsContext";
import { FooterSection } from "@/sections/FooterSection";
import { ScrollToTop } from "@/components/ui/ScrollToTop";

const ShopPage = lazy(() =>
  import("@/pages/ShopPage").then((m) => ({ default: m.ShopPage }))
);
const CheckoutPage = lazy(() =>
  import("@/pages/CheckoutPage").then((m) => ({ default: m.CheckoutPage }))
);
const AccountApp = lazy(() =>
  import("@/pages/account/AccountApp").then((m) => ({ default: m.AccountApp }))
);
const AdminApp = lazy(() =>
  import("@/admin/AdminApp").then((m) => ({ default: m.AdminApp }))
);

function RouteFallback() {
  return <div className="route-fallback" aria-hidden="true" />;
}

function CastLegacyRedirect() {
  const { chapterSlug, castSlug } = useParams<{ chapterSlug: string; castSlug: string }>();
  if (!chapterSlug || !castSlug) return <Navigate to="/collection" replace />;
  return <Navigate to={`/collection/${chapterSlug}/${castSlug}`} replace />;
}

function PersonnageLegacyRedirect() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/collection" replace />;
  return <Navigate to={`/collection/${slug}`} replace />;
}

function MainSite() {
  return (
    <SiteSettingsProvider>
      <CmsProvider>
      <CustomerProvider>
        <WishlistProvider>
        <StockProvider>
          <CartProvider>
            <MaintenanceGate>
              <a className="skip-link" href="#contenu-principal">
                Aller au contenu
              </a>
              <GrainOverlay />
              <SiteHeader />
              <MusicToggle />
              <CartDrawer />
              <CartToast />
              <Routes>
                <Route
                  path="/"
                  element={
                    <ScenePhaseProvider>
                      <HomePage />
                    </ScenePhaseProvider>
                  }
                />
                <Route
                  path="/boutique"
                  element={
                    <Suspense fallback={<RouteFallback />}>
                      <ShopPage />
                    </Suspense>
                  }
                />
                <Route path="/boutique/:slug" element={<ProductPage />} />
                <Route path="/collection" element={<CollectionPage />} />
                <Route path="/collection/:chapterSlug" element={<ChapterHubPage />} />
                <Route path="/collection/:chapterSlug/:characterSlug" element={<CharacterPage />} />
                <Route
                  path="/collection/:chapterSlug/casting/:castSlug"
                  element={<CastLegacyRedirect />}
                />
                <Route path="/personnages/:slug" element={<PersonnageLegacyRedirect />} />
                <Route
                  path="/commande"
                  element={
                    <Suspense fallback={<RouteFallback />}>
                      <CheckoutPage />
                    </Suspense>
                  }
                />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/pages/:slug" element={<StaticPage />} />
                <Route
                  path="/compte/*"
                  element={
                    <Suspense fallback={<RouteFallback />}>
                      <AccountApp />
                    </Suspense>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              <FooterSection />
            </MaintenanceGate>
          </CartProvider>
        </StockProvider>
        </WishlistProvider>
      </CustomerProvider>
      </CmsProvider>
    </SiteSettingsProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<RouteFallback />}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route path="/*" element={<MainSite />} />
      </Routes>
    </BrowserRouter>
  );
}
