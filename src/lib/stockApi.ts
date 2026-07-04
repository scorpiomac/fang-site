export type StockMap = Record<string, Record<string, Record<string, number>>>;

let cache: { stock: StockMap; fetchedAt: number } | null = null;
const TTL_MS = 30_000;

export async function fetchStock(force = false): Promise<StockMap> {
  if (!force && cache && Date.now() - cache.fetchedAt < TTL_MS) {
    return cache.stock;
  }
  try {
    const res = await fetch("/api/store/stock");
    if (!res.ok) return cache?.stock ?? {};
    const data = (await res.json()) as { stock: StockMap };
    cache = { stock: data.stock ?? {}, fetchedAt: Date.now() };
    return cache.stock;
  } catch {
    return cache?.stock ?? {};
  }
}

export function invalidateStockCache() {
  cache = null;
}

export function getStockQty(
  stock: StockMap,
  productKey: string,
  variationId: string,
  size: string
): number | null {
  const entry = stock[productKey];
  if (!entry) return null;
  const v = entry[variationId];
  if (!v || Object.keys(v).length === 0) return null;
  return Math.max(0, Number(v[size] ?? 0));
}

export function isAvailable(
  stock: StockMap,
  productKey: string,
  variationId: string,
  size: string,
  qty = 1
): boolean {
  const available = getStockQty(stock, productKey, variationId, size);
  if (available == null) return true;
  return available >= qty;
}
