import { lazy, Suspense, useLayoutEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Loader } from "@/components/ui/Loader";
import { HeroSection } from "@/sections/HeroSection";
import { StorySection } from "@/sections/StorySection";
import { ChaptersSection } from "@/sections/ChaptersSection";
import { FeaturedPiecesSection } from "@/sections/FeaturedPiecesSection";
import { CreatorSection } from "@/sections/CreatorSection";
import { RecognitionSection } from "@/sections/RecognitionSection";
import { ManifestSection } from "@/sections/ManifestSection";
import { MarqueeStrip } from "@/components/ui/MarqueeStrip";
import { useScenePhase } from "@/context/useScenePhase";
import { useLenisGsap } from "@/hooks/useLenisGsap";
import { useSectionSceneBindings } from "@/hooks/useSectionSceneBindings";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { chapters } from "@/content/chapters";
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
  const { setPhase, scrollRef, phase } = useScenePhase();

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
        const pin = document.querySelector<HTMLElement>("[data-chapters-pin]");
        const track = document.querySelector<HTMLElement>("[data-chapters-track]");
        const progress = document.querySelector<HTMLElement>("[data-chapters-progress]");
        const dots = gsap.utils.toArray<HTMLElement>("[data-chapter-dot]");

        if (pin && track) {
          const panelCount = chapters.length;
          const viewport = pin.querySelector<HTMLElement>(".chapters__viewport");
          const distance = () =>
            track.scrollWidth - (viewport?.clientWidth ?? window.innerWidth);

          const horizontalTween = gsap.to(track, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: pin,
              pin: true,
              start: "top top",
              end: () => `+=${distance()}`,
              scrub: 0.6,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                const p = self.progress;
                if (progress) progress.style.transform = `scaleX(${p})`;
                const idx = Math.min(panelCount - 1, Math.floor(p * panelCount));
                scrollRef.current.chapterIndex = idx;
                scrollRef.current.chapter = p;
                dots.forEach((d, i) => {
                  d.classList.toggle("is-active", i === idx);
                });
              },
            },
          });

          gsap.utils.toArray<HTMLElement>(".chapter-panel").forEach((panel) => {
            const head = panel.querySelector(".chapter-panel__head");
            const figs = panel.querySelectorAll<HTMLElement>("figure");
            if (head) {
              gsap.from(head, {
                opacity: 0,
                y: 40,
                duration: 0.9,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: panel,
                  containerAnimation: horizontalTween,
                  start: "left center",
                  toggleActions: "play none none reverse",
                },
              });
            }
            figs.forEach((fig, i) => {
              gsap.from(fig, {
                opacity: 0,
                y: 30,
                scale: 0.96,
                duration: 1,
                delay: 0.05 * i,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: panel,
                  containerAnimation: horizontalTween,
                  start: "left center+=10%",
                  toggleActions: "play none none reverse",
                },
              });
            });
          });
        }

        const creatorEl = creatorRef.current;
        if (creatorEl) {
          gsap.from(creatorEl.querySelectorAll(".creator__paragraphs > p, .pillar"), {
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
          gsap.from(manifestEl.querySelectorAll(".manifest__title, .manifest__body, .manifest__signature"), {
            opacity: 0,
            y: 26,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: manifestEl,
              start: "top 70%",
            },
          });
        }
      });

      mm.add("(max-width: 768px)", () => {
        gsap.utils.toArray<HTMLElement>(".chapter-panel").forEach((el, i) => {
          gsap.from(el, {
            opacity: 0,
            y: 26,
            duration: 0.8,
            delay: i * 0.04,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 90%" },
          });
        });
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
          <MarqueeStrip items={["FANG", "Collection 01", "Nel Fang Te Dundu", "Dakar 14°N", "Artisanal", "2024", "Wolof", "Sérère", "Diola"]} />
          <StorySection ref={storyRef} />
          <MarqueeStrip items={["Tambali", "Passage", "Exposition", "Feu", "Ge Am", "Racine", "Mbougir", "7 Personnages", "1 Vision"]} className="marquee-strip--inverse" />
          <ChaptersSection ref={chaptersRef} />
          <FeaturedPiecesSection />
          <CreatorSection ref={creatorRef} />
          <RecognitionSection />
          <ManifestSection ref={manifestRef} />
        </main>
      </div>
    </div>
  );
}
