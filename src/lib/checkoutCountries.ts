import type { ShippingZoneOption } from "@/lib/storeApi";

const BASE_COUNTRIES = [
  "Sénégal",
  "France",
  "Côte d'Ivoire",
  "Mali",
  "Mauritanie",
  "Guinée",
  "Gambie",
  "Maroc",
  "Belgique",
  "Canada",
  "États-Unis",
  "Royaume-Uni",
  "Allemagne",
  "Espagne",
  "Italie",
  "Portugal",
  "Pays-Bas",
  "Suisse",
  "Cameroun",
  "Gabon",
  "Bénin",
  "Togo",
  "Burkina Faso",
  "Niger",
  "République démocratique du Congo",
  "Congo",
  "Madagascar",
  "Tunisie",
  "Algérie",
  "Émirats arabes unis",
];

function normalizeCountry(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function buildCountryOptions(zones: ShippingZoneOption[]): string[] {
  const fromZones = zones.flatMap((z) => z.countries);
  const merged = [...BASE_COUNTRIES, ...fromZones];
  const seen = new Set<string>();
  const out: string[] = [];

  for (const name of merged) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const key = normalizeCountry(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }

  return out.sort((a, b) => a.localeCompare(b, "fr"));
}

export function parseCountriesInput(value: string): string[] {
  const parts = value
    .split(/[,;|]/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : ["Sénégal"];
}

export function formatCountriesInput(countries: string[]): string {
  return countries.filter(Boolean).join(", ");
}

export function matchCountryOption(detected: string, options: string[]): string | null {
  const key = normalizeCountry(detected);
  const exact = options.find((o) => normalizeCountry(o) === key);
  if (exact) return exact;

  const partial = options.find(
    (o) => normalizeCountry(o).includes(key) || key.includes(normalizeCountry(o))
  );
  return partial ?? (detected.trim() || null);
}

export function primaryCountryForShipping(countries: string[]): string {
  return countries[0]?.trim() || "Sénégal";
}
