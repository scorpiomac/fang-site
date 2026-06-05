import { createContext, useContext } from "react";
import type { MutableRefObject } from "react";
import type { Chapter } from "@/content/chapters";

export type PersonnageSceneRef = {
  /** 0..6 — sept panneaux narratifs */
  index: number;
  /** 0..1 progression dans le panneau courant */
  local: number;
};

export type Personnage3DContextValue = {
  scroll01: MutableRefObject<number>;
  scene: MutableRefObject<PersonnageSceneRef>;
  chapter: Chapter;
  reduced: boolean;
};

const Personnage3DContext = createContext<Personnage3DContextValue | null>(null);

export function usePersonnage3D() {
  const v = useContext(Personnage3DContext);
  if (!v) throw new Error("usePersonnage3D must be used inside Personnage3DContext.Provider");
  return v;
}

export { Personnage3DContext };
