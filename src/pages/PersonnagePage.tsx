import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { getChapterBySlug } from "@/content/chapters";
import { resolveChapterNarrative } from "@/content/chapterNarrative";
import { formatPriceXof, getProductsForChapter } from "@/content/shop";
import { copy } from "@/content/copy";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { usePersonnageAmbient } from "@/personnage/usePersonnageAmbient";
import type { PersonnageSceneRef } from "@/r3f/personnage/Personnage3DContext";
import type { ChapterNarrativeArtifact } from "@/content/chapters";

const PersonnageImmersiveCanvas = lazy(() => import("@/r3f/personnage/PersonnageImmersiveCanvas"));

const SCENE_COUNT = 7;

function ArtifactStrip({ items }: { items: ChapterNarrativeArtifact[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  return (
    <div className="personnage-doc__artifacts">
      <ul className="personnage-doc__artifact-tabs">
        {items.map((a) => (
          <li key={a.id}>
            <button type="button" className={open === a.id ? "is-active" : undefined} onClick={() => setOpen(a.id)}>
              <span aria-hidden="true">{a.glyph}</span>
              {a.label}
            </button>
          </li>
        ))}
      </ul>
      {(() => {
        const cur = items.find((x) => x.id === open);
        return cur ? <p className="personnage-doc__artifact-body">{cur.story}</p> : null;
      })()}
    </div>
  );
}

function ChapterMark({ n }: { n: string }) {
  return (
    <span className="personnage-doc__mark" aria-hidden="true">
      {n}
    </span>
  );
}

export function PersonnagePage() {
  const { slug } = useParams<{ slug: string }>();
  const chapter = slug ? getChapterBySlug(slug) : undefined;
  const chapterProducts = chapter ? getProductsForChapter(chapter.id) : [];
  const product = chapterProducts[0];
  const webgl = useWebGLSupport();
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const scroll01 = useRef(0);
  const sceneRef = useRef<PersonnageSceneRef>({ index: 0, local: 0 });
  const ambient = usePersonnageAmbient();

  const syncScroll = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const y = window.scrollY || document.documentElement.scrollTop;
    const u = Math.min(1, Math.max(0, y / max));
    scroll01.current = u;
    el.style.setProperty("--doc-progress", String(u));
    const su = u * SCENE_COUNT;
    const idx = Math.min(SCENE_COUNT - 1, Math.max(0, Math.floor(su)));
    sceneRef.current = { index: idx, local: su - idx };
  }, []);

  useEffect(() => {
    syncScroll();
    window.addEventListener("scroll", syncScroll, { passive: true });
    window.addEventListener("resize", syncScroll);
    return () => {
      window.removeEventListener("scroll", syncScroll);
      window.removeEventListener("resize", syncScroll);
    };
  }, [chapter?.id, syncScroll]);

  if (!chapter) {
    return (
      <main id="contenu-principal" className="personnage-doc personnage-doc--missing shop-shell">
        <p>Personnage introuvable.</p>
        <Link to="/#personnages" className="cta cta--solid">
          Casting
        </Link>
      </main>
    );
  }

  const narrative = resolveChapterNarrative(chapter);
  const heroImage = chapter.images[0];
  const worldImage = chapter.images[1] ?? chapter.images[0];
  const presenceImage = chapter.images[3] ?? chapter.images[2] ?? chapter.images[0];
  const interludeImage = chapter.images[4] ?? chapter.images[2] ?? chapter.images[0];

  const cssVars = {
    "--p1": chapter.palette[0],
    "--p2": chapter.palette[1],
    "--p3": chapter.palette[2],
  } as CSSProperties;

  return (
    <div ref={rootRef} id="contenu-principal" className="personnage-doc" style={cssVars} aria-label={`Documentaire — ${chapter.name}`}>
      {webgl ? (
        <div className="personnage-doc__atmos" aria-hidden="true">
          <Suspense fallback={null}>
            <PersonnageImmersiveCanvas chapter={chapter} scroll01={scroll01} scene={sceneRef} reduced={reduced} />
          </Suspense>
        </div>
      ) : (
        <div className="personnage-doc__atmos personnage-doc__atmos--photo" aria-hidden="true">
          <img src={heroImage} alt="" />
        </div>
      )}

      <div className="personnage-doc__veil" aria-hidden="true" />
      <div className="personnage-doc__grain" aria-hidden="true" />

      <header className="personnage-doc__bar">
        <Link to="/#personnages" className="personnage-doc__back">
          ← {copy.brand}
        </Link>
        <span className="personnage-doc__bar-title">{chapter.name}</span>
        <div className="personnage-doc__bar-right">
          <span className="personnage-doc__chapter-index">Ch. {chapter.index}</span>
          <button type="button" onClick={() => ambient.toggle()} aria-pressed={ambient.audible}>
            {ambient.audible ? copy.personnageSoundOff : copy.personnageSoundOn}
          </button>
        </div>
      </header>

      <div className="personnage-doc__progress" aria-hidden="true">
        <span />
      </div>

      <main className="personnage-doc__content">
        <section className="personnage-doc__hero" aria-label="Ouverture">
          <div className="personnage-doc__hero-visual">
            <img src={heroImage} alt="" />
            <div className="personnage-doc__hero-scrim" aria-hidden="true" />
          </div>
          <div className="personnage-doc__hero-panel">
            <ChapterMark n="01" />
            <div className="personnage-doc__hero-copy">
              <p className="personnage-doc__kicker">{copy.chaptersEyebrow}</p>
              <h1>{chapter.name}</h1>
              <span className="personnage-doc__title-rule" aria-hidden="true" />
              <p className="personnage-doc__lede">{narrative.cinematicLine}</p>
              <p className="personnage-doc__meta">
                {chapter.characterLabel} — {narrative.eraPlace}
              </p>
              <p className="personnage-doc__scroll-hint">{copy.personnageDocScrollHint}</p>
              <div className="personnage-doc__hero-commerce" aria-label="Boutique">
                {product ? (
                  <>
                    <Link to={`/boutique/${product.slug}`} className="cta cta--solid personnage-doc__hero-cta">
                      {copy.personnageShopSeePiece}
                      <span className="personnage-doc__hero-cta-sub" aria-hidden="true">
                        {" "}
                        — {product.name}
                      </span>
                    </Link>
                    <Link
                      to={`/collection/${chapter.slug}`}
                      className="cta cta--ghost personnage-doc__hero-cta personnage-doc__hero-cta--secondary"
                    >
                      {copy.collectionSeeChapter} — {copy.collectionPersonnagesLabel.toLowerCase()}
                    </Link>
                    <Link
                      to={`/boutique?personnage=${chapter.id}`}
                      className="cta cta--ghost personnage-doc__hero-cta personnage-doc__hero-cta--secondary"
                    >
                      {copy.personnageShopBrowseCharacter}
                    </Link>
                  </>
                ) : (
                  <Link to="/boutique" className="cta cta--ghost personnage-doc__hero-cta">
                    {copy.personnageShopDiscover}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="personnage-doc__band personnage-doc__band--world" aria-labelledby="doc-world-heading">
          <div className="personnage-doc__segment">
            <ChapterMark n="02" />
            <div className="personnage-doc__band-inner">
              <div className="personnage-doc__band-copy">
                <p className="personnage-doc__eyebrow">{copy.personnageSceneWorld}</p>
                <h2 id="doc-world-heading">{narrative.worldHeadline}</h2>
                <div className="personnage-doc__prose personnage-doc__prose--dropcap">
                  {narrative.worldIntro.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
              <figure className="personnage-doc__band-figure">
                <img src={worldImage} alt="" loading="lazy" />
              </figure>
            </div>
          </div>
        </section>

        <section className="personnage-doc__band personnage-doc__band--presence" aria-labelledby="doc-presence-heading">
          <div className="personnage-doc__segment">
            <ChapterMark n="03" />
            <div className="personnage-doc__band-inner personnage-doc__band-inner--reverse">
              <figure className="personnage-doc__band-figure">
                <img src={presenceImage} alt="" loading="lazy" />
              </figure>
              <div className="personnage-doc__band-copy">
                <p className="personnage-doc__eyebrow">{copy.personnageSceneFiche}</p>
                <h2 id="doc-presence-heading">{chapter.role}</h2>
                <dl className="personnage-doc__facts">
                  <div>
                    <dt>Sens</dt>
                    <dd>{chapter.meaning}</dd>
                  </div>
                  <div>
                    <dt>Intention</dt>
                    <dd>{chapter.intention}</dd>
                  </div>
                  <div>
                    <dt>Tension</dt>
                    <dd>{narrative.challengeLine}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section className="personnage-doc__decisive" aria-labelledby="doc-decisive-heading">
          <div className="personnage-doc__segment personnage-doc__segment--solo">
            <ChapterMark n="04" />
            <div>
              <p className="personnage-doc__eyebrow">{copy.personnageSceneDecisive}</p>
              <h2 id="doc-decisive-heading">{narrative.decisiveTitle}</h2>
              <div className="personnage-doc__prose personnage-doc__prose--narrow">
                {narrative.decisiveBody.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
              <ArtifactStrip items={narrative.artifacts} />
            </div>
          </div>
        </section>

        <figure className="personnage-doc__interlude" aria-hidden="true">
          <img src={interludeImage} alt="" loading="lazy" />
        </figure>

        <section className="personnage-doc__griot" aria-labelledby="doc-griot-heading">
          <div className="personnage-doc__segment personnage-doc__segment--solo">
            <ChapterMark n="05" />
            <div className="personnage-doc__griot-panel">
              <p className="personnage-doc__eyebrow">{copy.personnageSceneGriot}</p>
              <h2 id="doc-griot-heading" className="personnage-doc__sr-only">
                Voix du griot
              </h2>
              <div className="personnage-doc__prose personnage-doc__griot-text">
                {narrative.griotVoice.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
              <blockquote className="personnage-doc__pullquote">«&nbsp;{chapter.quote}&nbsp;»</blockquote>
            </div>
          </div>
        </section>

        <section className="personnage-doc__legacy" aria-labelledby="doc-legacy-heading">
          <div className="personnage-doc__segment personnage-doc__segment--solo">
            <ChapterMark n="06" />
            <div className="personnage-doc__legacy-grid">
              <div className="personnage-doc__legacy-main">
                <p className="personnage-doc__eyebrow">{copy.personnageSceneLegacy}</p>
                <h2 id="doc-legacy-heading">{narrative.closingLine}</h2>
                <ul className="personnage-doc__tags">
                  {chapter.moodTags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <div className="personnage-doc__palette" aria-label="Palette">
                  {chapter.palette.map((hex) => (
                    <span key={hex} style={{ background: hex }} title={hex} />
                  ))}
                </div>
                <p className="personnage-doc__wear">{chapter.wear}</p>
              </div>
              <aside className="personnage-doc__legacy-aside">
                {product ? (
                  <Link to={`/boutique/${product.slug}`} className="personnage-doc__product">
                    <img src={product.images[0]} alt="" loading="lazy" />
                    <span>
                      <b>{product.name}</b>
                      <span className="personnage-doc__product-excerpt">{product.excerpt}</span>
                      <em>{formatPriceXof(product.priceXof)} FCFA</em>
                    </span>
                  </Link>
                ) : null}
                <nav className="personnage-doc__nav" aria-label="Liens">
                  <Link to={product ? `/boutique?personnage=${chapter.id}` : "/boutique"}>Boutique</Link>
                  <a href="https://www.instagram.com/fanglamarque/" target="_blank" rel="noreferrer">
                    Instagram
                  </a>
                </nav>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
