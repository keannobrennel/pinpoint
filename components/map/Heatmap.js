'use client';

/**
 * Heatmap.js
 *
 * Public-facing severity heatmap layer.
 * Renders a Google Maps HeatmapLayer weighted by averageSeverityScore per zone.
 *
 * Gradient is deliberately blue→red (NOT green/amber/red) to avoid confusion
 * with the ATC-20 verdict color convention used on engineer markers.
 * Blue = low severity density; red = high severity density.
 *
 * This component must always be mounted inside <APIProvider> and <Map> from
 * @vis.gl/react-google-maps. The `google` global is guaranteed available there.
 *
 * Import path for HeatmapLayer is non-obvious — it lives under the
 * /libraries/visualization sub-path, NOT the root package.
 */

import { HeatmapLayer } from '@vis.gl/react-google-maps/libraries/visualization';
import { useMemo } from 'react';

/**
 * Converts a Gemini-assessed severity score (1–10 scale) to a HeatmapLayer
 * weight in the 0–1 range expected by the Maps Visualization Library.
 *
 * A zone with severityScore of 0 contributes no visual weight.
 * A zone with severityScore of 10 renders at full intensity.
 *
 * @param {number} score - averageSeverityScore from Firestore zone document
 * @returns {number} clamped weight 0–1
 */
function severityToWeight(score) {
  return Math.min(1, Math.max(0, (score ?? 0) / 10));
}

/**
 * @param {{ zones: Array<Object> }} props
 *   zones - array of Firestore zone documents from useZones()
 *           Each zone must have: centerCoordinates { lat, lng }, averageSeverityScore
 */
export default function Heatmap({ zones }) {
  /**
   * Build the WeightedLatLng array expected by HeatmapLayer.
   * - Filters out any zone missing coordinates (defensive against schema drift).
   * - Memoized on zones reference — only rebuilds when Firestore pushes an update.
   *
   * NOTE: `new google.maps.LatLng()` is only safe here because this component
   * is always rendered inside APIProvider. Never call this outside that tree.
   */
  const heatmapData = useMemo(() => {
    return zones
      .filter(
        (z) =>
          z.centerCoordinates?.lat != null &&
          z.centerCoordinates?.lng != null
      )
      .map((z) => ({
        location: new google.maps.LatLng(
          z.centerCoordinates.lat,
          z.centerCoordinates.lng
        ),
        weight: severityToWeight(z.averageSeverityScore),
      }));
  }, [zones]);

  // Nothing to render if no zones have coordinates yet
  if (!heatmapData.length) return null;

  return (
    <HeatmapLayer
      data={heatmapData}
      options={{
        /**
         * radius: pixels at the current zoom level. 40px works well at zoom 13
         * (city-level). The design teammate or Kean can tune this post-integration.
         */
        radius: 40,

        /**
         * maxIntensity: 1 pins the color scale at a fixed ceiling.
         * Without this, the API auto-scales based on the highest weight in the
         * current dataset, causing the gradient to shift as reports come in.
         * Fixed scale = consistent visual meaning across sessions.
         */
        maxIntensity: 1,

        opacity: 0.75,

        /**
         * Blue→red gradient. Intentionally different from the ATC-20 verdict
         * palette (green/amber/red on engineer markers). Two separate signals:
         *   - Heatmap color = "how severe is the damage being reported here?"
         *   - Marker color  = "what is the official ATC-20 verdict for this zone?"
         *
         * Transparent at index 0 ensures the map background shows through in
         * areas with no reports.
         */
        gradient: [
          'rgba(0, 255, 255, 0)',   // transparent — no reports / very low severity
          'rgba(0, 255, 255, 1)',   // cyan
          'rgba(0, 191, 255, 1)',   // sky blue
          'rgba(0, 127, 255, 1)',   // blue
          'rgba(0, 63, 255, 1)',
          'rgba(0, 0, 255, 1)',
          'rgba(0, 0, 223, 1)',
          'rgba(0, 0, 191, 1)',
          'rgba(0, 0, 159, 1)',
          'rgba(0, 0, 127, 1)',
          'rgba(63, 0, 91, 1)',
          'rgba(127, 0, 63, 1)',
          'rgba(191, 0, 31, 1)',
          'rgba(255, 0, 0, 1)',     // red — high severity density
        ],
      }}
    />
  );
}
