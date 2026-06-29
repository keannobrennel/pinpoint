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
 * - Manages selectedZone state and mounts ZoneInfoPanel
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
import ZoneInfoPanel from './ZoneInfoPanel';
import DisasterZoneBanner from './DisasterZoneBanner';

// Public Maps key — safe to expose in the browser bundle.
// Restrict it in Cloud Console to your Vercel domain + localhost.
const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Map ID is required for AdvancedMarker (engineer pin layer).
// Without it, AdvancedMarker logs an error and falls back to legacy markers.
// Create one at: Cloud Console → Maps Management → Create Map ID
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

/**
 * Subtle map style — reduces visual noise (POI icons, transit labels, road
 * icons) so the heatmap layer reads clearly without competing elements.
 * The design teammate can extend this if they want a dark-mode or custom
 * base map later.
 */
const MAP_STYLES = [
  // Hide all POI labels (restaurants, shops, etc.) — they clutter the heatmap area
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  // Hide transit labels (bus stops, train stations) — not relevant to hazard context
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  // Hide road icon labels (speed cameras, etc.) — reduces clutter
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
   * State lives here (not in page.js) because only MapView and its children
   * need it. Avoids unnecessary re-renders of the parent page component.
   */
  const [selectedZone, setSelectedZone] = useState(null);

  const handleZoneSelect = useCallback((zone) => {
    setSelectedZone(zone);
  }, []);

  /**
   * handleClosePanel is attached to both:
   * 1. ZoneInfoPanel's onClose button
   * 2. The <Map> onClick (tapping the map background dismisses the panel)
   */
  const handleClosePanel = useCallback(() => {
    setSelectedZone(null);
  }, []);

  return (
    <APIProvider
      apiKey={MAPS_API_KEY}
      /**
       * libraries: ['visualization'] appends &libraries=visualization to the
       * Maps SDK script URL, which is what loads HeatmapLayer support.
       * This is separate from enabling the Visualization API in Cloud Console —
       * BOTH are required. The Cloud Console toggle is a one-time admin step.
       */
      libraries={['visualization']}
    >
      {/*
        position:relative wrapper — the info panel and disaster banner use
        position:absolute relative to this container, not to the viewport.
        width/height:100% fills the parent (which is 100vw × 100dvh in page.js).
      */}
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>

        {/* ── Disaster Mode Banner ─────────────────────────────────────────── */}
        {/*
          Rendered above the Map but inside this container.
          Visible to all users (public + engineer) when any zone is in disaster mode.
          The design teammate's top chrome (logo, greeting) should stack below this.
        */}
        <DisasterZoneBanner zones={zones} />

        {/* ── Map Canvas ───────────────────────────────────────────────────── */}
        <Map
          /**
           * mapId: required for AdvancedMarker (engineer layer).
           * Safe to be undefined for public-only sessions (heatmap still works).
           * If mapId is missing and isEngineer=true, a console warning appears.
           */
          mapId={MAP_ID}
          defaultCenter={userLocation}
          defaultZoom={defaultZoom}
          style={{ width: '100%', height: '100%' }}
          /**
           * gestureHandling: "greedy" — essential for mobile UX.
           * Default behaviour requires two fingers to pan a map embedded in a
           * scrollable page. This is a full-screen map app, so single-finger
           * pan is correct. Without this, mobile users can't pan the map.
           */
          gestureHandling="greedy"
          /**
           * disableDefaultUI: removes zoom controls, street view pegman,
           * fullscreen button. Gives the design teammate a clean canvas.
           * Google logo (bottom-left) remains — required by Maps ToS.
           */
          disableDefaultUI={true}
          /**
           * clickableIcons: false — prevents Google's built-in POI info windows
           * from opening when a user taps a restaurant or landmark.
           * Without this, POI taps would fight with our ZoneInfoPanel.
           */
          clickableIcons={false}
          mapTypeId="roadmap"
          styles={MAP_STYLES}
          /**
           * onClick on the Map background closes the info panel.
           * AdvancedMarker onClick events do NOT bubble up to the Map,
           * so this fires only on genuine background taps.
           */
          onClick={handleClosePanel}
        >
          {/* ── Public Heatmap Layer ──────────────────────────────────────── */}
          {/*
            Always rendered. Shows severity density to all visitors.
            Reads from zones[].averageSeverityScore via Heatmap.js.
          */}
          <Heatmap zones={zones} />

          {/* ── Engineer Pin Layer ────────────────────────────────────────── */}
          {/*
            Only mounted when the logged-in user has role=engineer or role=admin.
            Shows AdvancedMarker pins colored by officialVerdict.
            Public visitors see only the heatmap above.
          */}
          {isEngineer && (
            <ZoneMarkers
              zones={zones}
              onZoneSelect={handleZoneSelect}
            />
          )}
        </Map>

        {/* ── Zone Info Panel ───────────────────────────────────────────────── */}
        {/*
          Renders outside <Map> but inside the position:relative wrapper.
          This is intentional — it overlays the map surface from the bottom.
          Mounting it inside <Map> would cause Google Maps to interfere with
          its positioning.
        */}
        <ZoneInfoPanel
          zone={selectedZone}
          onClose={handleClosePanel}
        />
      </div>
    </APIProvider>
  );
}
