import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function QuietBackdrop() {
  const dust = useRef<THREE.Points>(null);
  const orb = useRef<THREE.Mesh>(null);
  const reduced = useReducedMotion();
  const { pointer } = useThree();

  const dustGeo = useMemo(() => {
    const n = 700;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 18;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 9;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const s = reduced ? 0.2 : 1;
    if (dust.current) dust.current.rotation.y = t * 0.012 * s;
    if (orb.current) {
      orb.current.rotation.y = t * 0.08 * s;
      orb.current.rotation.x = Math.sin(t * 0.18) * 0.12;
    }
    const cam = state.camera as THREE.PerspectiveCamera;
    const tx = pointer.x * 0.18;
    const ty = 0.42 + pointer.y * 0.08;
    cam.position.x = THREE.MathUtils.lerp(cam.position.x, tx, 1 - Math.pow(0.94, delta * 60));
    cam.position.y = THREE.MathUtils.lerp(cam.position.y, ty, 1 - Math.pow(0.94, delta * 60));
    cam.lookAt(0, 0.05, 0);
  });

  return (
    <>
      <color attach="background" args={["#0d0b09"]} />
      <fog attach="fog" args={["#14110f", 5, 22]} />
      <mesh ref={orb} position={[0, 0.1, -1.4]}>
        <icosahedronGeometry args={[1.0, 1]} />
        <meshStandardMaterial
          color="#5c3d1f"
          metalness={0.45}
          roughness={0.55}
          flatShading
        />
      </mesh>
      <points ref={dust} geometry={dustGeo}>
        <pointsMaterial
          size={0.02}
          color="#f2ebe3"
          transparent
          opacity={0.4}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
      <pointLight position={[2, 2, 2]} intensity={0.9} color="#ffd6a8" />
    </>
  );
}
