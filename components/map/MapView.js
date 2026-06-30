'use client';

/**
 * MapView.js
 *
 * Orchestrates the entire map surface:
 * - Wraps everything in APIProvider (loads the Maps JS SDK once)
 * - Renders the <Map> canvas with neutral styling
 * - Mounts the public heatmap layer (always visible)
 * - Conditionally mounts the engineer pin layer (isEngineer === true only)
 * - Mounts DisasterZoneBanner (visible to all users when disaster zones exist)
 * - Mounts ZoneLegend (bottom-right safe/caution/dangerous key)
 * - Manages selectedZone state and mounts ZoneDetailDialog
 *
 * selectedZone can now be opened from TWO places:
 * 1. Tapping an engineer-only AdvancedMarker pin (ZoneMarkers.js)
 * 2. Tapping a heatmap blob directly (Heatmap.js onBlobClick — public-visible)
 * Both call the same handleZoneSelect handler so they open the same dialog.
 *
 * This is a CLIENT component. The `google` global is only available after
 * APIProvider has injected the Maps SDK script — all child components that
 * use it must be rendered inside this tree.
 *
 * ENVIRONMENT VARIABLES REQUIRED in .env.local:
 *   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY  — Maps JS API key (browser-safe)
 *   NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID   — Cloud Console Map ID (required for AdvancedMarker)
 *
 * DO NOT use process.env.GOOGLE_MAPS_API_KEY here (server-only key).
 * The server-only key is used exclusively in app/api/geocode/route.js.
 */

import { useState, useCallback } from 'react';
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import Heatmap from './Heatmap';
import ZoneMarkers from './ZoneMarkers';
import ZoneDetailDialog from './ZoneDetailDialog';
import ZoneLegend from './ZoneLegend';
import DisasterZoneBanner from './DisasterZoneBanner';

// Public Maps key — safe to expose in the browser bundle.
// Restrict it in Cloud Console to your Vercel domain + localhost.
const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Map ID is required for AdvancedMarker (engineer pin layer).
// Without it, AdvancedMarker logs an error and falls back to legacy markers.
// Create one at: Cloud Console → Maps Management → Create Map ID
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

// NOTE: `styles` is intentionally NOT passed to <Map> below — Google Maps
// ignores the styles prop whenever a mapId is present (style is controlled
// via Cloud Console instead once a Map ID is set). Keeping MAP_STYLES here
// as reference only, in case mapId is ever removed during local testing.
const MAP_STYLES = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

/**
 * MapView
 *
 * @param {{
 *   zones: Array<Object>,           — Live zone data from useZones()
 *   userLocation: { lat: number, lng: number }, — From useGeolocation() or Metro Manila fallback
 *   defaultZoom: number,            — From useGeolocation() (13 fallback, 14 if GPS granted)
 *   isEngineer: boolean             — Gates the ZoneMarkers engineer layer
 * }} props
 */
export default function MapView({ zones, userLocation, defaultZoom, isEngineer }) {
  /**
   * selectedZone: the zone object the user last tapped on (or null).
   * Shared between pin clicks (ZoneMarkers, engineer-only) and blob clicks
   * (Heatmap, public-visible) — both funnel into the same dialog.
   */
  const [selectedZone, setSelectedZone] = useState(null);

  const handleZoneSelect = useCallback((zone) => {
    setSelectedZone(zone);
  }, []);

  /**
   * handleClosePanel is attached to:
   * 1. ZoneDetailDialog's backdrop/close button
   * 2. The <Map> onClick (tapping the map background dismisses the dialog)
   * 3. Heatmap's canvas click-passthrough when no blob was hit
   */
  const handleClosePanel = useCallback(() => {
    setSelectedZone(null);
  }, []);

  return (
    <APIProvider
      apiKey={MAPS_API_KEY}
      /**
       * libraries: ['visualization'] appends &libraries=visualization to the
       * Maps SDK script URL. Kept even though the custom canvas heatmap no
       * longer uses HeatmapLayer, in case other visualization features are
       * added later — harmless to leave enabled.
       */
      libraries={['visualization']}
    >
      {/*
        position:relative wrapper — the dialog and disaster banner use
        position:absolute/fixed relative to this container or the viewport.
        width/height:100% fills the parent (which is 100vw × 100dvh in page.js).
      */}
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>

        {/* ── Disaster Mode Banner ─────────────────────────────────────────── */}
        <DisasterZoneBanner zones={zones} />

        {/* ── Map Canvas ───────────────────────────────────────────────────── */}
        <Map
          mapId={MAP_ID}
          defaultCenter={userLocation}
          defaultZoom={defaultZoom}
          style={{ width: '100%', height: '100%' }}
          gestureHandling="greedy"
          disableDefaultUI={true}
          clickableIcons={false}
          mapTypeId="roadmap"
          /**
           * onClick on the Map background closes the dialog.
           * AdvancedMarker onClick events do NOT bubble up to the Map, and
           * the heatmap canvas forwards unhandled clicks here too (see
           * Heatmap.js handleCanvasClick), so this covers all three
           * "tap empty space" cases.
           */
          onClick={handleClosePanel}
        >
          {/* ── Public Heatmap Layer ──────────────────────────────────────── */}
          {/*
            Always rendered. Shows severity-sized, verdict-colored blobs to
            all visitors. Clicking directly on a blob opens the same dialog
            as tapping an engineer pin (onBlobClick → handleZoneSelect).
          */}
          <Heatmap zones={zones} onBlobClick={handleZoneSelect} />

          {/* ── Engineer Pin Layer ────────────────────────────────────────── */}
          {/*
            Only mounted when the logged-in user has role=engineer or role=admin.
            Public visitors never see these pins — only the heatmap blobs
            above, which are now clickable too.
          */}
          
          <ZoneMarkers zones={zones} onZoneSelect={handleZoneSelect} />
          
        </Map>

        {/* ── Legend ───────────────────────────────────────────────────────── */}
        <ZoneLegend />

        {/* ── Zone Detail Dialog ───────────────────────────────────────────── */}
        {/*
          Centered modal (replaces the old bottom-sheet ZoneInfoPanel).
          Renders outside <Map> but inside the position:relative wrapper.
        */}
        <ZoneDetailDialog
          zone={selectedZone}
          onClose={handleClosePanel}
        />
      </div>
    </APIProvider>
  );
}