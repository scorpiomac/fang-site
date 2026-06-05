import { forwardRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { copy } from "@/content/copy";
import { publicUrl } from "@/lib/publicUrl";

type Props = {
  showVideoFallback?: boolean;
};

export const HeroSection = forwardRef<HTMLElement, Props>(function HeroSection(
  { showVideoFallback = true },
  ref
) {
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--glow-x", `${x}%`);
    el.style.setProperty("--glow-y", `${y}%`);
  }, []);

  return (
    <section
      ref={ref}
      className="hero"
      id="top"
      aria-label="Accueil"
      onMouseMove={onMouseMove}
    >
      {showVideoFallback ? (
        <video
          className="hero__video"
          src={publicUrl("video/fang-hero.mp4")}
          poster={publicUrl("video/fang-hero-poster.jpg")}
          muted
          playsInline
          autoPlay
          loop
        />
      ) : null}
      <div className="hero__veil" />
      <div className="hero__scrim" />
      <div className="hero__cursor-glow" aria-hidden="true" />

      <div className="hero__top">
        <p className="hero__credit">{copy.heroEyebrow}</p>
        <p className="hero__credit hero__credit--right">
          <span className="hand hero__sign" aria-label="Signature Fallou Ngom">
            Fallou Ngom
          </span>
        </p>
      </div>

      <div className="hero__content">
        <p className="hero__wolof" data-split>
          {copy.tagline}
        </p>
        <h1 className="hero__title">
          <span className="hero__title-line">Le futur</span>
          <span className="hero__title-line hero__title-line--accent">
            <em>a des</em> racines.
          </span>
        </h1>
        <p className="hero__subtitle">{copy.heroSubtitle}</p>
        <div className="hero__actions">
          <a className="cta cta--solid" href="#personnages">
            <span>Découvrir le casting</span>
            <span aria-hidden>→</span>
          </a>
          <Link className="cta cta--ghost" to="/boutique">
            <span>Voir la boutique</span>
          </Link>
        </div>
        <p className="hero__sub-meta">
          <span>7 personnages — 7 pièces produites à Dakar.</span>
          <a href="#manifeste" className="hero__sub-meta-link">
            Lire le manifeste →
          </a>
        </p>
      </div>

      {/* Ornement décoratif flottant */}
      <span className="hero__ornament" aria-hidden="true">✦</span>

      <div className="hero__scroll" aria-hidden="true">
        <span className="hero__scroll-line" />
        <span className="hero__scroll-label">scroll</span>
      </div>
    </section>
  );
});
