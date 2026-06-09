import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useCustomer } from "./customerContext";
import { customerAuthHeaders } from "@/lib/customerApi";

const LOCAL_KEY = "fang-wishlist-v1";

type Ctx = {
  slugs: string[];
  loading: boolean;
  has: (slug: string) => boolean;
  toggle: (slug: string) => Promise<void>;
  add: (slug: string) => Promise<void>;
  remove: (slug: string) => Promise<void>;
};

const WishlistContext = createContext<Ctx | null>(null);

function loadLocal(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function saveLocal(slugs: string[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(slugs));
  } catch {
    /* ignore */
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { customer } = useCustomer();
  const [slugs, setSlugs] = useState<string[]>(() =>
    typeof window !== "undefined" ? loadLocal() : []
  );
  const [loading, setLoading] = useState(false);

  // Sync with backend when logged in (merge local + remote, dedup)
  useEffect(() => {
    let cancelled = false;
    if (!customer) {
      setSlugs(loadLocal());
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/store/account/wishlist", {
          headers: customerAuthHeaders(),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { wishlist: string[] };
        const local = loadLocal();
        const merged = Array.from(new Set([...(data.wishlist ?? []), ...local]));
        // Push local items that weren't on remote
        const toUpload = local.filter((s) => !(data.wishlist ?? []).includes(s));
        await Promise.allSettled(
          toUpload.map((s) =>
            fetch(`/api/store/account/wishlist/${encodeURIComponent(s)}`, {
              method: "POST",
              headers: customerAuthHeaders(),
            })
          )
        );
        if (!cancelled) {
          setSlugs(merged);
          saveLocal(merged);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customer]);

  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);

  const add = useCallback(
    async (slug: string) => {
      setSlugs((prev) => (prev.includes(slug) ? prev : [...prev, slug]));
      saveLocal([...slugs, slug]);
      if (customer) {
        try {
          await fetch(`/api/store/account/wishlist/${encodeURIComponent(slug)}`, {
            method: "POST",
            headers: customerAuthHeaders(),
          });
        } catch {
          /* silencieux */
        }
      }
    },
    [customer, slugs]
  );

  const remove = useCallback(
    async (slug: string) => {
      setSlugs((prev) => prev.filter((s) => s !== slug));
      saveLocal(slugs.filter((s) => s !== slug));
      if (customer) {
        try {
          await fetch(`/api/store/account/wishlist/${encodeURIComponent(slug)}`, {
            method: "DELETE",
            headers: customerAuthHeaders(),
          });
        } catch {
          /* silencieux */
        }
      }
    },
    [customer, slugs]
  );

  const toggle = useCallback(
    async (slug: string) => {
      if (has(slug)) await remove(slug);
      else await add(slug);
    },
    [has, add, remove]
  );

  return (
    <WishlistContext.Provider value={{ slugs, loading, has, toggle, add, remove }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    return {
      slugs: [],
      loading: false,
      has: () => false,
      toggle: async () => {},
      add: async () => {},
      remove: async () => {},
    };
  }
  return ctx;
}
