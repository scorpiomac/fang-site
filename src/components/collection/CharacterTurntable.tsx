import { useEffect, useMemo, useState } from "react";
import { publicUrl } from "@/lib/publicUrl";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Props = {
  framePath: (index: number) => string;
  frameCount: number;
  name: string;
  className?: string;
  /** ms between frames — défaut ~ vidéo 10s / 12 frames */
  intervalMs?: number;
};

/**
 * Rotation 3D type turntable : enchaîne les frames extraites du clip.
 */
export function CharacterTurntable({
  framePath,
  frameCount,
  name,
  className = "",
  intervalMs = 480,
}: Props) {
  const reduced = useReducedMotion();
  const [frame, setFrame] = useState(0);
  const clipKey = useMemo(() => framePath(0), [framePath]);

  useEffect(() => {
    setFrame(0);
  }, [clipKey]);

  useEffect(() => {
    if (reduced || frameCount < 2) return;
    const id = window.setInterval(() => {
      setFrame((f) => (f + 1) % frameCount);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [reduced, frameCount, intervalMs, clipKey]);

  useEffect(() => {
    if (frameCount < 2) return;
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = publicUrl(framePath(i));
    }
  }, [frameCount, framePath, clipKey]);

  const src = publicUrl(framePath(reduced ? 0 : frame));

  return (
    <img
      src={src}
      alt={`Modèle 3D — ${name}`}
      className={className}
      loading="eager"
      decoding="async"
      draggable={false}
    />
  );
}
