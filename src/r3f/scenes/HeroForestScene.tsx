import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function HeroForestScene() {
  const ribbon = useRef<THREE.Mesh>(null);
  const ribbon2 = useRef<THREE.Mesh>(null);
  const sun = useRef<THREE.Mesh>(null);
  const dust = useRef<THREE.Points>(null);
  const reduced = useReducedMotion();
  const { pointer } = useThree();
  const frame = useRef(0);

  const ribbonGeo = useMemo(() => new THREE.PlaneGeometry(7, 1.6, 36, 8), []);
  const ribbonGeo2 = useMemo(() => new THREE.PlaneGeometry(7.5, 1.1, 36, 6), []);

  const dustGeo = useMemo(() => {
    const count = 420;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const wave = (mesh: THREE.Mesh | null, time: number, freq: number, amp: number) => {
    if (!mesh) return;
    const geo = mesh.geometry as THREE.PlaneGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z =
        Math.sin(x * freq + time) * amp +
        Math.cos(y * freq * 1.6 + time * 0.7) * amp * 0.55;
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
  };

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const speed = reduced ? 0.2 : 1;
    wave(ribbon.current, t * 0.9 * speed, 0.7, 0.32);
    wave(ribbon2.current, t * 1.2 * speed + 1.4, 0.55, 0.22);

    frame.current += 1;
    if (frame.current % 4 === 0) {
      if (ribbon.current) {
        (ribbon.current.geometry as THREE.PlaneGeometry).computeVertexNormals();
      }
      if (ribbon2.current) {
        (ribbon2.current.geometry as THREE.PlaneGeometry).computeVertexNormals();
      }
    }

    if (ribbon.current) ribbon.current.rotation.z = Math.sin(t * 0.18) * 0.06;
    if (ribbon2.current) ribbon2.current.rotation.z = -Math.sin(t * 0.13 + 1) * 0.06;
    if (sun.current) {
      sun.current.position.y = 0.6 + Math.sin(t * 0.25) * 0.05;
    }
    if (dust.current) dust.current.rotation.y = t * 0.02 * speed;
    const cam = state.camera as THREE.PerspectiveCamera;
    const targetX = pointer.x * 0.55;
    const targetY = 0.4 + pointer.y * 0.18;
    cam.position.x = THREE.MathUtils.lerp(cam.position.x, targetX, 1 - Math.pow(0.92, delta * 60));
    cam.position.y = THREE.MathUtils.lerp(cam.position.y, targetY, 1 - Math.pow(0.92, delta * 60));
    cam.lookAt(0, 0.05, 0);
  });

  return (
    <>
      <color attach="background" args={["#0d0b09"]} />
      <fog attach="fog" args={["#1a1612", 4, 18]} />

      <mesh ref={sun} position={[0, 0.6, -3.2]}>
        <circleGeometry args={[1.4, 32]} />
        <meshBasicMaterial color="#c9a66b" transparent opacity={0.18} />
      </mesh>

      <mesh ref={ribbon} geometry={ribbonGeo} position={[0, 0.05, -0.6]} rotation={[0, 0, 0]}>
        <meshStandardMaterial
          color="#7d3a1f"
          metalness={0.18}
          roughness={0.55}
          side={THREE.DoubleSide}
          flatShading
        />
      </mesh>
      <mesh ref={ribbon2} geometry={ribbonGeo2} position={[0.2, -0.55, 0.3]}>
        <meshStandardMaterial
          color="#c9a66b"
          metalness={0.32}
          roughness={0.42}
          side={THREE.DoubleSide}
          flatShading
        />
      </mesh>

      <points ref={dust} geometry={dustGeo}>
        <pointsMaterial
          size={0.022}
          color="#f2ebe3"
          transparent
          opacity={0.55}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      <pointLight position={[0, 1.2, 2]} intensity={1.2} color="#ffd6a8" />
      <pointLight position={[-2, -0.5, 1.5]} intensity={0.6} color="#a0341e" />
    </>
  );
}
