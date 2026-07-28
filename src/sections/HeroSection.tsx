import { forwardRef, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { GlossedTerm } from "@/components/ui/GlossedTerm";
import { copy } from "@/content/copy";
import { publicUrl } from "@/lib/publicUrl";
import { useCmsText } from "@/context/CmsContext";

type Props = {
  showVideoFallback?: boolean;
};

export const HeroSection = forwardRef<HTMLElement, Props>(function HeroSection(
  { showVideoFallback = true },
  ref
) {
  const heroEyebrow = useCmsText("home.hero.eyebrow", copy.heroEyebrow);
  const heroTitle = useCmsText("home.hero.title", copy.heroTitle);
  const heroSubtitle = useCmsText("home.hero.subtitle", copy.heroSubtitle);
  const heroPrimary = useCmsText("home.hero.ctaPrimary", copy.heroPrimary);
  const heroSecondary = useCmsText("home.hero.ctaSecondary", copy.heroSecondary);
  const tagline = useCmsText("brand.tagline", copy.tagline);
  const taglineFr = useCmsText("brand.taglineFr", copy.taglineFr);
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroVideoSrc = publicUrl("video/fang-hero.mp4");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !showVideoFallback) return;
    video.muted = true;
    const tryPlay = () => {
      void video.play().catch(() => {});
    };
    tryPlay();
    video.addEventListener("loadeddata", tryPlay);
    return () => video.removeEventListener("loadeddata", tryPlay);
  }, [showVideoFallback, heroVideoSrc]);

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
          ref={videoRef}
          className="hero__video"
          src={heroVideoSrc}
          muted
          playsInline
          autoPlay
          loop
          preload="auto"
          aria-hidden="true"
        />
      ) : null}
      <div className="hero__veil" />
      <div className="hero__scrim" />
      <div className="hero__cursor-glow" aria-hidden="true" />

      <div className="hero__top">
        <p className="hero__credit">{heroEyebrow}</p>
        <p className="hero__credit hero__credit--right">
          <span className="hand hero__sign" aria-label="Signature Fallou Ngom">
            Fallou Ngom
          </span>
        </p>
      </div>

      <div className="hero__content">
        <p className="hero__wolof" data-split>
          <GlossedTerm term={tagline} meaning={taglineFr} focusable>
            {tagline}
          </GlossedTerm>
        </p>
        <h1 className="hero__title">
          {heroTitle === copy.heroTitle ? (
            <>
              <span className="hero__title-line">Le futur</span>
              <span className="hero__title-line hero__title-line--accent">
                <em>a des</em> racines.
              </span>
            </>
          ) : (
            <span className="hero__title-line">{heroTitle}</span>
          )}
        </h1>
        <p className="hero__subtitle">{heroSubtitle}</p>
        <div className="hero__actions">
          <Link className="cta cta--solid" to="/collection">
            <span>{heroPrimary}</span>
            <span aria-hidden>→</span>
          </Link>
          <Link className="cta cta--ghost" to="/archetype">
            <span>{heroSecondary}</span>
          </Link>
        </div>
        <p className="hero__sub-meta">
          <span>Chapitres · archétypes · pièces produites à Dakar</span>
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
