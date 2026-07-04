import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { usePersonnage3D } from "@/r3f/personnage/Personnage3DContext";

function parseHex(hex: string): THREE.Color {
  return new THREE.Color(hex.startsWith("#") ? hex : `#${hex}`);
}

/** Poussière légère — arrière-plan documentaire, pas une scène narrative 3D */
function DustField() {
  const pts = useRef<THREE.Points>(null);
  const { scroll01, reduced, chapter } = usePersonnage3D();
  const c1 = useMemo(() => parseHex(chapter.palette[0] ?? "#3a261a"), [chapter.palette]);
  const geo = useMemo(() => {
    const count = 520;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.5 + Math.random() * 6;
      const t = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 4;
      pos[i * 3] = Math.cos(t) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(t) * r;
      const mix = Math.random();
      const tmp = new THREE.Color().copy(c1).lerp(new THREE.Color("#f2ebe3"), mix * 0.25);
      col[i * 3] = tmp.r;
      col[i * 3 + 1] = tmp.g;
      col[i * 3 + 2] = tmp.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [c1]);

  useFrame((_, delta) => {
    if (!pts.current) return;
    const s = scroll01.current;
    const spd = reduced ? 0.02 : 0.05;
    pts.current.rotation.y += delta * spd * (0.25 + s * 0.35);
  });

  return (
    <points ref={pts} geometry={geo}>
      <pointsMaterial vertexColors size={0.014} transparent opacity={0.28} depthWrite={false} sizeAttenuation />
    </points>
  );
}

function SoftHalo() {
  const mesh = useRef<THREE.Mesh>(null);
  const { chapter, reduced, scroll01 } = usePersonnage3D();
  const c2 = useMemo(() => parseHex(chapter.palette[1] ?? "#7d5c3a"), [chapter.palette]);
  const c3 = useMemo(() => parseHex(chapter.palette[2] ?? "#c4b6a3"), [chapter.palette]);
  const mixCol = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime * 0.04;
    const breathe = 0.92 + Math.sin(t) * 0.04;
    const s = scroll01.current;
    const pulse = breathe + s * 0.06;
    mesh.current.scale.setScalar(pulse);
    if (!reduced) {
      mesh.current.rotation.y += delta * 0.04;
    }
    const m = mesh.current.material as THREE.MeshBasicMaterial;
    m.opacity = 0.08 + s * 0.07;
    mixCol.copy(c2).lerp(c3, (Math.sin(t * 0.7) + 1) * 0.25);
    m.color.copy(mixCol);
  });

  return (
    <mesh ref={mesh} position={[0, 0.2, 0]}>
      <sphereGeometry args={[1.15, 24, 24]} />
      <meshBasicMaterial color={c2} transparent opacity={0.1} depthWrite={false} />
    </mesh>
  );
}

function Rig() {
  const { camera } = useThree();
  const { scroll01 } = usePersonnage3D();

  useFrame((_, delta) => {
    const s = scroll01.current;
    const z = THREE.MathUtils.lerp(7.2, 5.4, s);
    const y = THREE.MathUtils.lerp(0.55, 0.42, s);
    const x = Math.sin(s * Math.PI) * 0.12;
    camera.position.lerp(new THREE.Vector3(x, y, z), 1 - Math.pow(0.92, delta * 60));
    camera.lookAt(0, 0.1, 0);
  });

  return null;
}

function SceneAtmosphere() {
  const fogRef = useRef<THREE.Fog>(null);
  const { scroll01, chapter } = usePersonnage3D();
  const c0 = useMemo(() => parseHex(chapter.palette[0] ?? "#0d0b09"), [chapter.palette]);
  const fogCol = useMemo(() => c0.clone().multiplyScalar(0.28).add(new THREE.Color("#030201")), [c0]);

  useFrame(() => {
    if (!fogRef.current) return;
    const s = scroll01.current;
    fogRef.current.near = THREE.MathUtils.lerp(4.5, 5.8, s);
    fogRef.current.far = THREE.MathUtils.lerp(18, 24, s * 0.6 + 0.2);
  });

  return <fog ref={fogRef} attach="fog" args={[fogCol, 5, 22]} />;
}

export function PersonnageImmersiveScene({ urls }: { urls: string[] }) {
  void urls;
  const { chapter } = usePersonnage3D();
  const c0 = useMemo(() => parseHex(chapter.palette[0] ?? "#0d0b09"), [chapter.palette]);

  return (
    <>
      <color attach="background" args={[c0.getHexString()]} />
      <SceneAtmosphere />
      <ambientLight intensity={0.14} />
      <directionalLight position={[4, 5, 3]} intensity={0.55} color="#c9a882" />
      <directionalLight position={[-3, 1, -2]} intensity={0.22} color={parseHex(chapter.palette[1] ?? "#5c3d1f")} />

      <Suspense fallback={null}>
        <DustField />
        <SoftHalo />
      </Suspense>

      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[9, 48]} />
        <meshStandardMaterial color="#050403" metalness={0.12} roughness={0.97} />
      </mesh>

      <Rig />
    </>
  );
}
