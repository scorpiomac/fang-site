import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useStorySectionMotion(
  rootRef: RefObject<HTMLElement | null>,
  enabled: boolean
) {
  useLayoutEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const watermark = root.querySelector<HTMLElement>(".story__watermark");
      const masthead = root.querySelector<HTMLElement>(".story__masthead");
      const eyebrow = root.querySelector<HTMLElement>(".story__eyebrow");
      const lines = gsap.utils.toArray<HTMLElement>(".story__eyebrow-line", root);
      const cards = gsap.utils.toArray<HTMLElement>(".story-card", root);
      const closing = root.querySelector<HTMLElement>(".story__closing");

      gsap.set(masthead, { opacity: 0, y: 16 });
      gsap.set(lines, { scaleX: 0, transformOrigin: "center center" });
      gsap.set(eyebrow, { opacity: 0, letterSpacing: "0.55em" });
      gsap.set(cards, { opacity: 0, y: 56, scale: 0.94 });
      gsap.set(closing, { opacity: 0, y: 32, scale: 0.97 });

      const enterTl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top 82%",
          once: true,
        },
      });

      enterTl
        .to(lines, {
          scaleX: 1,
          duration: 0.75,
          stagger: 0.1,
          ease: "power3.out",
        })
        .to(
          eyebrow,
          { opacity: 1, letterSpacing: "0.42em", duration: 0.65, ease: "power2.out" },
          0.1
        )
        .to(masthead, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0.08)
        .to(
          cards,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: { each: 0.11, from: "start" },
            ease: "power3.out",
          },
          0.28
        )
        .to(
          closing,
          { opacity: 1, y: 0, scale: 1, duration: 0.75, ease: "power3.out" },
          0.72
        );

      if (watermark) {
        gsap.fromTo(
          watermark,
          { y: -40, scale: 0.92, opacity: 0.03 },
          {
            y: 60,
            scale: 1.06,
            opacity: 0.075,
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.4,
            },
          }
        );
      }

      cards.forEach((card, index) => {
        gsap.fromTo(
          card,
          { y: 0 },
          {
            y: -10 - index * 2,
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: "top center",
              end: "bottom center",
              scrub: 1.6,
            },
          }
        );

        ScrollTrigger.create({
          trigger: card,
          start: "top 92%",
          once: true,
          onEnter: () => card.classList.add("is-revealed"),
        });
      });

      if (closing) {
        gsap.to(closing, {
          y: -12,
          ease: "none",
          scrollTrigger: {
            trigger: closing,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.2,
          },
        });
      }

      root.classList.add("story--motion-ready");
    }, root);

    return () => {
      root.classList.remove("story--motion-ready");
      ctx.revert();
    };
  }, [enabled, rootRef]);
}
