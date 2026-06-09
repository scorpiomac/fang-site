import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  adminApi,
  getStoredUser,
  setStoredUser,
  type AdminBundle,
  type AdminUser,
} from "./api";

type AdminState = {
  bundle: AdminBundle | null;
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  toast: string | null;
  setToast: (msg: string | null) => void;
};

const AdminCtx = createContext<AdminState | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [bundle, setBundle] = useState<AdminBundle | null>(null);
  const [user, setUser] = useState<AdminUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToastState] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, me] = await Promise.all([adminApi.fetchBundle(), adminApi.fetchMe()]);
      setBundle(b);
      setUser(me.user);
      setStoredUser(me.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setToast = useCallback((msg: string | null) => {
    setToastState(msg);
    if (msg) setTimeout(() => setToastState(null), 2400);
  }, []);

  return (
    <AdminCtx.Provider value={{ bundle, user, loading, error, refresh, toast, setToast }}>
      {children}
    </AdminCtx.Provider>
  );
}

export function useAdmin() {
  const v = useContext(AdminCtx);
  if (!v) throw new Error("useAdmin doit être utilisé dans AdminProvider");
  return v;
}
