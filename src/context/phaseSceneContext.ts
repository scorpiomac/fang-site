import { createContext } from "react";
import type { MutableRefObject } from "react";
import type { ScenePhase, SceneScroll } from "@/context/scenePhaseTypes";

export type SceneCtx = {
  phase: ScenePhase;
  setPhase: (p: ScenePhase) => void;
  scrollRef: MutableRefObject<SceneScroll>;
};

export const ScenePhaseContext = createContext<SceneCtx | null>(null);
