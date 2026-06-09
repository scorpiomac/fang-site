import { useEffect } from "react";

type SeoProps = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  noindex?: boolean;
  jsonLd?: object | object[];
};

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(payload: object | object[] | undefined) {
  document.head.querySelectorAll("script[data-fang-jsonld]").forEach((n) => n.remove());
  if (!payload) return;
  const arr = Array.isArray(payload) ? payload : [payload];
  for (const item of arr) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-fang-jsonld", "1");
    script.textContent = JSON.stringify(item);
    document.head.appendChild(script);
  }
}

export function Seo({
  title,
  description,
  image,
  url,
  type = "website",
  noindex,
  jsonLd,
}: SeoProps) {
  useEffect(() => {
    if (title) document.title = title;

    const desc = description ?? "Maison sénégalaise de mode afro-contemporaine.";
    upsertMeta("name", "description", desc);

    upsertMeta("property", "og:type", type);
    if (title) upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", desc);
    if (image) upsertMeta("property", "og:image", image);
    if (url) upsertMeta("property", "og:url", url);

    upsertMeta("name", "twitter:card", "summary_large_image");
    if (title) upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", desc);
    if (image) upsertMeta("name", "twitter:image", image);

    if (noindex) {
      upsertMeta("name", "robots", "noindex, nofollow");
    } else {
      upsertMeta("name", "robots", "index, follow");
    }

    if (url) upsertLink("canonical", url);

    setJsonLd(jsonLd);
  }, [title, description, image, url, type, noindex, jsonLd]);

  return null;
}
