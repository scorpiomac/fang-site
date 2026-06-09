const KEY = "fang-recently-viewed-v1";
const MAX = 8;

export function trackProductView(slug: string) {
  try {
    const existing = getRecentlyViewed();
    const next = [slug, ...existing.filter((s) => s !== slug)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function getRecentlyViewed(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

export function clearRecentlyViewed() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
