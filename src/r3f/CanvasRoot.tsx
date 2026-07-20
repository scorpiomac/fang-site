import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { useScenePhase } from "@/context/useScenePhase";
import { HeroForestScene } from "@/r3f/scenes/HeroForestScene";
import { GarmentPedestalScene } from "@/r3f/scenes/GarmentPedestalScene";
import { QuietBackdrop } from "@/r3f/scenes/QuietBackdrop";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function CanvasRoot() {
  const { phase } = useScenePhase();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const dpr = useMemo(() => {
    const cap = isMobile ? 1.35 : 1.85;
    return [1, Math.min(window.devicePixelRatio, cap)] as [number, number];
  }, [isMobile]);

  const useHero = phase === "hero" || phase === "story";
  const useGarment = phase === "chapters" || phase === "creator";
  const useQuiet = phase === "manifest" || phase === "idle";
  // En phase "hero", le canvas est masqué par la vidéo (.canvas-layer--hero-video) :
  // inutile de rendre la scène 3D derrière, on économise le GPU.
  const animating = phase !== "idle" && phase !== "hero";

  return (
    <Canvas
      className="r3f-canvas"
      gl={{ antialias: !isMobile, alpha: false, powerPreference: "high-performance" }}
      dpr={dpr}
      frameloop={animating ? "always" : "never"}
      camera={{ position: [0, 0.42, 4.1], fov: 42, near: 0.1, far: 60 }}
      onCreated={({ gl }) => {
        gl.setClearColor("#0d0b09", 1);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <ambientLight intensity={0.32} />
      <directionalLight position={[4.5, 6, 3]} intensity={1.05} color="#ffd6a8" />
      <directionalLight position={[-3.5, 1.8, -2.2]} intensity={0.32} color="#5c6b78" />
      <Suspense fallback={null}>
        {useHero && <HeroForestScene />}
        {useGarment && <GarmentPedestalScene />}
        {useQuiet && <QuietBackdrop />}
      </Suspense>
      <Preload all />
    </Canvas>
  );
}
