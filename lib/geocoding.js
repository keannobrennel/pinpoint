/**
 * Client-side reverse geocoding utility with in-memory cache.
 *
 * Calls the internal /api/geocode proxy route (which keeps the Maps API key
 * server-side) and caches results in module scope for the page lifetime.
 * The cache resets on page reload — no stale data concerns.
 *
 * Usage:
 *   const name = await reverseGeocode(14.5995, 120.9842);
 *   // → "Mabini St, Tondo" (or similar readable street-level name)
 */

// Module-scope cache: "lat,lng" → resolved name string
const geocodeCache = new Map();

/**
 * Returns a human-readable location name for a lat/lng coordinate pair.
 * Results are cached to prevent repeated calls for the same zone.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<string>} Human-readable area name, e.g. "Mabini St, Tondo"
 */
export async function reverseGeocode(lat, lng) {
  // Round to 5 decimal places (~1m precision) as the cache key.
  // This deduplies calls for the same zone even if floating point
  // representation differs slightly across renders.
  const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  try {
    const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);

    if (!res.ok) {
      throw new Error(`Geocode API responded with ${res.status}`);
    }

    const data = await res.json();
    const name = data.name || 'Unknown Area';

    geocodeCache.set(cacheKey, name);
    return name;
  } catch (err) {
    console.error('[reverseGeocode] Failed:', err);
    // Fallback: truncated coordinates so the UI never shows "undefined"
    return `Zone ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
