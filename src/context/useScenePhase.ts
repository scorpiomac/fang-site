import { useContext } from "react";
import { ScenePhaseContext, type SceneCtx } from "@/context/phaseSceneContext";

export function useScenePhase(): SceneCtx {
  const v = useContext(ScenePhaseContext);
  if (!v) throw new Error("useScenePhase must be used within ScenePhaseProvider");
  return v;
}
