import { useEffect, useRef, useState } from "react";
import { publicUrl } from "@/lib/publicUrl";

export function MusicToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = new Audio(publicUrl("audio/santtana.mp3"));
    el.loop = true;
    el.volume = 0.0;
    el.preload = "none";
    audioRef.current = el;
    return () => {
      el.pause();
      audioRef.current = null;
    };
  }, []);

  const fadeTo = (target: number, duration = 700) => {
    const el = audioRef.current;
    if (!el) return;
    const start = el.volume;
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / duration);
      el.volume = start + (target - start) * k;
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const toggle = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (!ready) setReady(true);
    if (playing) {
      fadeTo(0, 500);
      window.setTimeout(() => el.pause(), 500);
      setPlaying(false);
    } else {
      try {
        await el.play();
        fadeTo(0.55, 900);
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    }
  };

  return (
    <button
      type="button"
      className={`music-toggle ${playing ? "music-toggle--on" : ""}`}
      onClick={toggle}
      aria-pressed={playing}
      aria-label={playing ? "Couper la bande-son" : "Activer la bande-son"}
      title="Bande-son — Santtana"
      disabled={false}
    >
      <span className="music-toggle__bars" aria-hidden="true">
        <span /><span /><span /><span />
      </span>
      <span className="music-toggle__label">{playing ? "Son" : "Son"}</span>
    </button>
  );
}
