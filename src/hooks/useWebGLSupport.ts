import { useState } from "react";

function probeWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function useWebGLSupport(): boolean {
  const [supported] = useState(() => probeWebGL());
  return supported;
}
