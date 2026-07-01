'use client';

/**
 * BoundaryOverlay.js
 *
 * Draws REAL administrative boundary polygons on the map and shades them
 * by the active City/Barangay filter — this is the "divide the map by
 * filter" piece.
 *
 * Data source: faeldon/philippines-json-maps (MIT licensed), which
 * publishes ready-made GeoJSON derived from the official PSGC shapefiles
 * (altcoder/philippines-psgc-shapefiles), fetched directly from
 * raw.githubusercontent.com — no backend route needed.
 *
 * IMPORTANT — why this is keyed by CITY, not barangay or "all of NCR":
 * The dataset only ships one barangay-boundary file PER CITY/MUNICIPALITY,
 * named by that city's 10-digit PSGC code:
 *
 *   2023/geojson/municities/lowres/bgysubmuns-municity-{cityPsgcCode}.0.001.json
 *
 * Each file is a FeatureCollection of every barangay polygon inside that
 * one city. Verified sample properties (fetched live):
 *   { adm1_psgc, adm2_psgc, adm3_psgc, adm4_psgc, adm4_en, geo_level: "Bgy", ... }
 *   adm3_psgc — the city's PSGC code (matches lib/psgc.js's city.code)
 *   adm4_psgc — the barangay's PSGC code (matches lib/psgc.js's barangay.code)
 *   adm4_en   — the barangay's name (fallback match key, in case of any
 *               code-format drift between this dataset's PSGC snapshot and
 *               psgc.cloud's)
 *
 * So: selecting a CITY loads + draws that city's barangay polygons.
 * Selecting a BARANGAY within it just re-styles (highlights) the matching
 * polygon — no second fetch needed.
 *
 * Must be rendered as a child of <Map> (uses useMap()).
 */

import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

const BOUNDARY_URL = (cityPsgcCode) =>
  `https://raw.githubusercontent.com/faeldon/philippines-json-maps/master/2023/geojson/municities/lowres/bgysubmuns-municity-${cityPsgcCode}.0.001.json`;

// Module-scope cache: cityPsgcCode -> Promise<GeoJSON|null>.
// Re-selecting a city already viewed this session is instant and free.
const geojsonCache = new Map();

// Distinct from the heatmap's safe/caution/dangerous palette so boundary
// lines are never mistaken for hazard severity.
//
// Softened per design feedback — these were originally much heavier
// (0.5 stroke opacity, 1px weight, fully opaque selected outline), which
// read as harsh grid lines competing with the heatmap/pins underneath.
// Values below keep the divisions legible without dominating the map.
const CITY_FILL_COLOR = '#2a6697';
const CITY_FILL_OPACITY = 0.05;
const CITY_STROKE_COLOR = '#2a6697';
const CITY_STROKE_OPACITY = 0.22;
const CITY_STROKE_WEIGHT = 0.75;

const SELECTED_FILL_COLOR = '#FA6304';
const SELECTED_FILL_OPACITY = 0.22;
const SELECTED_STROKE_COLOR = '#FA6304';
const SELECTED_STROKE_OPACITY = 0.8;
const SELECTED_STROKE_WEIGHT = 1.5;

function loadCityBoundary(cityPsgcCode) {
  if (geojsonCache.has(cityPsgcCode)) return geojsonCache.get(cityPsgcCode);

  const promise = fetch(BOUNDARY_URL(cityPsgcCode))
    .then((res) => {
      if (!res.ok) throw new Error(`Boundary fetch failed (${res.status})`);
      return res.json();
    })
    .then((geojson) => {
      // The source repo returns an empty GeometryCollection (not a 404)
      // for codes it doesn't recognize — treat that the same as "no data".
      if (!geojson?.features?.length) return null;
      return geojson;
    })
    .catch((err) => {
      console.error('[BoundaryOverlay] Failed to load city boundary:', err);
      geojsonCache.delete(cityPsgcCode); // allow retry next time it's selected
      return null;
    });

  geojsonCache.set(cityPsgcCode, promise);
  return promise;
}

/**
 * BoundaryOverlay
 *
 * @param {{
 *   cityCode: string | null,       — selected city's PSGC code (lib/psgc.js)
 *   barangayCode: string | null,   — selected barangay's PSGC code, if any
 *   barangayName: string | null,   — fallback match key (see file header)
 *   onFeatureClick?: (props: Object) => void  — fired with feature properties on click
 * }} props
 */
export default function BoundaryOverlay({ cityCode, barangayCode, barangayName, onFeatureClick }) {
  const map = useMap();
  const dataLayerRef = useRef(null);
  const requestIdRef = useRef(0);

  // (Re)build the Data layer whenever the selected city changes.
  useEffect(() => {
    if (!map || typeof google === 'undefined') return;

    const requestId = ++requestIdRef.current;

    // Clear the previous city's layer immediately so there's no flash of
    // stale boundaries while the new one loads.
    if (dataLayerRef.current) {
      dataLayerRef.current.setMap(null);
      dataLayerRef.current = null;
    }

    if (!cityCode) return;

    const dataLayer = new google.maps.Data({ map });
    dataLayerRef.current = dataLayer;

    if (onFeatureClick) {
      dataLayer.addListener('click', (e) => {
        const props = {};
        e.feature.forEachProperty((value, key) => {
          props[key] = value;
        });
        onFeatureClick(props);
      });
    }

    loadCityBoundary(cityCode).then((geojson) => {
      // Bail if a newer request (different city) has since superseded this one.
      if (requestIdRef.current !== requestId || !geojson) return;

      dataLayer.addGeoJson(geojson);

      // Frame the camera to the loaded city's full extent.
      // Guarded: a handful of entries in this dataset carry a null/empty
      // geometry (e.g. sub-municipality placeholders with no polygon yet),
      // so getGeometry() can legitimately return null per-feature — skip
      // those instead of crashing the whole bounds computation.
      const bounds = new google.maps.LatLngBounds();
      dataLayer.forEach((feature) => {
        const geometry = feature.getGeometry();
        if (geometry) geometry.forEachLatLng((latLng) => bounds.extend(latLng));
      });
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 40);
      }
    });

    return () => {
      dataLayer.setMap(null);
      if (dataLayerRef.current === dataLayer) dataLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, cityCode]);

  // Re-style (not refetch) whenever the selected barangay changes. This is
  // what actually "divides" the visible map: every barangay polygon in the
  // city gets an outline, and the active selection (or, if only a city is
  // chosen with no specific barangay, every polygon in it) is shaded to
  // stand out from the rest.
  useEffect(() => {
    const dataLayer = dataLayerRef.current;
    if (!dataLayer) return;

    dataLayer.setStyle((feature) => {
      const isSelected =
        !barangayCode ||
        String(feature.getProperty('adm4_psgc')) === String(barangayCode) ||
        feature.getProperty('adm4_en') === barangayName;

      return {
        fillColor: isSelected ? SELECTED_FILL_COLOR : CITY_FILL_COLOR,
        fillOpacity: isSelected ? SELECTED_FILL_OPACITY : CITY_FILL_OPACITY,
        strokeColor: isSelected ? SELECTED_STROKE_COLOR : CITY_STROKE_COLOR,
        strokeOpacity: isSelected ? SELECTED_STROKE_OPACITY : CITY_STROKE_OPACITY,
        strokeWeight: isSelected ? SELECTED_STROKE_WEIGHT : CITY_STROKE_WEIGHT,
        clickable: !!onFeatureClick,
        zIndex: isSelected ? 2 : 1,
      };
    });
  }, [barangayCode, barangayName, onFeatureClick]);

  return null;
}