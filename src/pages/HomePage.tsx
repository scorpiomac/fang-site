import { lazy, Suspense, useLayoutEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Loader } from "@/components/ui/Loader";
import { HeroSection } from "@/sections/HeroSection";
import { StorySection } from "@/sections/StorySection";
import { ChaptersSection } from "@/sections/ChaptersSection";
import { CreatorSection } from "@/sections/CreatorSection";
import { RecognitionSection } from "@/sections/RecognitionSection";
import { ManifestSection } from "@/sections/ManifestSection";
import { MarqueeStrip } from "@/components/ui/MarqueeStrip";
import { homeMarqueeMeanings, homeMarqueeNames } from "@/content/characterProfiles";
import { useScenePhase } from "@/context/useScenePhase";
import { useLenisGsap } from "@/hooks/useLenisGsap";
import { useSectionSceneBindings } from "@/hooks/useSectionSceneBindings";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Seo } from "@/components/Seo";
import { useSiteSettings } from "@/context/siteSettingsContext";

gsap.registerPlugin(ScrollTrigger);

const CanvasRoot = lazy(async () => {
  const m = await import("@/r3f/CanvasRoot");
  return { default: m.CanvasRoot };
});

export function HomePage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const chaptersRef = useRef<HTMLElement>(null);
  const creatorRef = useRef<HTMLElement>(null);
  const manifestRef = useRef<HTMLElement>(null);

  const [loaded, setLoaded] = useState(false);
  const onLoaderDone = useCallback(() => setLoaded(true), []);

  const webgl = useWebGLSupport();
  const reduced = useReducedMotion();
  const { setPhase, phase } = useScenePhase();

  useLenisGsap(loaded && !reduced);
  useSectionSceneBindings(
    [
      { ref: heroRef, phase: "hero" },
      { ref: storyRef, phase: "story" },
      { ref: chaptersRef, phase: "chapters" },
      { ref: creatorRef, phase: "creator" },
      { ref: manifestRef, phase: "manifest" },
    ],
    setPhase
  );

  useLayoutEffect(() => {
    if (!loaded) return;

    const ctx = gsap.context(() => {
      gsap.from(".hero__top > *", {
        opacity: 0,
        y: -12,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
        delay: 0.1,
      });
      gsap.from(".hero__content > *", {
        opacity: 0,
        y: 28,
        duration: 1.1,
        stagger: 0.09,
        ease: "power3.out",
        delay: 0.25,
      });
      gsap.from(".hero__scroll", {
        opacity: 0,
        y: 16,
        duration: 1.0,
        delay: 0.9,
        ease: "power2.out",
      });

      if (reduced) return;

      const mm = gsap.matchMedia();

      mm.add("(min-width: 901px)", () => {
        const creatorEl = creatorRef.current;
        if (creatorEl) {
          gsap.from(creatorEl.querySelectorAll(".creator__paragraphs > p, .creator-stance"), {
            opacity: 0,
            y: 30,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: creatorEl,
              start: "top 70%",
              toggleActions: "play none none reverse",
            },
          });
          gsap.from(".creator__portrait-frame", {
            opacity: 0,
            scale: 0.9,
            ease: "power3.out",
            duration: 1.2,
            scrollTrigger: {
              trigger: creatorEl,
              start: "top 75%",
            },
          });
        }

        const manifestEl = manifestRef.current;
        if (manifestEl) {
          gsap.from(
            manifestEl.querySelectorAll(".manifest__title, .manifest__body, .manifest__signature"),
            {
              opacity: 0,
              y: 26,
              stagger: 0.12,
              ease: "power3.out",
              scrollTrigger: {
                trigger: manifestEl,
                start: "top 70%",
              },
            }
          );
        }
      });

      mm.add("(max-width: 900px)", () => {
        const pin = document.querySelector<HTMLElement>("[data-chapters-pin]");
        if (pin) {
          gsap.from(pin, {
            opacity: 0,
            y: 24,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: { trigger: pin, start: "top 88%" },
          });
        }
      });
    }, rootRef);

    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, reduced]);

  useLayoutEffect(() => {
    if (!loaded) {
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [loaded]);

  const { settings } = useSiteSettings();
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.brand.name,
    legalName: settings.brand.legalName,
    url: siteUrl,
    logo: `${siteUrl}/favicon.svg`,
    sameAs: [settings.social.instagram].filter(Boolean),
    address: settings.brand.address
      ? {
          "@type": "PostalAddress",
          streetAddress: settings.brand.address,
        }
      : undefined,
    contactPoint: settings.contact.email
      ? {
          "@type": "ContactPoint",
          email: settings.contact.email,
          telephone: settings.contact.phone,
          contactType: "customer service",
        }
      : undefined,
  };

  return (
    <div ref={rootRef} className="home">
      <Seo
        title={`${settings.brand.name} — Maison afro-contemporaine`}
        description={
          settings.brand.tagline ??
          "FANG. Maison sénégalaise de mode afro-contemporaine. Pièces faites à la main à Dakar."
        }
        url={siteUrl}
        jsonLd={orgJsonLd}
      />
      {!loaded ? <Loader onDone={onLoaderDone} /> : null}
      <div className={`home__stage ${loaded ? "home__stage--ready" : ""}`}>
        <div
          className={`canvas-layer${phase === "hero" ? " canvas-layer--hero-video" : ""}`}
          aria-hidden="true"
        >
          {webgl ? (
            <Suspense fallback={null}>
              <CanvasRoot />
            </Suspense>
          ) : null}
        </div>
        <main id="contenu-principal" className="content-root">
          <HeroSection ref={heroRef} showVideoFallback />
          <MarqueeStrip items={homeMarqueeNames} gloss />
          <StorySection ref={storyRef} />
          <MarqueeStrip items={homeMarqueeMeanings} className="marquee-strip--inverse" />
          <ChaptersSection ref={chaptersRef} />
          <CreatorSection ref={creatorRef} />
          <RecognitionSection />
          <ManifestSection ref={manifestRef} />
        </main>
      </div>
    </div>
  );
}
