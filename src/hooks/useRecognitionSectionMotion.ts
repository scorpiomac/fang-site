import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useRecognitionSectionMotion(
  rootRef: RefObject<HTMLElement | null>,
  enabled: boolean
) {
  useLayoutEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const head = root.querySelector<HTMLElement>(".recognition__head");
      const eyebrowLines = gsap.utils.toArray<HTMLElement>(".recognition__eyebrow-line", root);
      const eyebrowText = root.querySelector<HTMLElement>(".recognition__eyebrow-text");
      const title = root.querySelector<HTMLElement>(".recognition__title");
      const diamond = root.querySelector<HTMLElement>(".recognition__diamond");
      const lede = root.querySelector<HTMLElement>(".recognition__lede");
      const timeline = root.querySelector<HTMLElement>(".recognition__timeline");
      const milestones = gsap.utils.toArray<HTMLElement>(".recognition-milestone", root);
      const vision = root.querySelector<HTMLElement>(".recognition__vision");
      const globe = root.querySelector<HTMLElement>(".recognition__vision-globe");
      const visionLabel = root.querySelector<HTMLElement>(".recognition__vision-label");
      const visionQuote = root.querySelector<HTMLElement>(".recognition__vision-quote");
      const visionMarks = gsap.utils.toArray<HTMLElement>(".recognition__vision-mark", root);
      const cities = gsap.utils.toArray<HTMLElement>(".recognition__cities li", root);
      const cta = root.querySelector<HTMLElement>(".recognition__cta");

      gsap.set(eyebrowLines, { scaleX: 0, transformOrigin: "center center" });
      gsap.set(eyebrowText, { opacity: 0, letterSpacing: "0.55em" });
      gsap.set(title, { opacity: 0, y: 28 });
      gsap.set(diamond, { opacity: 0, scale: 0, rotate: -45 });
      gsap.set(lede, { opacity: 0, y: 18 });
      milestones.forEach((m) => {
        const year = m.querySelector<HTMLElement>(".recognition-milestone__year");
        const card = m.querySelector<HTMLElement>(".recognition-milestone__card");
        const icon = m.querySelector<HTMLElement>(".recognition-milestone__icon");
        const copy = m.querySelector<HTMLElement>(".recognition-milestone__copy");
        const media = m.querySelector<HTMLElement>(".recognition-milestone__media");

        if (year) gsap.set(year, { opacity: 0, x: -16 });
        if (card) gsap.set(card, { opacity: 0, x: 40, scale: 0.97 });
        if (icon) gsap.set(icon, { opacity: 0, scale: 0.6, rotate: -12 });
        if (copy) gsap.set(copy, { opacity: 0, y: 12 });
        if (media) gsap.set(media, { opacity: 0, scale: 1.08, clipPath: "inset(0 0 100% 0)" });
      });

      const globeOutline = root.querySelector<SVGGeometryElement>(".recognition__globe-outline");
      const globeMeridians = root.querySelector<SVGGElement>(".recognition__globe-meridians");
      const globeParallels = root.querySelector<SVGGElement>(".recognition__globe-parallels");
      const globeAura = root.querySelector<HTMLElement>(".recognition__vision-globe-aura");

      if (vision) gsap.set(vision, { opacity: 0, y: 48, scale: 0.98 });
      if (globe) gsap.set(globe, { opacity: 0, rotate: -18, scale: 0.85 });
      if (globeOutline) {
        const length = globeOutline.getTotalLength();
        gsap.set(globeOutline, {
          strokeDasharray: length,
          strokeDashoffset: length,
          opacity: 0.35,
        });
      }
      if (globeMeridians) {
        gsap.set(globeMeridians, { opacity: 0, rotate: -24, transformOrigin: "50% 50%", svgOrigin: "60 60" });
      }
      if (globeParallels) {
        gsap.set(globeParallels, { opacity: 0, rotate: 18, transformOrigin: "50% 50%", svgOrigin: "60 60" });
      }
      if (globeAura) gsap.set(globeAura, { opacity: 0, scale: 0.6 });
      if (visionLabel) gsap.set(visionLabel, { opacity: 0, y: 10 });
      if (visionQuote) gsap.set(visionQuote, { opacity: 0, y: 16 });
      gsap.set(visionMarks, { opacity: 0, scale: 0.5 });
      gsap.set(cities, { opacity: 0, y: 12 });
      if (cta) gsap.set(cta, { opacity: 0, y: 14 });

      const headTl = gsap.timeline({
        scrollTrigger: {
          trigger: head,
          start: "top 82%",
          once: true,
        },
      });

      headTl
        .to(eyebrowLines, {
          scaleX: 1,
          duration: 0.7,
          stagger: 0.12,
          ease: "power3.out",
        })
        .to(
          eyebrowText,
          { opacity: 1, letterSpacing: "0.42em", duration: 0.6, ease: "power2.out" },
          0.08
        )
        .to(title, { opacity: 1, y: 0, duration: 0.85, ease: "power3.out" }, 0.2)
        .to(
          diamond,
          { opacity: 0.85, scale: 1, rotate: 45, duration: 0.55, ease: "back.out(2)" },
          0.38
        )
        .to(lede, { opacity: 1, y: 0, duration: 0.75, ease: "power2.out" }, 0.48);

      const timelineTl = gsap.timeline({
        scrollTrigger: {
          trigger: timeline,
          start: "top 78%",
          once: true,
        },
      });

      milestones.forEach((m, i) => {
        const year = m.querySelector<HTMLElement>(".recognition-milestone__year");
        const card = m.querySelector<HTMLElement>(".recognition-milestone__card");
        const icon = m.querySelector<HTMLElement>(".recognition-milestone__icon");
        const copy = m.querySelector<HTMLElement>(".recognition-milestone__copy");
        const media = m.querySelector<HTMLElement>(".recognition-milestone__media");
        const offset = 0.18 + i * 0.22;

        if (year) {
          timelineTl.to(year, { opacity: 1, x: 0, duration: 0.55, ease: "power3.out" }, offset);
        }
        if (card) {
          timelineTl.to(
            card,
            { opacity: 1, x: 0, scale: 1, duration: 0.75, ease: "power3.out" },
            offset + 0.06
          );
        }
        if (icon) {
          timelineTl.to(
            icon,
            { opacity: 1, scale: 1, rotate: 0, duration: 0.55, ease: "back.out(1.8)" },
            offset + 0.16
          );
        }
        if (copy) {
          timelineTl.to(copy, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, offset + 0.22);
        }
        if (media) {
          timelineTl.to(
            media,
            {
              opacity: 1,
              scale: 1,
              clipPath: "inset(0 0 0% 0)",
              duration: 0.8,
              ease: "power3.out",
            },
            offset + 0.18
          );
        }

        ScrollTrigger.create({
          trigger: card ?? m,
          start: "top 88%",
          once: true,
          onEnter: () => m.classList.add("is-revealed"),
        });
      });

      const visionTl = gsap.timeline({
        scrollTrigger: {
          trigger: vision,
          start: "top 80%",
          once: true,
        },
      });

      visionTl
        .to(vision, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: "power3.out" })
        .to(
          globe,
          { opacity: 1, rotate: 0, scale: 1, duration: 1.1, ease: "power2.out" },
          0.05
        )
        .to(
          globeAura,
          { opacity: 0.6, scale: 1, duration: 1.2, ease: "power2.out" },
          0.08
        )
        .to(
          globeOutline,
          { strokeDashoffset: 0, duration: 1.35, ease: "power2.inOut" },
          0.12
        )
        .to(
          globeMeridians,
          { opacity: 0.38, rotate: 0, duration: 0.95, ease: "power3.out" },
          0.18
        )
        .to(
          globeParallels,
          { opacity: 0.28, rotate: 0, duration: 0.95, ease: "power3.out" },
          0.24
        )
        .call(() => {
          globe?.classList.add("is-animated");
        })
        .to(visionLabel, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0.18)
        .to(visionMarks, { opacity: 1, scale: 1, duration: 0.65, stagger: 0.08, ease: "back.out(1.6)" }, 0.22)
        .to(visionQuote, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, 0.32)
        .to(cities, { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "power2.out" }, 0.48)
        .to(cta, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, 0.62);

      if (globe && vision) {
        gsap.to(globe, {
          y: -10,
          duration: 4.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 1.2,
        });
      }

      milestones.forEach((m, i) => {
        gsap.fromTo(
          m,
          { y: 0 },
          {
            y: -6 - i * 2,
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.4,
            },
          }
        );
      });

      root.classList.add("recognition--motion-ready");
    }, root);

    return () => {
      root.classList.remove("recognition--motion-ready");
      ctx.revert();
    };
  }, [enabled, rootRef]);
}
