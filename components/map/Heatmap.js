'use client';

/**
 * Heatmap.js
 *
 * Canvas heatmap rendered as a plain sibling element on map.getDiv(), with
 * a Google Maps OverlayView used only to obtain the projection (NOT to host
 * the canvas inside a pane — see FIX NOTES below for why).
 *
 * Color tier (safe / caution / dangerous) is driven by officialVerdict.
 * Blob radius is driven by averageSeverityScore — more severe zones draw
 * a visibly larger blob within their color tier.
 *
 * Dangerous (red) blobs pulse using a sine wave animation loop.
 *
 * FIX NOTES (see chat for full debugging writeup):
 * 1. The canvas now has `pointer-events: none`, so it never intercepts map
 *    gestures (pan/zoom/pinch/scroll/drag). Previously `pointer-events: auto`
 *    plus a raw click listener on the canvas blocked all map interaction
 *    except the manually-forwarded synthetic click.
 * 2. The canvas is appended as a plain sibling directly to `map.getDiv()`
 *    (the map's outer container), NOT inside `overlay.getPanes().overlayLayer`.
 *    Panes have their own internal coordinate space that shifts/translates as
 *    the map pans, so content inside a pane must be positioned with
 *    `fromLatLngToDivPixel` (pane-relative) — NOT `fromLatLngToContainerPixel`
 *    (viewport-relative). An earlier version attached the canvas to the
 *    overlayLayer pane while still using `fromLatLngToContainerPixel`, which
 *    painted every blob at the wrong screen position (silently off-canvas).
 *    Attaching to map.getDiv() instead keeps the canvas in true viewport
 *    coordinates, which is what `fromLatLngToContainerPixel` expects. A
 *    `google.maps.OverlayView` is still used, but only to obtain
 *    `getProjection()` via onAdd/draw — not to host the canvas.
 * 3. Blob click hit-testing has moved from a canvas `click` listener to the
 *    map's own `click` event (since the canvas can no longer receive
 *    clicks). This also removes the old synthetic
 *    `google.maps.event.trigger(map, 'click', ...)` forwarding hack, which
 *    risked double-firing click handling.
 *
 * Also exposes a hit-test so MapView can detect clicks on a blob (not just
 * on the AdvancedMarker pin) and open the same zone dialog.
 */

import { useMap } from '@vis.gl/react-google-maps';
import { useEffect, useRef } from 'react';

// Radius at zoom 13 for the lowest severity (1) and highest severity (10).
// Interpolated linearly in between, then scaled per zoom level.
const MIN_RADIUS_PX = 18;
const MAX_RADIUS_PX = 55;

/**
 * Verdict → color tier mapping.
 * 'safe' = inspected, 'caution' = restricted_use, 'dangerous' = unsafe.
 * No verdict yet falls back to a neutral gray tier (not shown in legend
 * since it isn't one of the three official tiers).
 */
export const TIER_COLOR = {
  safe: '34, 197, 94',       // green-500
  caution: '245, 158, 11',   // amber-500
  dangerous: '239, 68, 68',  // red-500
  unknown: '107, 114, 128',  // gray-500
};

export function verdictToTier(verdict) {
  switch (verdict) {
    case 'inspected':      return 'safe';
    case 'restricted_use': return 'caution';
    case 'unsafe':          return 'dangerous';
    default:                 return 'unknown';
  }
}

function verdictToColor(verdict) {
  return TIER_COLOR[verdictToTier(verdict)];
}

function severityToWeight(score) {
  return Math.min(1, Math.max(0, (score ?? 0) / 10));
}

/**
 * Radius for a given severity score (1-10) at the map's current zoom.
 * Linearly interpolates between MIN_RADIUS_PX and MAX_RADIUS_PX based on
 * weight, then scales with zoom the same way the old fixed radius did.
 */
function radiusForSeverity(weight, zoom) {
  const baseRadius = MIN_RADIUS_PX + (MAX_RADIUS_PX - MIN_RADIUS_PX) * weight;
  return Math.round(baseRadius * Math.pow(2, zoom - 13));
}

/**
 * Paint heatmap blobs onto `canvas`.
 * `time` drives the pulse for dangerous (red) blobs — pass 0 for a static render.
 */
function paintHeatmap(canvas, map, points, time = 0) {
  const mapDiv = map.getDiv();
  const W = mapDiv.offsetWidth;
  const H = mapDiv.offsetHeight;
  if (W === 0 || H === 0 || !points.length) return;

  canvas.width        = W;
  canvas.height       = H;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';

  const ctx  = canvas.getContext('2d');
  const zoom = map.getZoom();

  ctx.clearRect(0, 0, W, H);

  const proj = map.__heatmapProjection;
  if (!proj) return;

  for (const pt of points) {
    const pixel = proj.fromLatLngToContainerPixel(
      new google.maps.LatLng(pt.lat, pt.lng)
    );
    if (!pixel) continue;

    const x = pixel.x;
    const y = pixel.y;
    const radius = radiusForSeverity(pt.weight, zoom);

    // Stash the screen-space radius + position on the point so hit-testing
    // (the map's click listener, see below) can reuse the exact same
    // geometry just painted.
    pt._screenX = x;
    pt._screenY = y;
    pt._screenRadius = radius;

    if (x < -radius || x > W + radius || y < -radius || y > H + radius) continue;

    // Dangerous blobs pulse between low and slightly-higher opacity.
    const isDangerous = pt.tier === 'dangerous';
    const pulse = isDangerous ? 1.0 * Math.sin(time) : 0.75;

    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0,   `rgba(${pt.color}, ${pulse.toFixed(3)})`);
    grad.addColorStop(0.2, `rgba(${pt.color}, ${(pulse * 0.7).toFixed(3)})`);
    grad.addColorStop(1.0, `rgba(${pt.color}, 0)`);

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ─── OverlayView used to obtain the Maps projection AND host the canvas ──────
//
// IMPORTANT: the canvas is intentionally NOT attached to a pane (e.g.
// getPanes().overlayLayer). Panes have their own internal coordinate space
// that is translated/shifted as the map pans — content living inside a pane
// must be positioned with `fromLatLngToDivPixel` (pane-relative), NOT
// `fromLatLngToContainerPixel` (viewport-relative). Mixing the two causes
// blobs to be painted at the wrong screen position (effectively invisible,
// since they land outside the visible area).
//
// Instead, the canvas is appended as a plain sibling element directly to
// map.getDiv() (the map's outer container), which IS viewport-aligned and
// therefore matches `fromLatLngToContainerPixel` correctly. The OverlayView
// here is used only to obtain `getProjection()` via onAdd/draw — it does not
// host the canvas inside any pane.
function createCanvasOverlay(map, canvas) {
  const overlay = new google.maps.OverlayView();

  overlay.onAdd = function () {
    // map.getDiv() is the outermost map container — a plain sibling here
    // sits in viewport coordinates, NOT pane-relative coordinates.
    map.getDiv().appendChild(canvas);
  };

  overlay.draw = function () {
    map.__heatmapProjection = this.getProjection();
  };

  overlay.onRemove = function () {
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  };

  overlay.setMap(map);
  return overlay;
}

// ─── React component ──────────────────────────────────────────────────────────

/**
 * @param {{
 *   zones: Array<Object>,
 *   onBlobClick?: (zone: Object) => void  — fired when a blob (not a pin) is clicked
 * }} props
 */
export default function Heatmap({ zones, onBlobClick }) {
  const map      = useMap();
  const stateRef = useRef({
    canvas: null,
    points: [],
    listeners: [],
    overlay: null,
    pulseFrame: null,
    onBlobClick: null,
  });

  // Keep the latest onBlobClick callback available to the click listener
  // without re-attaching the listener on every render.
  useEffect(() => {
    stateRef.current.onBlobClick = onBlobClick;
  }, [onBlobClick]);

  useEffect(() => {
    if (!map || typeof google === 'undefined') return;

    const s = stateRef.current;

    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top      = '0';
    canvas.style.left     = '0';
    // CRITICAL: the canvas must never intercept pointer events, or it blocks
    // pan/zoom/pinch/drag on the map underneath it. Hit-testing for blob
    // clicks is done via the map's own 'click' listener instead (below),
    // using the same screen-space geometry painted each frame.
    canvas.style.pointerEvents = 'none';

    s.canvas = canvas;
    // Attach canvas as a sibling on map.getDiv() + grab the projection.
    s.overlay = createCanvasOverlay(map, canvas);

    // Pulse loop — redraws every frame for dangerous-tier blob animation
    let startTime = null;
    function pulseLoop(timestamp) {
      if (!startTime) startTime = timestamp;
      const time = (timestamp - startTime) / 500;
      if (s.canvas) paintHeatmap(s.canvas, map, s.points, time);
      s.pulseFrame = requestAnimationFrame(pulseLoop);
    }
    s.pulseFrame = requestAnimationFrame(pulseLoop);

    // Blob hit-test now lives on the map's click event, since the canvas no
    // longer receives pointer events. If a blob is hit, onBlobClick fires
    // and we stop propagation conceptually by not calling anything else;
    // if no blob is hit, MapView's own onClick (handleClosePanel) still
    // fires normally because we never preventDefault/stop anything here.
    function handleMapClick(e) {
      const proj = map.__heatmapProjection;
      if (!proj || !e.latLng) return;

      const pixel = proj.fromLatLngToContainerPixel(e.latLng);
      if (!pixel) return;

      for (let i = s.points.length - 1; i >= 0; i--) {
        const pt = s.points[i];
        if (pt._screenX == null) continue;
        const dx = pixel.x - pt._screenX;
        const dy = pixel.y - pt._screenY;
        if (Math.sqrt(dx * dx + dy * dy) <= pt._screenRadius) {
          if (s.onBlobClick) s.onBlobClick(pt.zone);
          return;
        }
      }
      // No blob hit — fall through silently. MapView's onClick prop
      // (handleClosePanel) is a separate listener on the same Map and
      // will run independently.
    }

    s.listeners = [
      map.addListener('click', handleMapClick),
      map.addListener('bounds_changed', () => paintHeatmap(canvas, map, s.points, 0)),
      map.addListener('resize',         () => paintHeatmap(canvas, map, s.points, 0)),
    ];

    return () => {
      s.listeners.forEach((l) => google.maps.event.removeListener(l));
      if (s.overlay) s.overlay.setMap(null); // triggers onRemove → detaches canvas
      if (s.pulseFrame) cancelAnimationFrame(s.pulseFrame);
      s.canvas     = null;
      s.overlay    = null;
      s.pulseFrame = null;
      s.listeners  = [];
      delete map.__heatmapProjection;
    };
  }, [map]);

  // Update points + trigger redraw whenever zones prop changes
  useEffect(() => {
    const s = stateRef.current;

    s.points = zones
      .filter(
        (z) =>
          z.centerCoordinates?.lat != null &&
          z.centerCoordinates?.lng != null
      )
      .map((z) => {
        const tier = verdictToTier(z.officialVerdict);
        return {
          lat: z.centerCoordinates.lat,
          lng: z.centerCoordinates.lng,
          weight: severityToWeight(z.averageSeverityScore),
          color: TIER_COLOR[tier],
          tier,
          zone: z, // keep a reference for click hit-testing
        };
      });

    if (s.canvas && map) {
      paintHeatmap(s.canvas, map, s.points, 0);
    }
  }, [zones, map]);

  return null;
}