import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

function prefersNativeScroll(): boolean {
  if (typeof window === "undefined") return true;
  // Sur tactile / tablette, Lenis + barre d’URL provoquent des sauts / faux « reload ».
  return (
    window.matchMedia("(hover: none), (pointer: coarse)").matches ||
    window.matchMedia("(max-width: 900px)").matches
  );
}

export function useLenisGsap(active: boolean) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!active || reduced) return;

    if (prefersNativeScroll()) {
      document.documentElement.classList.add("scroll-native");
      return () => {
        document.documentElement.classList.remove("scroll-native");
      };
    }

    const lenis = new Lenis({
      autoRaf: false,
      // Évite le rubber-band qui déclenche le pull-to-refresh.
      syncTouch: false,
    });
    const onScroll = () => {
      ScrollTrigger.update();
    };
    lenis.on("scroll", onScroll);

    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.scrollerProxy(document.documentElement, {
      scrollTop(value) {
        if (arguments.length) {
          lenis.scrollTo(value as number, { immediate: true });
        }
        return lenis.animatedScroll;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
          right: window.innerWidth,
          bottom: window.innerHeight,
        };
      },
      pinType: document.documentElement.style.transform ? "transform" : "fixed",
    });

    // Ne rafraîchir que si la largeur change (pas quand la barre d’URL mobile monte/descend).
    let lastWidth = window.innerWidth;
    const onResize = () => {
      const w = window.innerWidth;
      if (Math.abs(w - lastWidth) < 2) return;
      lastWidth = w;
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);
    ScrollTrigger.refresh();

    return () => {
      window.removeEventListener("resize", onResize);
      gsap.ticker.remove(ticker);
      lenis.off("scroll", onScroll);
      lenis.destroy();
      // Ne pas forcer scrollTop = 0 : ça donne l’impression d’un rechargement.
      ScrollTrigger.scrollerProxy(document.documentElement, {});
      ScrollTrigger.refresh();
    };
  }, [active, reduced]);
}
