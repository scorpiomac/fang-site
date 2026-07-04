import { useCallback, useEffect, useRef, useState } from "react";
import {
  type DetectedLocation,
  type LocationWatchHandle,
  watchUserLocation,
} from "@/lib/geolocation";

type Status = "idle" | "locating" | "watching";

type Options = {
  enabled: boolean;
  onUpdate: (location: DetectedLocation) => void;
};

function geolocationErrorMessage(error: GeolocationPositionError | Error): string {
  if (error instanceof GeolocationPositionError) {
    if (error.code === error.PERMISSION_DENIED) {
      return "Autorisez la localisation dans votre navigateur.";
    }
    if (error.code === error.TIMEOUT) {
      return "Délai dépassé — nouvelle tentative en cours…";
    }
    return "Impossible d'obtenir votre position.";
  }
  return error.message;
}

export function useDynamicLocation({ enabled, onUpdate }: Options) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const handleRef = useRef<LocationWatchHandle | null>(null);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const stop = useCallback(() => {
    handleRef.current?.stop();
    handleRef.current = null;
    setStatus("idle");
  }, []);

  const start = useCallback(() => {
    stop();
    setMessage("Détection de votre position…");

    const handle = watchUserLocation({
      onUpdate: (location) => {
        onUpdateRef.current(location);
        setMessage("Position mise à jour automatiquement.");
      },
      onError: (error) => {
        setMessage(geolocationErrorMessage(error));
      },
      onStatus: (next) => {
        setStatus(next);
      },
    });

    handleRef.current = handle;
    if (!handle) {
      setMessage("La géolocalisation n'est pas disponible sur cet appareil.");
    }
  }, [stop]);

  const refresh = useCallback(() => {
    if (handleRef.current) {
      setMessage("Actualisation de la position…");
      handleRef.current.refresh();
      return;
    }
    start();
  }, [start]);

  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }
    start();
    return stop;
  }, [enabled, start, stop]);

  return {
    locating: status === "locating",
    watching: status === "watching",
    message,
    refresh,
    restart: start,
  };
}
