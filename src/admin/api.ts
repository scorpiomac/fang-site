import type { ProductVariation } from "@/content/productVariations";

const SESSION_KEY = "fang-admin-session";
const USER_KEY = "fang-admin-user";

export type AdminRole = "owner" | "admin" | "editor";

export type CmsFieldType = "text" | "textarea" | "richtext" | "list" | "image" | "url";

export type CmsField = {
  id: string;
  label: string;
  type: CmsFieldType;
  hint?: string;
  rows?: number;
  itemLabel?: string;
};

export type CmsSection = {
  id: string;
  label: string;
  icon: string;
  lede: string;
  fields: CmsField[];
};

export type CmsState = {
  schema: { sections: CmsSection[] };
  draft: Record<string, Record<string, unknown>>;
  published: Record<string, Record<string, unknown>>;
  draftUpdatedAt: string | null;
  publishedAt: string | null;
  sectionsWithChanges: string[];
  hasUnpublishedChanges: boolean;
};

export type StoreCustomer = {
  id: string;
  email: string;
  name: string;
  phone: string;
  city: string;
  country: string;
  createdAt: string;
  lastLoginAt?: string | null;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "in_production"
  | "ready"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "partial" | "paid" | "refunded";

export type AdminOrder = {
  id: string;
  number: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    city: string;
    country: string;
  };
  notes?: string;
  internalNote?: string;
  lines: {
    lineId: string;
    title: string;
    size: string;
    variationLabel: string;
    priceXof: number;
    qty: number;
    image?: string;
  }[];
  subtotalXof: number;
  discountXof: number;
  promoCode: string | null;
  totalXof: number;
};

export type PromoCode = {
  id: string;
  code: string;
  label: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotalXof?: number | null;
  maxUses?: number | null;
  usedCount: number;
  active: boolean;
  expiresAt?: string | null;
  description?: string;
  createdAt: string;
  updatedAt?: string;
};

export type AdminCatalogChapter = {
  order: number;
  id: string;
  slug: string;
  index: string;
  name: string;
  sourceFolder?: string;
  characters: AdminCatalogCharacter[];
};

export type AdminCatalogCharacter = {
  id: string;
  slug: string;
  name: string;
  sourceFolder: string;
  cover: string;
  /** Override explicite de la cover via médiathèque */
  coverImage?: string;
  images: string[];
  productCount: number;
};

export type AdminCatalog = {
  season: {
    id?: string;
    slug?: string;
    title?: string;
    subtitle?: string;
    tagline?: string;
    sourceRoot?: string;
  };
  chapters: AdminCatalogChapter[];
};

export type ChapterLoreOverride = {
  name?: string;
  meaning?: string;
  intention?: string;
  role?: string;
  quote?: string;
  body?: string;
  palette?: string[];
  /** Image utilisée dans les cartes et résumés du chapitre */
  coverImage?: string;
  /** Image héros utilisée sur la page chapitre */
  posterImage?: string;
};

export type ProductOverride = {
  name?: string;
  kind?: "Silhouette" | "Ensemble" | "Pièce unique";
  priceXof?: number;
  variations?: ProductVariation[];
  material?: string;
  excerpt?: string;
  description?: string;
  sizes?: string[];
  coverImage?: string;
  images?: string[];
};

export type AdminBundle = {
  catalog: AdminCatalog;
  productsOverrides: Record<string, ProductOverride>;
  siteOverrides: {
    chapters?: Record<string, ChapterLoreOverride>;
    copy?: Record<string, string | unknown>;
  };
};

export type MediaItem = {
  path: string;
  url: string;
  filename: string;
  size: number;
  modified: number;
  hash: string;
  duplicates: string[];
  usedBy: {
    chapterId: string;
    chapterName: string;
    characterSlug: string;
    characterName: string;
  }[];
};

export function getToken(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(SESSION_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AdminUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function canManageUsers(role?: AdminRole) {
  return role === "owner" || role === "admin";
}

export function canAccessCommerce(role?: AdminRole) {
  return role === "owner" || role === "admin";
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  isFormData = false
): Promise<T> {
  const token = getToken() ?? "";
  const headers: Record<string, string> = {
    Authorization: token ? `Bearer ${token}` : "",
    "x-session-token": token,
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (!isFormData) headers["Content-Type"] = "application/json";
  const res = await fetch(`/api/admin${path}`, { ...init, headers });
  if (res.status === 401) {
    clearToken();
    throw new Error("Session expirée — reconnectez-vous.");
  }
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json()).error ?? "";
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Erreur HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function login(email: string, password: string) {
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Identifiants incorrects.");
  }
  const { sessionToken, user } = (await res.json()) as {
    sessionToken: string;
    user: AdminUser;
  };
  setToken(sessionToken);
  setStoredUser(user);
  return user;
}

export async function logout() {
  const token = getToken();
  if (token) {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-session-token": token,
        },
      });
    } catch {
      /* ignore */
    }
  }
  clearToken();
}

export const adminApi = {
  fetchMe: () => request<{ user: AdminUser }>("/me"),
  fetchBundle: () => request<AdminBundle>("/catalog"),

  /* Chapitres */
  createChapter: (name: string, sourceFolder?: string) =>
    request<{ chapter: AdminCatalogChapter }>("/chapters", {
      method: "POST",
      body: JSON.stringify({ name, sourceFolder }),
    }),
  patchChapter: (id: string, patch: Partial<AdminCatalogChapter>) =>
    request<{ chapter: AdminCatalogChapter }>(`/chapters/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteChapter: (id: string) =>
    request<{ ok: boolean }>(`/chapters/${id}`, { method: "DELETE" }),
  reorderChapters: (order: string[]) =>
    request<{ chapters: AdminCatalogChapter[] }>(`/chapters/reorder`, {
      method: "POST",
      body: JSON.stringify({ order }),
    }),
  patchChapterLore: (id: string, patch: ChapterLoreOverride) =>
    request<{ chapter: ChapterLoreOverride }>(`/chapters/${id}/lore`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  /* Personnages */
  createCharacter: (chapterId: string, name: string) =>
    request<{ character: AdminCatalogCharacter }>(
      `/chapters/${chapterId}/personnages`,
      { method: "POST", body: JSON.stringify({ name }) }
    ),
  patchCharacter: (
    chapterId: string,
    slug: string,
    patch: Partial<AdminCatalogCharacter>
  ) =>
    request<{ character: AdminCatalogCharacter }>(
      `/chapters/${chapterId}/personnages/${slug}`,
      { method: "PATCH", body: JSON.stringify(patch) }
    ),
  deleteCharacter: (chapterId: string, slug: string) =>
    request<{ ok: boolean }>(`/chapters/${chapterId}/personnages/${slug}`, {
      method: "DELETE",
    }),
  reorderCharacters: (chapterId: string, order: string[]) =>
    request<{ characters: AdminCatalogCharacter[] }>(
      `/chapters/${chapterId}/personnages/reorder`,
      { method: "POST", body: JSON.stringify({ order }) }
    ),

  /* Images */
  uploadImages: async (chapterId: string, slug: string, files: FileList) => {
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("files", f));
    return request<{
      character: AdminCatalogCharacter;
      uploaded: string[];
      skippedDuplicates: string[];
    }>(
      `/chapters/${chapterId}/personnages/${slug}/images`,
      { method: "POST", body: form },
      true
    );
  },
  deleteImage: (chapterId: string, slug: string, filename: string) =>
    request<{ character: AdminCatalogCharacter }>(
      `/chapters/${chapterId}/personnages/${slug}/images/${encodeURIComponent(filename)}`,
      { method: "DELETE" }
    ),
  reorderImages: (chapterId: string, slug: string, order: string[]) =>
    request<{ character: AdminCatalogCharacter }>(
      `/chapters/${chapterId}/personnages/${slug}/images/reorder`,
      { method: "POST", body: JSON.stringify({ order }) }
    ),

  /* Produits */
  setProductOverride: (chapterId: string, slug: string, patch: ProductOverride) =>
    request<{ override: ProductOverride }>(
      `/chapters/${chapterId}/personnages/${slug}/product`,
      { method: "PUT", body: JSON.stringify(patch) }
    ),
  deleteProductOverride: (chapterId: string, slug: string) =>
    request<{ ok: boolean }>(`/chapters/${chapterId}/personnages/${slug}/product`, {
      method: "DELETE",
    }),

  /* Site / copy */
  setSiteCopy: (patch: Record<string, string>) =>
    request<{ copy: Record<string, string> }>("/site/copy", {
      method: "PUT",
      body: JSON.stringify(patch),
    }),
  setSeason: (patch: AdminCatalog["season"]) =>
    request<{ season: AdminCatalog["season"] }>("/site/season", {
      method: "PUT",
      body: JSON.stringify(patch),
    }),

  /* Médiathèque */
  fetchMedia: () => request<{ items: MediaItem[] }>("/media"),
  uploadMedia: async (files: FileList) => {
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("files", f));
    return request<{
      written: string[];
      skipped: { file: string; existing: string }[];
      items: MediaItem[];
    }>("/media/upload", { method: "POST", body: form }, true);
  },
  deleteMedia: (path: string, force = false) =>
    request<{ ok: boolean; usedBy?: MediaItem["usedBy"] }>(
      `/media?path=${encodeURIComponent(path)}${force ? "&force=true" : ""}`,
      { method: "DELETE" }
    ),
  linkMediaToCharacter: (chapterId: string, slug: string, paths: string[]) =>
    request<{
      character: AdminCatalogCharacter;
      linked: string[];
      skipped: { path: string; reason: string }[];
    }>(`/chapters/${chapterId}/personnages/${slug}/images/link`, {
      method: "POST",
      body: JSON.stringify({ paths }),
    }),

  /* Commerce */
  fetchStats: () =>
    request<{ orders: { total: number; pending: number; revenueXof: number; byStatus: Record<string, number> } }>(
      "/stats"
    ),
  fetchOrders: (status?: string) =>
    request<{ orders: AdminOrder[]; total: number }>(
      `/orders${status ? `?status=${encodeURIComponent(status)}` : ""}`
    ),
  fetchOrder: (id: string) => request<{ order: AdminOrder }>(`/orders/${encodeURIComponent(id)}`),
  patchOrder: (id: string, patch: Partial<Pick<AdminOrder, "status" | "paymentStatus" | "internalNote">>) =>
    request<{ order: AdminOrder }>(`/orders/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  fetchPromos: () => request<{ promos: PromoCode[] }>("/promos"),
  createPromo: (body: Partial<PromoCode>) =>
    request<{ promo: PromoCode }>("/promos", { method: "POST", body: JSON.stringify(body) }),
  patchPromo: (id: string, patch: Partial<PromoCode>) =>
    request<{ promo: PromoCode }>(`/promos/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deletePromo: (id: string) => request<{ ok: boolean }>(`/promos/${id}`, { method: "DELETE" }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: boolean; message: string }>("/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  /* Utilisateurs */
  fetchUsers: () =>
    request<{ users: AdminUser[]; roles: AdminRole[] }>("/users"),
  createUser: (body: {
    email: string;
    name?: string;
    password: string;
    role?: AdminRole;
    active?: boolean;
  }) =>
    request<{ user: AdminUser }>("/users", { method: "POST", body: JSON.stringify(body) }),
  patchUser: (
    id: string,
    patch: Partial<Pick<AdminUser, "email" | "name" | "role" | "active">> & { password?: string }
  ) =>
    request<{ user: AdminUser }>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteUser: (id: string) => request<{ ok: boolean }>(`/users/${id}`, { method: "DELETE" }),
  fetchCustomers: () => request<{ customers: StoreCustomer[] }>("/customers"),

  /* Réglages boutique */
  fetchSettings: () => request<{ settings: SiteSettings }>("/settings"),
  patchSettings: (patch: DeepPartial<SiteSettings>) =>
    request<{ settings: SiteSettings }>("/settings", {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  /* E-mails */
  fetchMailStatus: () =>
    request<{ smtpConfigured: boolean; ok: boolean; reason?: string }>("/mail/status"),
  fetchMailTemplates: () =>
    request<{ templates: Record<string, MailTemplate> }>("/mail/templates"),
  updateMailTemplate: (id: string, patch: Partial<MailTemplate>) =>
    request<{ template: MailTemplate }>(`/mail/templates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  sendMailTest: (to: string) =>
    request<{ ok: boolean; error?: string }>("/mail/test", {
      method: "POST",
      body: JSON.stringify({ to }),
    }),

  /* Avis */
  fetchReviews: (status?: string) =>
    request<{ reviews: AdminReview[] }>(`/reviews${status ? `?status=${status}` : ""}`),
  moderateReview: (id: string, status: "approved" | "rejected" | "pending") =>
    request<{ review: AdminReview }>(`/reviews/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deleteReview: (id: string) =>
    request<{ ok: boolean }>(`/reviews/${id}`, { method: "DELETE" }),

  /* Stock */
  fetchStock: () =>
    request<{ stock: Record<string, StockEntry>; summary: StockSummary[] }>("/stock"),
  putStock: (productKey: string, entry: StockEntry | null) =>
    request<{ stock: StockEntry | null }>(`/stock/${encodeURIComponent(productKey)}`, {
      method: "PUT",
      body: JSON.stringify(entry),
    }),
  setStockQty: (productKey: string, variationId: string, size: string, qty: number) =>
    request<{ stock: StockEntry }>(
      `/stock/${encodeURIComponent(productKey)}/${encodeURIComponent(variationId)}/${encodeURIComponent(size)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ qty }),
      }
    ),

  /* Livraison */
  fetchShippingZones: () => request<{ zones: ShippingZone[] }>("/shipping/zones"),
  createShippingZone: (data: Partial<ShippingZone>) =>
    request<{ zone: ShippingZone }>("/shipping/zones", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateShippingZone: (id: string, patch: Partial<ShippingZone>) =>
    request<{ zone: ShippingZone }>(`/shipping/zones/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteShippingZone: (id: string) =>
    request<{ ok: boolean }>(`/shipping/zones/${id}`, { method: "DELETE" }),

  /* Paiement en ligne — status providers */
  fetchPaymentsStatus: () =>
    request<{
      selected: string;
      active: string | null;
      paytech: { ready: boolean; env: string };
      paydunya: { ready: boolean; mode: string; minAmount: number };
      simulatedAllowed: boolean;
    }>("/payments/status"),

  /* CMS éditorial — pages du site */
  fetchCms: () => request<CmsState>("/cms"),
  patchCmsSection: (sectionId: string, patch: Record<string, unknown>) =>
    request<{ draft: Record<string, Record<string, unknown>> }>(
      `/cms/${encodeURIComponent(sectionId)}`,
      { method: "PATCH", body: JSON.stringify(patch) }
    ),
  publishCms: () =>
    request<{ published: Record<string, Record<string, unknown>>; publishedAt: string }>(
      "/cms/publish",
      { method: "POST" }
    ),
  revertCmsDraft: () =>
    request<{ draft: Record<string, Record<string, unknown>> }>("/cms/revert", {
      method: "POST",
    }),
  createCmsPreviewToken: () =>
    request<{ token: string; expiresAt: string }>("/cms/preview", { method: "POST" }),

  /* Backups */
  fetchBackups: () =>
    request<{ backups: { name: string; size: number; createdAt: string }[] }>("/backups"),
  createBackup: () => request<{ ok: boolean; file: string }>("/backups", { method: "POST" }),
  restoreBackup: (name: string) =>
    request<{ ok: boolean; restoredFiles: string[]; snapshotDir: string }>(
      `/backups/${encodeURIComponent(name)}/restore`,
      { method: "POST" }
    ),

  /* Notifications */
  fetchNotifications: (since?: string) =>
    request<{
      pending: number;
      confirmedToday: number;
      newSinceLast: number;
      newOrders: { id: string; total: number; customerName: string; createdAt: string }[];
      lastCheck: string;
    }>(`/notifications${since ? `?since=${encodeURIComponent(since)}` : ""}`),

  /* Audit log */
  fetchAudit: (params: { action?: string; limit?: number; offset?: number } = {}) => {
    const search = new URLSearchParams();
    if (params.action) search.set("action", params.action);
    if (params.limit) search.set("limit", String(params.limit));
    if (params.offset) search.set("offset", String(params.offset));
    return request<{
      total: number;
      entries: {
        id: string;
        at: string;
        action: string;
        actor: { id: string | null; email: string | null; name: string | null; role: string | null } | null;
        target: { type: string | null; id: string | null; label: string | null } | null;
        meta: Record<string, unknown> | null;
        ip: string | null;
      }[];
    }>(`/audit?${search.toString()}`);
  },

  /* Rapports */
  fetchReports: (months: number = 12) =>
    request<{
      monthly: { key: string; label: string; revenue: number; orders: number }[];
      topProducts: { slug: string; name: string; quantity: number; revenue: number }[];
      topCustomers: { key: string; name: string; email: string; orders: number; revenue: number }[];
      summary: {
        totalRevenue: number;
        totalOrders: number;
        validOrders: number;
        conversion: number;
        avgOrder: number;
      };
    }>(`/reports?months=${months}`),

  /* Pages éditoriales */
  fetchPages: () => request<{ pages: AdminPage[] }>("/pages"),
  updatePage: (slug: string, patch: Partial<AdminPage>) =>
    request<{ page: AdminPage }>(`/pages/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
};

export type AdminPage = {
  slug: string;
  title: string;
  intro?: string;
  body: string;
  enabled?: boolean;
  updatedAt?: string | null;
};

export type AdminReview = {
  id: string;
  productSlug: string;
  customerName: string;
  customerId: string | null;
  rating: number;
  title: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  moderatedAt?: string;
};

export type MailTemplate = {
  label: string;
  subject: string;
  body: string;
};

export type StockEntry = {
  trackInventory: boolean;
  variations: Record<string, Record<string, number>>;
};

export type StockSummary = {
  productKey: string;
  total: number;
  outOfStock: number;
  low: number;
};

export type ShippingZone = {
  id: string;
  name: string;
  countries: string[];
  cities: string[];
  priceXof: number;
  freeAboveXof: number | null;
  etaDays: string;
  active: boolean;
};

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? Array<U>
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

export type SiteSettings = {
  brand: {
    name: string;
    tagline: string;
    legalName: string;
    address: string;
    siteUrl?: string;
  };
  contact: {
    email: string;
    phone: string;
    whatsapp: string;
    supportHours: string;
  };
  social: {
    instagram: string;
    facebook: string;
    tiktok: string;
    youtube: string;
  };
  currency: {
    code: string;
    label: string;
    symbol: string;
    locale: string;
  };
  tax: {
    enabled: boolean;
    rate: number;
    included: boolean;
    label: string;
  };
  production: {
    leadTime: string;
    showLeadTime: boolean;
  };
  payments: {
    methods: { id: string; label: string; active: boolean; instructions: string }[];
  };
  checkout: {
    paymentProvider: "off" | "paytech" | "paydunya";
    allowSimulated: boolean;
    minOnlineAmount: number;
  };
  maintenance: {
    enabled: boolean;
    message: string;
  };
  mail: {
    from: string;
    notifyAdmins: boolean;
    adminRecipients: string;
  };
  legal: {
    siret: string;
    rcs: string;
    vatNumber: string;
  };
  updatedAt: string | null;
};

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} ko`;
  return `${(n / 1024 / 1024).toFixed(1)} Mo`;
}

export function fileUrlFromPath(p: string): string {
  if (!p) return "";
  if (p.startsWith("http")) return p;
  return `/${p.replace(/^\/+/, "")}`;
}
