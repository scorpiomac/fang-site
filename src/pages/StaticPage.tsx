import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchPage, type StorePage } from "@/lib/storeApi";
import { FooterSection } from "@/sections/FooterSection";

export function StaticPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<StorePage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    fetchPage(slug)
      .then((p) => {
        if (!cancelled) {
          setPage(p);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (page?.title) document.title = `${page.title} · FANG`;
  }, [page?.title]);

  if (loading) {
    return (
      <main id="contenu-principal" className="static-page">
        <div className="static-page__container">
          <p className="static-page__loading">Chargement…</p>
        </div>
      </main>
    );
  }

  if (!page) {
    return (
      <main id="contenu-principal" className="static-page">
        <div className="static-page__container">
          <h1 className="static-page__title">Page introuvable</h1>
          <p>
            La page demandée n'existe pas.{" "}
            <Link to="/" className="link-underline">
              Retour à l'accueil
            </Link>
            .
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main id="contenu-principal" className="static-page">
        <div className="static-page__container">
          <h1 className="static-page__title">{page.title}</h1>
          {page.intro ? <p className="static-page__intro">{page.intro}</p> : null}
          <div className="static-page__body">
            {page.body.split(/\n\n+/).map((block, idx) => {
              const trimmed = block.trim();
              if (!trimmed) return null;
              if (trimmed.startsWith("##")) {
                return (
                  <h3 key={idx} className="static-page__heading">
                    {trimmed.replace(/^##\s*/, "")}
                  </h3>
                );
              }
              if (trimmed.startsWith("#")) {
                return (
                  <h2 key={idx} className="static-page__heading">
                    {trimmed.replace(/^#\s*/, "")}
                  </h2>
                );
              }
              if (/^\d+\.\s|^[A-ZÉÈÊÀÂÎÔÛÇ ]{4,}$/m.test(trimmed.split("\n")[0])) {
                const [first, ...rest] = trimmed.split("\n");
                return (
                  <div key={idx} className="static-page__paragraph">
                    <strong>{first}</strong>
                    {rest.length ? (
                      <p style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{rest.join("\n")}</p>
                    ) : null}
                  </div>
                );
              }
              return (
                <p
                  key={idx}
                  className="static-page__paragraph"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {trimmed}
                </p>
              );
            })}
          </div>
          {page.updatedAt ? (
            <p className="static-page__updated">
              Dernière mise à jour : {new Date(page.updatedAt).toLocaleDateString("fr-FR")}
            </p>
          ) : null}
        </div>
      </main>
      <FooterSection />
    </>
  );
}
