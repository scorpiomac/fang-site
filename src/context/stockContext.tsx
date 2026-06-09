import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  fetchStock,
  getStockQty,
  invalidateStockCache,
  type StockMap,
} from "@/lib/stockApi";

type Ctx = {
  stock: StockMap;
  loading: boolean;
  refresh: () => Promise<void>;
  qtyFor: (productKey: string, variationId: string, size: string) => number | null;
  isOut: (productKey: string, variationId: string, size: string) => boolean;
};

const StockContext = createContext<Ctx | null>(null);

export function StockProvider({ children }: { children: ReactNode }) {
  const [stock, setStock] = useState<StockMap>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      invalidateStockCache();
      const s = await fetchStock(true);
      setStock(s);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStock()
      .then((s) => setStock(s))
      .finally(() => setLoading(false));
  }, []);

  const qtyFor = useCallback(
    (productKey: string, variationId: string, size: string) =>
      getStockQty(stock, productKey, variationId, size),
    [stock]
  );

  const isOut = useCallback(
    (productKey: string, variationId: string, size: string) => {
      const q = getStockQty(stock, productKey, variationId, size);
      if (q == null) return false;
      return q <= 0;
    },
    [stock]
  );

  return (
    <StockContext.Provider value={{ stock, loading, refresh, qtyFor, isOut }}>
      {children}
    </StockContext.Provider>
  );
}

export function useStock() {
  const ctx = useContext(StockContext);
  if (!ctx) {
    return {
      stock: {} as StockMap,
      loading: false,
      refresh: async () => {},
      qtyFor: () => null,
      isOut: () => false,
    };
  }
  return ctx;
}
