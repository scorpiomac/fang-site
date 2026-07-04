import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useScenePhase } from "@/context/useScenePhase";

const PALETTE = [
  new THREE.Color("#7d5c3a"),
  new THREE.Color("#9a7b52"),
  new THREE.Color("#a0341e"),
  new THREE.Color("#3d0a14"),
  new THREE.Color("#5c3d1f"),
  new THREE.Color("#3a261a"),
  new THREE.Color("#c9a66b"),
];

export function GarmentPedestalScene() {
  const group = useRef<THREE.Group>(null);
  const knot = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const dust = useRef<THREE.Points>(null);
  const target = useMemo(() => new THREE.Color(PALETTE[0]), []);
  const current = useMemo(() => new THREE.Color(PALETTE[0]), []);
  const { pointer } = useThree();
  const reduced = useReducedMotion();
  const { scrollRef } = useScenePhase();

  const dustGeo = useMemo(() => {
    const n = 800;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 1.6 + Math.random() * 3;
      const a = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 3;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const s = reduced ? 0.25 : 1;

    const idx = Math.max(0, Math.min(PALETTE.length - 1, scrollRef.current.chapterIndex));
    target.copy(PALETTE[idx]);
    current.lerp(target, 1 - Math.pow(0.92, delta * 60));
    if (knot.current) {
      const m = knot.current.material as THREE.MeshPhysicalMaterial;
      m.color.copy(current);
    }

    group.current.rotation.y += delta * 0.28 * s;
    const tiltX = pointer.y * 0.25;
    const tiltZ = pointer.x * 0.18;
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      tiltX,
      1 - Math.pow(0.9, delta * 60)
    );
    group.current.rotation.z = THREE.MathUtils.lerp(
      group.current.rotation.z,
      tiltZ,
      1 - Math.pow(0.9, delta * 60)
    );

    const phase = scrollRef.current.chapter;
    const morph = 0.85 + Math.sin(t * 0.6) * 0.05 + phase * 0.15;
    group.current.scale.setScalar(morph);

    if (ring.current) ring.current.rotation.z = t * 0.18 * s;
    if (dust.current) dust.current.rotation.y = -t * 0.04 * s;
  });

  return (
    <>
      <color attach="background" args={["#0d0b09"]} />
      <fog attach="fog" args={["#15110d", 5, 22]} />

      <group ref={group} position={[0, 0.25, 0]}>
        <mesh ref={knot}>
          <torusKnotGeometry args={[0.78, 0.26, 220, 32, 2, 3]} />
          <meshPhysicalMaterial
            color="#c9a66b"
            metalness={0.35}
            roughness={0.42}
            clearcoat={0.4}
            clearcoatRoughness={0.5}
            sheen={0.6}
            sheenColor="#f2ebe3"
            sheenRoughness={0.4}
          />
        </mesh>
        <mesh ref={ring} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.45, 0.012, 12, 200]} />
          <meshBasicMaterial color="#c9a66b" transparent opacity={0.55} />
        </mesh>
      </group>

      <points ref={dust} geometry={dustGeo}>
        <pointsMaterial
          size={0.018}
          color="#f2ebe3"
          transparent
          opacity={0.55}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      <mesh position={[0, -0.95, 0]} receiveShadow>
        <cylinderGeometry args={[1.55, 1.7, 0.1, 64]} />
        <meshStandardMaterial color="#1a1612" metalness={0.15} roughness={0.85} />
      </mesh>

      <pointLight position={[2, 2, 2]} intensity={1.4} color="#ffd6a8" />
      <pointLight position={[-2.4, 0.6, -1]} intensity={0.6} color="#a0341e" />
    </>
  );
}
