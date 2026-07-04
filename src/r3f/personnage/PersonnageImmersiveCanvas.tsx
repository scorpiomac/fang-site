import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import type { MutableRefObject } from "react";
import * as THREE from "three";
import type { Chapter } from "@/content/chapters";
import { Personnage3DContext } from "@/r3f/personnage/Personnage3DContext";
import { PersonnageImmersiveScene } from "@/r3f/personnage/PersonnageImmersiveScene";
import { useMediaQuery } from "@/hooks/useMediaQuery";

import type { PersonnageSceneRef } from "@/r3f/personnage/Personnage3DContext";

type Props = {
  chapter: Chapter;
  scroll01: MutableRefObject<number>;
  scene: MutableRefObject<PersonnageSceneRef>;
  reduced: boolean;
};

export default function PersonnageImmersiveCanvas({ chapter, scroll01, scene, reduced }: Props) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const dpr = useMemo(() => {
    const cap = isMobile ? 1.25 : 1.65;
    return [1, Math.min(window.devicePixelRatio, cap)] as [number, number];
  }, [isMobile]);

  const ctx = useMemo(
    () => ({ scroll01, scene, chapter, reduced }),
    [scroll01, scene, chapter, reduced]
  );

  return (
    <Personnage3DContext.Provider value={ctx}>
      <Canvas
        className="personnage-imm__canvas"
        gl={{ antialias: !isMobile, alpha: false, powerPreference: "high-performance" }}
        dpr={dpr}
        camera={{ position: [0, 0.35, 5.2], fov: 45, near: 0.08, far: 80 }}
        onCreated={({ gl }) => {
          gl.setClearColor("#060504", 1);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.02;
        }}
      >
        <Suspense fallback={null}>
          <PersonnageImmersiveScene urls={chapter.images} />
        </Suspense>
      </Canvas>
    </Personnage3DContext.Provider>
  );
}
