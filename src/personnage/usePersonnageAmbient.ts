import { useCallback, useEffect, useRef, useState } from "react";

const TARGET = 0.52;

/**
 * Drone discret (sine + bruit) — volume très bas, déclenché après geste utilisateur.
 */
export function usePersonnageAmbient() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<{ stop: () => void } | null>(null);
  const [audible, setAudible] = useState(false);

  const teardown = useCallback(() => {
    nodesRef.current?.stop();
    nodesRef.current = null;
    const ctx = ctxRef.current;
    if (ctx && ctx.state !== "closed") {
      ctx.close().catch(() => {});
    }
    ctxRef.current = null;
    masterRef.current = null;
    setAudible(false);
  }, []);

  const applyGain = useCallback((muted: boolean) => {
    const m = masterRef.current;
    const ctx = ctxRef.current;
    if (!m || !ctx) return;
    const t = ctx.currentTime;
    m.gain.cancelScheduledValues(t);
    m.gain.linearRampToValueAtTime(muted ? 0 : TARGET, t + 0.4);
    setAudible(!muted);
  }, []);

  const start = useCallback(() => {
    const Ctx =
      typeof window !== "undefined"
        ? window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined;
    if (!Ctx) return;

    teardown();
    const ctx = new Ctx();
    ctxRef.current = ctx;
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    masterRef.current = master;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(68, ctx.currentTime);
    const og = ctx.createGain();
    og.gain.value = 0.018;
    osc.connect(og);
    og.connect(master);

    const len = Math.floor(ctx.sampleRate * 2);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      ch[i] = (Math.random() * 2 - 1) * 0.08;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const ng = ctx.createGain();
    ng.gain.value = 0.035;
    noise.connect(ng);
    ng.connect(master);

    osc.start();
    noise.start();

    const t0 = ctx.currentTime;
    master.gain.linearRampToValueAtTime(TARGET, t0 + 2.2);

    nodesRef.current = {
      stop: () => {
        try {
          osc.stop();
          noise.stop();
        } catch {
          /* noop */
        }
      },
    };

    setAudible(true);
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  }, [teardown]);

  const toggle = useCallback(() => {
    if (!ctxRef.current || !masterRef.current) {
      start();
      return;
    }
    const g = masterRef.current.gain.value;
    applyGain(g > 0.04);
  }, [applyGain, start]);

  useEffect(() => () => teardown(), [teardown]);

  return { audible, start, toggle, stop: teardown, applyGain };
}
