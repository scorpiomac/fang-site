export type DetectedLocation = {
  city: string;
  country: string;
};

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  country?: string;
};

function parseNominatimAddress(address: NominatimAddress): DetectedLocation {
  const city =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.state ??
    "";
  const country = address.country ?? "";
  return { city, country };
}

export async function reverseGeocodeCoords(
  latitude: number,
  longitude: number
): Promise<DetectedLocation> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("format", "json");
  url.searchParams.set("accept-language", "fr");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error("Impossible de déterminer votre adresse.");
  }

  const data = (await res.json()) as { address?: NominatimAddress };
  const detected = parseNominatimAddress(data.address ?? {});

  if (!detected.city && !detected.country) {
    throw new Error("Position détectée, mais ville ou pays introuvable.");
  }

  return detected;
}

export async function detectUserLocation(): Promise<DetectedLocation> {
  if (!navigator.geolocation) {
    throw new Error("La géolocalisation n'est pas disponible sur cet appareil.");
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });

  return reverseGeocodeCoords(position.coords.latitude, position.coords.longitude);
}

type WatchOptions = {
  onUpdate: (location: DetectedLocation) => void;
  onError?: (error: GeolocationPositionError | Error) => void;
  onStatus?: (status: "locating" | "watching" | "idle") => void;
  minDistanceM?: number;
  debounceMs?: number;
};

function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

export type LocationWatchHandle = {
  stop: () => void;
  refresh: () => void;
};

export function watchUserLocation(options: WatchOptions): LocationWatchHandle | null {
  if (!navigator.geolocation) {
    options.onError?.(new Error("La géolocalisation n'est pas disponible sur cet appareil."));
    options.onStatus?.("idle");
    return null;
  }

  const minDistanceM = options.minDistanceM ?? 150;
  const debounceMs = options.debounceMs ?? 600;
  let watchId: number | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastCoords: { lat: number; lon: number } | null = null;
  let pending = false;

  const clearDebounce = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };

  const resolvePosition = async (latitude: number, longitude: number) => {
    if (pending) return;
    pending = true;
    try {
      const detected = await reverseGeocodeCoords(latitude, longitude);
      options.onUpdate(detected);
      options.onStatus?.("watching");
    } catch (err) {
      options.onError?.(err instanceof Error ? err : new Error("Détection impossible."));
    } finally {
      pending = false;
    }
  };

  const handlePosition = (position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords;

    if (lastCoords) {
      const moved = distanceMeters(
        lastCoords.lat,
        lastCoords.lon,
        latitude,
        longitude
      );
      if (moved < minDistanceM) return;
    }

    lastCoords = { lat: latitude, lon: longitude };
    clearDebounce();
    debounceTimer = setTimeout(() => {
      void resolvePosition(latitude, longitude);
    }, debounceMs);
  };

  const handleError = (error: GeolocationPositionError) => {
    options.onStatus?.("idle");
    options.onError?.(error);
  };

  const start = () => {
    if (watchId != null) {
      navigator.geolocation.clearWatch(watchId);
    }
    lastCoords = null;
    options.onStatus?.("locating");
    watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 5000,
    });
  };

  start();

  return {
    stop: () => {
      clearDebounce();
      if (watchId != null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      options.onStatus?.("idle");
    },
    refresh: () => {
      clearDebounce();
      lastCoords = null;
      options.onStatus?.("locating");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handlePosition(position);
          options.onStatus?.("watching");
        },
        handleError,
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    },
  };
}
