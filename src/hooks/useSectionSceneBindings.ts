import { useLayoutEffect, type RefObject } from "react";
import type { ScenePhase } from "@/context/scenePhaseTypes";

type Binding = { ref: RefObject<HTMLElement | null>; phase: Exclude<ScenePhase, "idle"> };

export function useSectionSceneBindings(
  bindings: Binding[],
  setPhase: (p: ScenePhase) => void
) {
  useLayoutEffect(() => {
    let io: IntersectionObserver | null = null;
    let raf = 0;
    let cancelled = false;

    const ratios = new Map<Element, number>();

    const apply = (els: { el: HTMLElement; phase: Exclude<ScenePhase, "idle"> }[]) => {
      let bestPhase: ScenePhase = "idle";
      let best = 0;
      for (const { el, phase } of els) {
        const r = ratios.get(el) ?? 0;
        if (r > best) {
          best = r;
          bestPhase = phase;
        }
      }
      setPhase(best > 0.18 ? bestPhase : "idle");
    };

    const setup = () => {
      if (cancelled) return;
      const els: { el: HTMLElement; phase: Exclude<ScenePhase, "idle"> }[] = [];
      for (const b of bindings) {
        const el = b.ref.current;
        if (!el) {
          raf = requestAnimationFrame(setup);
          return;
        }
        els.push({ el, phase: b.phase });
      }
      const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            ratios.set(e.target, e.intersectionRatio);
          }
          apply(els);
        },
        { threshold: thresholds }
      );
      for (const { el } of els) io.observe(el);
    };

    setup();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPhase]);
}
