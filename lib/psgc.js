const BASE_URL = "https://psgc.cloud/api";

const BARANGAYS_BY_CITY_PATH = (cityCode) =>
  `${BASE_URL}/cities/${cityCode}/barangays`;

let citiesCache = null;
const barangaysCache = new Map();

// PSGC codes are prefixed by region — NCR is "13". Confirmed from live
// sample data (e.g. Muntinlupa = "1380800000", Pasay = "1381100000").
const NCR_CODE_PREFIX = "13";

// The API double-encodes non-ASCII characters (e.g. "Parañaque" comes back
// as mojibake: ñ gets UTF-8-encoded, then that byte sequence gets encoded
// again as a JSON string). This reverses it.
function fixMojibake(str) {
  try {
    // Re-interpret the JS string's UTF-16 code units as Latin-1 bytes,
    // then decode those bytes as UTF-8.
    const bytes = Uint8Array.from(str, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return str; // fall back to raw value if decoding fails
  }
}

export async function getNcrCities() {
  if (citiesCache) return citiesCache;

  const res = await fetch(`${BASE_URL}/cities`);
  if (!res.ok) throw new Error(`Failed to fetch cities (${res.status})`);
  const allCities = await res.json();

  const ncrCities = allCities
    .filter((city) => city.code.startsWith(NCR_CODE_PREFIX))
    .map((city) => ({ ...city, name: fixMojibake(city.name) }));

  citiesCache = ncrCities.sort((a, b) => a.name.localeCompare(b.name));
  return citiesCache;
}

export async function getBarangaysForCity(cityCode) {
  if (!cityCode) return [];
  if (barangaysCache.has(cityCode)) return barangaysCache.get(cityCode);

  const res = await fetch(BARANGAYS_BY_CITY_PATH(cityCode));
  if (!res.ok) throw new Error(`Failed to fetch barangays (${res.status})`);
  const raw = await res.json();

  const sorted = raw
    .map((b) => ({ ...b, name: fixMojibake(b.name) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  barangaysCache.set(cityCode, sorted);
  return sorted;
}
