import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  customerApi,
  getCustomerToken,
  getStoredCustomer,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  setCustomerSession,
  type Customer,
} from "@/lib/customerApi";

type CustomerState = {
  customer: Customer | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (body: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    city?: string;
    country?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<Customer, "name" | "phone" | "city" | "country">>) => Promise<void>;
};

const CustomerCtx = createContext<CustomerState | null>(null);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(() => getStoredCustomer());
  const [loading, setLoading] = useState(Boolean(getCustomerToken()));

  const refresh = useCallback(async () => {
    if (!getCustomerToken()) {
      setCustomer(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { customer: me } = await customerApi.fetchMe();
      setCustomer(me);
      setCustomerSession(getCustomerToken()!, me);
    } catch {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const c = await loginCustomer(email, password);
    setCustomer(c);
  };

  const register = async (body: Parameters<CustomerState["register"]>[0]) => {
    const c = await registerCustomer(body);
    setCustomer(c);
  };

  const logout = async () => {
    await logoutCustomer();
    setCustomer(null);
  };

  const updateProfile = async (
    patch: Partial<Pick<Customer, "name" | "phone" | "city" | "country">>
  ) => {
    const { customer: updated } = await customerApi.updateProfile(patch);
    setCustomer(updated);
    setCustomerSession(getCustomerToken()!, updated);
  };

  return (
    <CustomerCtx.Provider value={{ customer, loading, login, register, logout, refresh, updateProfile }}>
      {children}
    </CustomerCtx.Provider>
  );
}

export function useCustomer() {
  const ctx = useContext(CustomerCtx);
  if (!ctx) throw new Error("useCustomer doit être utilisé dans CustomerProvider");
  return ctx;
}
