import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_PUBLIC_SETTINGS,
  fetchPublicSettings,
  type PublicSettings,
} from "@/lib/siteSettings";

type Ctx = {
  settings: PublicSettings;
  loading: boolean;
  refresh: () => Promise<void>;
};

const SiteSettingsContext = createContext<Ctx | null>(null);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PublicSettings>(DEFAULT_PUBLIC_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const s = await fetchPublicSettings();
      setSettings(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) {
    return { settings: DEFAULT_PUBLIC_SETTINGS, loading: false, refresh: async () => {} };
  }
  return ctx;
}
