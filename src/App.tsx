import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CartProvider } from "@/context/cartContext";
import { ScenePhaseProvider } from "@/context/ScenePhaseProvider";
import { GrainOverlay } from "@/components/ui/GrainOverlay";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { MusicToggle } from "@/components/ui/MusicToggle";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { CartToast } from "@/components/ui/CartToast";
import { HomePage } from "@/pages/HomePage";
import { ShopPage } from "@/pages/ShopPage";
import { ProductPage } from "@/pages/ProductPage";
import { PersonnagePage } from "@/pages/PersonnagePage";
import { CheckoutPage } from "@/pages/CheckoutPage";

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
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
          <Route path="/boutique" element={<ShopPage />} />
          <Route path="/boutique/:slug" element={<ProductPage />} />
          <Route path="/personnages/:slug" element={<PersonnagePage />} />
          <Route path="/commande" element={<CheckoutPage />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}
