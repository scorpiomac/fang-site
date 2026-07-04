import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import type { ScenePhase, SceneScroll } from "@/context/scenePhaseTypes";
import { ScenePhaseContext } from "@/context/phaseSceneContext";

export function ScenePhaseProvider({ children }: { children: ReactNode }) {
  const [phase, setPhaseState] = useState<ScenePhase>("hero");
  const setPhase = useCallback((p: ScenePhase) => setPhaseState(p), []);
  const scrollRef = useRef<SceneScroll>({ total: 0, chapter: 0, chapterIndex: 0 });

  const value = useMemo(
    () => ({ phase, setPhase, scrollRef }),
    [phase, setPhase]
  );

  return <ScenePhaseContext.Provider value={value}>{children}</ScenePhaseContext.Provider>;
}
