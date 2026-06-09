import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CmsContent = Record<string, Record<string, unknown>>;

type CmsContextValue = {
  content: CmsContent;
  mode: "published" | "draft";
  loading: boolean;
  refresh: () => Promise<void>;
};

const CmsContext = createContext<CmsContextValue>({
  content: {},
  mode: "published",
  loading: false,
  refresh: async () => {},
});

function readPreviewToken(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("cmsPreview");
}

export function CmsProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<CmsContent>({});
  const [mode, setMode] = useState<"published" | "draft">("published");
  const [loading, setLoading] = useState(true);

  const previewToken = useMemo(() => readPreviewToken(), []);

  const fetchCms = async () => {
    try {
      setLoading(true);
      const url = previewToken
        ? `/api/store/cms?preview=${encodeURIComponent(previewToken)}`
        : `/api/store/cms`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("cms_fetch_failed");
      const json = await res.json();
      setContent(json.content ?? {});
      setMode(json.mode ?? "published");
    } catch {
      setContent({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCms();
    // En mode preview, rafraîchir toutes les 3s pour refléter les modifs en direct
    if (previewToken) {
      const id = window.setInterval(fetchCms, 3000);
      return () => window.clearInterval(id);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewToken]);

  // Écoute postMessage("cms:refresh") émis par l'admin → permet refresh manuel iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e?.data === "cms:refresh") fetchCms();
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ content, mode, loading, refresh: fetchCms }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [content, mode, loading]
  );

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
}

export function useCms() {
  return useContext(CmsContext);
}

/**
 * Récupère une valeur texte du CMS.
 * `path` au format "section.field" — ex. "home.hero.title".
 * `fallback` est retourné si la valeur n'est pas définie ou vide.
 */
export function useCmsText(path: string, fallback: string): string {
  const { content } = useCms();
  const value = readPath(content, path);
  if (typeof value === "string" && value.trim() !== "") return value;
  return fallback;
}

/**
 * Récupère une liste de chaînes (ex. fragments du récit).
 */
export function useCmsList(path: string, fallback: readonly string[]): readonly string[] {
  const { content } = useCms();
  const value = readPath(content, path);
  if (Array.isArray(value)) {
    const cleaned = value
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter((v) => v.length > 0);
    if (cleaned.length > 0) return cleaned;
  }
  return fallback;
}

function readPath(content: CmsContent, path: string): unknown {
  // path = "home.hero.title" → sectionId = "home.hero", field = "title"
  const lastDot = path.lastIndexOf(".");
  if (lastDot === -1) return undefined;
  const sectionId = path.slice(0, lastDot);
  const field = path.slice(lastDot + 1);
  const section = content[sectionId];
  if (!section) return undefined;
  return (section as Record<string, unknown>)[field];
}

export function isCmsPreviewMode(): boolean {
  return Boolean(readPreviewToken());
}
