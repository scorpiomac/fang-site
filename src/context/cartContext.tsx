import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartLine } from "@/context/cartTypes";
import type { ShopProduct } from "@/content/shop";
import { getDefaultVariation, getVariationById } from "@/content/shop";

export type CartToast = { title: string; image: string };

const STORAGE_KEY = "fang-cart-v1";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadLines(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<CartLine>[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((l) => ({
      lineId: l.lineId ?? uid(),
      productId: l.productId ?? "",
      productKey: l.productKey ?? "",
      slug: l.slug ?? "",
      title: l.title ?? "",
      image: l.image ?? "",
      size: l.size ?? "",
      variationId: l.variationId ?? "default",
      variationLabel: l.variationLabel ?? "Pièce",
      priceXof: l.priceXof ?? 0,
      qty: l.qty ?? 1,
    }));
  } catch {
    return [];
  }
}

function saveLines(lines: CartLine[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    /* ignore */
  }
}

export type CartCtx = {
  lines: CartLine[];
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addItem: (
    product: ShopProduct,
    size: string,
    options?: { qty?: number; silent?: boolean; variationId?: string }
  ) => void;
  removeLine: (lineId: string) => void;
  setQty: (lineId: string, qty: number) => void;
  clearCart: () => void;
  subtotalXof: number;
  countItems: number;
  toast: CartToast | null;
  dismissToast: () => void;
};

export const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() =>
    typeof window !== "undefined" ? loadLines() : []
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<CartToast | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    saveLines(lines);
  }, [lines]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((v) => !v), []);

  const addItem = useCallback(
    (
      product: ShopProduct,
      size: string,
      options?: { qty?: number; silent?: boolean; variationId?: string }
    ) => {
      const qty = options?.qty ?? 1;
      const silent = options?.silent ?? false;
      const variation =
        getVariationById(product.variations, options?.variationId) ??
        getDefaultVariation(product.variations);

      setLines((prev) => {
        const existing = prev.find(
          (l) =>
            l.productId === product.id &&
            l.size === size &&
            l.variationId === variation.id
        );
        if (existing) {
          return prev.map((l) =>
            l.lineId === existing.lineId ? { ...l, qty: l.qty + qty } : l
          );
        }
        const lineTitle =
          product.variations.length > 1
            ? `${product.name} — ${variation.label}`
            : product.name;
        const line: CartLine = {
          lineId: uid(),
          productId: product.id,
          productKey: product.productKey,
          slug: product.slug,
          title: lineTitle,
          image: product.coverImage || product.images[0] || "",
          size,
          variationId: variation.id,
          variationLabel: variation.label,
          priceXof: variation.priceXof,
          qty,
        };
        return [...prev, line];
      });
      if (silent) {
        setToast({
          title: product.name,
          image: product.coverImage || product.images[0] || "",
        });
      } else {
        setDrawerOpen(true);
      }
    },
    []
  );

  const removeLine = useCallback((lineId: string) => {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId));
  }, []);

  const setQty = useCallback((lineId: string, qty: number) => {
    const q = Math.max(1, Math.min(99, Math.floor(qty)));
    setLines((prev) =>
      prev.map((l) => (l.lineId === lineId ? { ...l, qty: q } : l))
    );
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const subtotalXof = useMemo(
    () => lines.reduce((s, l) => s + l.priceXof * l.qty, 0),
    [lines]
  );

  const countItems = useMemo(
    () => lines.reduce((s, l) => s + l.qty, 0),
    [lines]
  );

  const value = useMemo(
    () => ({
      lines,
      drawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      addItem,
      removeLine,
      setQty,
      clearCart,
      subtotalXof,
      countItems,
      toast,
      dismissToast,
    }),
    [
      lines,
      drawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      addItem,
      removeLine,
      setQty,
      clearCart,
      subtotalXof,
      countItems,
      toast,
      dismissToast,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
