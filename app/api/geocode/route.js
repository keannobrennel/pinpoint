import { NextResponse } from 'next/server';

const GEOCODING_BASE = 'https://maps.googleapis.com/maps/api/geocode/json';

/**
 * GET /api/geocode?lat={lat}&lng={lng}
 *
 * Server-side reverse geocoding proxy. Keeps the Maps API key out of the
 * browser bundle by calling Google's Geocoding API from the server.
 *
 * TODO: Replace NEXT_PUBLIC_GOOGLE_MAPS_API_KEY with a server-only
 * GOOGLE_MAPS_API_KEY once it has been created in GCP and added to
 * .env.local. The server-only key should have HTTP referrer restrictions
 * removed (since it's called from Vercel, not a browser) and instead use
 * IP restrictions or API-key-level restrictions.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'lat and lng query parameters are required' },
      { status: 400 }
    );
  }

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);

  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    return NextResponse.json(
      { error: 'lat and lng must be valid numbers' },
      { status: 400 }
    );
  }

  // TODO: Swap to process.env.GOOGLE_MAPS_API_KEY (server-only, no NEXT_PUBLIC_)
  // once a dedicated server-side key exists in .env.local.
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('[/api/geocode] Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
    return NextResponse.json({ name: 'Unknown Area' });
  }

  // result_type filter biases Google toward street-level results.
  // Without it, the API may return "Metro Manila" for coordinates that
  // have a perfectly fine street address — too generic to be useful.
  const url =
    `${GEOCODING_BASE}` +
    `?latlng=${parsedLat},${parsedLng}` +
    `&key=${apiKey}` +
    `&result_type=street_address|premise|neighborhood|sublocality`;

  try {
    const res = await fetch(url, {
      // Cache geocoding results at the edge for 1 hour.
      // Zone centroids don't move — caching this aggressively is safe
      // and reduces Geocoding API billing costs.
      next: { revalidate: 3600 },
    });

    const data = await res.json();

    if (data.status !== 'OK' || !data.results?.length) {
      // Soft fallback — return truncated coordinates rather than erroring
      const fallback = `Zone ${lat.slice(0, 7)}, ${lng.slice(0, 8)}`;
      return NextResponse.json({ name: fallback });
    }

    const name = extractBestName(data.results);
    return NextResponse.json({ name });
  } catch (err) {
    console.error('[/api/geocode] Geocoding request failed:', err);
    return NextResponse.json({ name: 'Unknown Area' });
  }
}

/**
 * Extracts the most human-readable short name from a Google Geocoding
 * results array.
 *
 * Priority: street address with sublocality → sublocality + city → city only.
 * Avoids returning the full formatted address (which includes country, postal
 * code, etc. that clutter the UI).
 *
 * @param {Array} results - Google Geocoding API results array
 * @returns {string}
 */
function extractBestName(results) {
  // Prefer the most specific result type available
  const streetResult = results.find(
    (r) => r.types.includes('street_address') || r.types.includes('premise')
  );
  const target = streetResult || results[0];

  const components = target.address_components;

  const get = (type) =>
    components.find((c) => c.types.includes(type))?.long_name;

  const route = get('route');
  const sublocality =
    get('sublocality_level_1') || get('sublocality');
  const city = get('locality');

  // Build the shortest readable label that still conveys location:
  // "Mabini St, Tondo" is more useful than the full formatted address.
  if (route && sublocality) return `${route}, ${sublocality}`;
  if (sublocality && city) return `${sublocality}, ${city}`;
  if (city) return city;

  // Last resort: first two comma-separated parts of the formatted address
  return target.formatted_address.split(',').slice(0, 2).join(',').trim();
}
