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
 * - Mounts ZoneLegend (bottom-right safe/caution/dangerous key by default;
 *   pass legendPosition="top-right" for the full /map page)
 * - Mounts ZoneDetailDialog, now CONTROLLED from the parent (page.js)
 * - Mounts MapController, which pans/zooms the map when `focusZone` changes
 * - Optionally mounts BoundaryOverlay (City/Barangay polygon divisions) and
 *   LocateButton (target icon → user's GPS position), both opt-in via props
 *   so the home page's map is completely unaffected unless it asks for them.
 *
 * selectedZone is no longer local state — it's lifted to page.js so that
 * tapping "View More" on a NearbyAlertsPage card can open the exact same
 * dialog instance that map pin/blob taps open. Two entry points, one dialog:
 * 1. Tapping an engineer-only AdvancedMarker pin (ZoneMarkers.js)
 * 2. Tapping a heatmap blob directly (Heatmap.js onBlobClick — public-visible)
 * Both call onZoneSelect, which the parent uses to set dialogZone.
 *
 * focusZone is a SEPARATE concept from selectedZone: it's just a camera
 * target. Stepping through the NearbyAlertsPage carousel with "‹ ›" updates
 * focusZone (and therefore pans the map) without necessarily opening the
 * dialog.
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

import { useEffect, useRef, useCallback } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import Heatmap from './Heatmap';
import ZoneMarkers from './ZoneMarkers';
import ZoneDetailDialog from './ZoneDetailDialog';
import ZoneLegend from './ZoneLegend';
import DisasterZoneBanner from './DisasterZoneBanner';
import BoundaryOverlay from './BoundaryOverlay';
import LocateButton from './LocateButton';

// Public Maps key — safe to expose in the browser bundle.
// Restrict it in Cloud Console to your Vercel domain + localhost.
const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Map ID is required for AdvancedMarker (engineer pin layer).
// Without it, AdvancedMarker logs an error and falls back to legacy markers.
// Create one at: Cloud Console → Maps Management → Create Map ID
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

// How far in to zoom when the camera focuses on a nearby alert.
const FOCUS_ZOOM = 16;

// Duration of the PAN phase of the flight, in ms — this is the part that
// should read as "traveling." The zoom-out/zoom-in steps are quick and
// near-instant by comparison (see ZOOM_STEP_DELAY_MS below).
const PAN_DURATION_MS = 1400;

// How many zoom levels to "dip" out before panning, for a sense of covering
// distance rather than sliding sideways at street level. Floored at
// FLIGHT_MIN_ZOOM so it never zooms out further than that.
const FLIGHT_ZOOM_DIP = 3;
const FLIGHT_MIN_ZOOM = 10;

// Small pause after each zoom step so the tile reload it triggers has a
// moment to settle before the next thing happens — without this gap the
// zoom-out and the start of the pan compete for the same frame and the
// zoom-out itself looks like a stutter rather than a clean step.
const ZOOM_STEP_DELAY_MS = 220;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * flyToRaster
 *
 * Fallback camera animation for RASTER-rendered Map IDs (or while rendering
 * type hasn't been determined yet). Three phases:
 *   1. Zoom OUT to a wider level (single setZoom call — Maps does this
 *      near-instantly; there's no native way to animate zoom smoothly on
 *      raster tiles, so we don't fight it).
 *   2. Pan smoothly across to the target, holding zoom FIXED at the dipped
 *      level the whole time, via requestAnimationFrame + eased setCenter()
 *      calls — the one operation Maps renders smoothly frame to frame on
 *      raster tiles.
 *   3. Zoom IN to the destination level (single setZoom call).
 *
 * An earlier version changed zoom on every single frame DURING the pan,
 * which meant Maps was reloading its tile pyramid constantly while also
 * trying to slide the center — the two fought each other and the whole
 * thing read as an instant cut rather than travel. Separating "zoom" from
 * "pan" into distinct phases is what produces a visible traveling motion
 * on raster tiles. See flyToVector() below for the smoother vector-map path.
 *
 * Returns a cancel function so an in-flight animation can be aborted if the
 * user taps "‹ ›" again before the previous flight finishes.
 */
function flyToRaster(map, targetLatLng, targetZoom) {
  const startCenter = map.getCenter();
  const startZoom = map.getZoom() ?? targetZoom;

  if (!startCenter) {
    map.setCenter(targetLatLng);
    map.setZoom(targetZoom);
    return () => {};
  }

  const startLat = startCenter.lat();
  const startLng = startCenter.lng();
  const dipZoom = Math.max(
    FLIGHT_MIN_ZOOM,
    Math.min(startZoom, targetZoom) - FLIGHT_ZOOM_DIP
  );

  let cancelled = false;
  let rafId = null;
  let timeoutId = null;

  function panPhase() {
    if (cancelled) return;
    const panStart = performance.now();

    function step(now) {
      if (cancelled) return;
      const t = Math.min(1, (now - panStart) / PAN_DURATION_MS);
      const eased = easeInOutCubic(t);

      const lat = startLat + (targetLatLng.lat - startLat) * eased;
      const lng = startLng + (targetLatLng.lng - startLng) * eased;
      map.setCenter({ lat, lng });

      if (t < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        // Phase 3 — zoom in to the destination, after a brief settle.
        timeoutId = setTimeout(() => {
          if (!cancelled) map.setZoom(targetZoom);
        }, ZOOM_STEP_DELAY_MS / 2);
      }
    }

    rafId = requestAnimationFrame(step);
  }

  // Phase 1 — zoom out, then let the tiles settle before panning.
  if (dipZoom !== startZoom) {
    map.setZoom(dipZoom);
    timeoutId = setTimeout(panPhase, ZOOM_STEP_DELAY_MS);
  } else {
    panPhase();
  }

  return () => {
    cancelled = true;
    if (rafId != null) cancelAnimationFrame(rafId);
    if (timeoutId != null) clearTimeout(timeoutId);
  };
}

/**
 * flyToVector
 *
 * Preferred camera animation for VECTOR-rendered Map IDs. Vector maps
 * support map.moveCamera({ center, zoom, ... }), which applies center AND
 * fractional zoom together as a single combined update each frame — unlike
 * raster tiles, the renderer doesn't reload a whole tile pyramid per zoom
 * step, so center and zoom can be animated continuously in the SAME
 * requestAnimationFrame loop without fighting each other. That means no
 * three-phase workaround is needed here: one smooth eased loop the whole
 * way, dipping the (fractional) zoom out and back in as it travels.
 *
 * Falls back to flyToRaster's behavior if moveCamera isn't available for
 * some reason (defensive — shouldn't happen once renderingType is VECTOR).
 *
 * Returns a cancel function so an in-flight animation can be aborted if the
 * user taps "‹ ›" again before the previous flight finishes.
 */
function flyToVector(map, targetLatLng, targetZoom) {
  if (typeof map.moveCamera !== 'function') {
    return flyToRaster(map, targetLatLng, targetZoom);
  }

  const startCenter = map.getCenter();
  const startZoom = map.getZoom() ?? targetZoom;

  if (!startCenter) {
    map.moveCamera({ center: targetLatLng, zoom: targetZoom });
    return () => {};
  }

  const startLat = startCenter.lat();
  const startLng = startCenter.lng();
  const dipZoom = Math.max(
    FLIGHT_MIN_ZOOM,
    Math.min(startZoom, targetZoom) - FLIGHT_ZOOM_DIP
  );

  let cancelled = false;
  let rafId = null;
  const startTime = performance.now();

  function step(now) {
    if (cancelled) return;
    const t = Math.min(1, (now - startTime) / PAN_DURATION_MS);
    const eased = easeInOutCubic(t);

    const lat = startLat + (targetLatLng.lat - startLat) * eased;
    const lng = startLng + (targetLatLng.lng - startLng) * eased;

    // Fractional zoom — dip out for the first half of the flight, climb
    // back in for the second. Vector rendering handles this smoothly,
    // which is the whole reason this path exists.
    const zoomT = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5;
    const zoomEased = easeInOutCubic(zoomT);
    const zoom =
      t < 0.5
        ? startZoom + (dipZoom - startZoom) * zoomEased
        : dipZoom + (targetZoom - dipZoom) * zoomEased;

    map.moveCamera({ center: { lat, lng }, zoom });

    if (t < 1) {
      rafId = requestAnimationFrame(step);
    } else {
      // Snap precisely to the destination on the final frame, in case the
      // eased interpolation didn't land exactly on it.
      map.moveCamera({ center: targetLatLng, zoom: targetZoom });
    }
  }

  rafId = requestAnimationFrame(step);

  return () => {
    cancelled = true;
    if (rafId != null) cancelAnimationFrame(rafId);
  };
}

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
 * MapController
 *
 * Headless child of <Map> — renders nothing. Exists only to grab the
 * imperative map instance via useMap() and fly it to `focusZone` whenever
 * that prop changes. This is what makes the "‹ ›" arrows in NearbyAlertsPage
 * move the map background, per the requirement that iterating through
 * alerts should "zoom in and go to that place automatically" with a
 * traveling feel rather than an instant jump.
 *
 * Picks the animation strategy based on the Map ID's actual rendering type,
 * read via map.getRenderingType() (and kept in sync via the
 * 'renderingtype_changed' event, since it's not known synchronously on
 * first load):
 *   - VECTOR  → flyToVector() — single smooth loop using moveCamera() with
 *               fractional zoom, the better path when available.
 *   - RASTER / unknown → flyToRaster() — three-phase fallback, since raster
 *               tiles don't animate fractional zoom reliably.
 *
 * Deliberately skips the very first run: on initial mount, focusZone is
 * already set to alert index 0, but we don't want to fly the camera away
 * from the user's actual location/default view just because a card happens
 * to be showing. The camera should only move in response to the user
 * explicitly stepping through alerts.
 */
function MapController({ focusZone }) {
  const map = useMap();
  const isFirstRun = useRef(true);
  const cancelFlightRef = useRef(null);
  const renderingTypeRef = useRef(null);

  // Track the map's rendering type as it becomes known/changes.
  useEffect(() => {
    if (!map || typeof google === 'undefined') return;

    renderingTypeRef.current = map.getRenderingType?.() ?? null;
    const listener = map.addListener('renderingtype_changed', () => {
      renderingTypeRef.current = map.getRenderingType?.() ?? null;
    });

    return () => google.maps.event.removeListener(listener);
  }, [map]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    if (!map || !focusZone?.centerCoordinates || typeof google === 'undefined') return;
    const { lat, lng } = focusZone.centerCoordinates;
    if (lat == null || lng == null) return;

    // Cancel any flight already in progress (e.g. user tapped "›" twice
    // quickly) before starting the new one.
    cancelFlightRef.current?.();

    const isVector = renderingTypeRef.current === google.maps.RenderingType.VECTOR;
    cancelFlightRef.current = isVector
      ? flyToVector(map, { lat, lng }, FOCUS_ZOOM)
      : flyToRaster(map, { lat, lng }, FOCUS_ZOOM);

    return () => {
      cancelFlightRef.current?.();
    };
  }, [map, focusZone]);

  return null;
}

// Add this near MapController, inside MapView.js

/**
 * MapInteractionWatcher
 *
 * Headless — watches for the map moving (drag or zoom, whether user-driven
 * or from MapController's programmatic flights) and reports that up to the
 * parent so it can hide the Greeting/NearbyAlerts overlays while the map is
 * in motion, then bring them back once the map settles.
 *
 * 'idle' fires after every drag/zoom/pan finishes — debounced slightly so a
 * brief idle blip between zoom steps (e.g. during a carousel flight) doesn't
 * flash the overlays back in and immediately out again.
 */
function MapInteractionWatcher({ onInteractionChange }) {
  const map = useMap();
  const idleTimeoutRef = useRef(null);

  useEffect(() => {
    if (!map || typeof google === 'undefined') return;

    const markMoving = () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
      onInteractionChange?.(true);
    };

    const markIdle = () => {
      idleTimeoutRef.current = setTimeout(() => {
        onInteractionChange?.(false);
      }, 180);
    };

    const listeners = [
      map.addListener('dragstart', markMoving),
      map.addListener('zoom_changed', markMoving),
      map.addListener('idle', markIdle),
    ];

    return () => {
      listeners.forEach((l) => google.maps.event.removeListener(l));
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [map, onInteractionChange]);

  return null;
}

/**
 * MapView
 *
 * @param {{
 *   zones: Array<Object>,                 — Live zone data from useZones()
 *   userLocation: { lat: number, lng: number }, — From useGeolocation() or Metro Manila fallback
 *   defaultZoom: number,                  — From useGeolocation() (13 fallback, 14 if GPS granted)
 *   isEngineer: boolean,                  — Gates the ZoneMarkers engineer layer
 *   selectedZone: Object | null,          — Controlled: zone shown in ZoneDetailDialog
 *   onZoneSelect: (zone: Object) => void, — Fired on pin/blob tap; parent sets selectedZone
 *   onClose: () => void,                  — Fired on dialog close / map background tap
 *   focusZone: Object | null,             — Controlled: zone the camera should pan/zoom to
 *   onMapInteractionChange?: (moving: boolean) => void,
 *
 *   --- Opt-in extras, all default to "off" so existing callers (home page)
 *       are completely unaffected ---
 *   showLegend?: boolean,                 — Mount ZoneLegend (default false)
 *   legendPosition?: 'bottom-right' | 'top-right',  — default 'bottom-right'
 *   showLocateButton?: boolean,           — Mount the GPS "target" button (default false)
 *   cityFilter?: { code: string, name: string } | null,      — Selected city
 *   barangayFilter?: { code: string, name: string } | null,  — Selected barangay
 *   showBoundaries?: boolean,             — Gate for the boundary polygon overlay (default true)
 * }} props
 */
export default function MapView({
  zones,
  userLocation,
  defaultZoom,
  isEngineer,
  selectedZone,
  onZoneSelect,
  onClose,
  focusZone,
  onMapInteractionChange,
  showLegend = false,
  legendPosition = 'bottom-right',
  showLocateButton = false,
  cityFilter = null,
  barangayFilter = null,
  showBoundaries = true,
}) {
  const handleZoneSelect = useCallback(
    (zone) => {
      onZoneSelect?.(zone);
    },
    [onZoneSelect]
  );

  /**
   * handleClosePanel is attached to:
   * 1. ZoneDetailDialog's backdrop/close button
   * 2. The <Map> onClick (tapping the map background dismisses the dialog)
   * 3. Heatmap's canvas click-passthrough when no blob was hit
   */
  const handleClosePanel = useCallback(() => {
    onClose?.();
  }, [onClose]);

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
        {/* <DisasterZoneBanner zones={zones} /> */}

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
          onClick={handleClosePanel}
        >
          {/* ── Public Heatmap Layer ──────────────────────────────────────── */}
          <Heatmap zones={zones} onBlobClick={handleZoneSelect} />

          {/* ── Engineer Pin Layer ────────────────────────────────────────── */}
          <ZoneMarkers zones={zones} onZoneSelect={handleZoneSelect} />

          {/* ── Camera controller — pans/zooms on focusZone change ──────────── */}
          <MapController focusZone={focusZone} />
          <MapInteractionWatcher onInteractionChange={onMapInteractionChange} />

          {/* ── City/Barangay boundary divisions — opt-in, see MapFilters.js ── */}
          {cityFilter && showBoundaries && (
            <BoundaryOverlay
              cityCode={cityFilter.code}
              barangayCode={barangayFilter?.code ?? null}
              barangayName={barangayFilter?.name ?? null}
            />
          )}

          {/* ── "Go to my location" target button — opt-in ──────────────────── */}
          {showLocateButton && <LocateButton />}
        </Map>

        {/* ── Legend ───────────────────────────────────────────────────────── */}
        {showLegend && <ZoneLegend position={legendPosition} />}

        {/* ── Zone Detail Dialog ───────────────────────────────────────────── */}
        {/*
          Controlled by the parent (page.js) — selectedZone is dialogZone
          there. Renders outside <Map> but inside the position:relative wrapper.
        */}
        <ZoneDetailDialog
          zone={selectedZone}
          onClose={handleClosePanel}
        />
      </div>
    </APIProvider>
  );
}