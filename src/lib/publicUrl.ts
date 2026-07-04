/**
 * URL vers un fichier servi depuis `public/` (respecte `import.meta.env.BASE_URL`
 * pour un déploiement dans un sous-dossier, ex. `/fangg/`).
 */
export function publicUrl(path: string): string {
  const normalized = path.replace(/^\/+/, "");
  const base = import.meta.env.BASE_URL ?? "/";
  if (base === "/") return `/${normalized}`;
  return `${base.replace(/\/$/, "")}/${normalized}`;
}

/** Pour panier / anciennes valeurs : applique BASE_URL si ce n’est pas déjà une URL absolue. */
export function resolveMediaUrl(href: string): string {
  if (!href) return "";
  if (/^https?:\/\//i.test(href)) return href;
  return publicUrl(href.replace(/^\/+/, ""));
}
