import type { ReactNode } from "react";
import { useSiteSettings } from "@/context/siteSettingsContext";

export function MaintenanceGate({ children }: { children: ReactNode }) {
  const { settings, loading } = useSiteSettings();
  if (loading) return <>{children}</>;
  if (!settings.maintenance.enabled) return <>{children}</>;

  return (
    <main className="maintenance-page" id="contenu-principal">
      <div className="maintenance-page__panel">
        <p className="maintenance-page__eyebrow">{settings.brand.name}</p>
        <h1 className="maintenance-page__title">Site en maintenance</h1>
        <p className="maintenance-page__message">{settings.maintenance.message}</p>
        <p className="maintenance-page__contact">
          Pour toute urgence :{" "}
          <a href={`mailto:${settings.contact.email}`}>{settings.contact.email}</a>
        </p>
      </div>
    </main>
  );
}
