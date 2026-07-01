'use client';

/**
 * LocateButton.js
 *
 * "Target" button for the full /map page — on tap, gets the user's current
 * GPS position and snaps the camera to it.
 *
 * Per the map requirements, every camera movement on this page assumes
 * VECTOR rendering, so this goes straight to map.moveCamera({ center, zoom })
 * — no raster three-phase fallback needed here (see MapView.js's
 * flyToRaster/flyToVector for that more defensive dance, used by the
 * NearbyAlerts carousel on the home page instead).
 *
 * Must be rendered as a child of <Map> (it needs useMap() from
 * @vis.gl/react-google-maps), e.g. inside MapView.js's <Map>...</Map>.
 */

import { useState, useCallback } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

const LOCATE_ZOOM = 16;
const GEO_TIMEOUT_MS = 8000;

/**
 * LocateButton
 *
 * @param {{
 *   style?: Object  — optional style overrides/additions (e.g. to reposition)
 * }} props
 */
export default function LocateButton({ style }) {
  const map = useMap();
  const [status, setStatus] = useState('idle'); // 'idle' | 'locating' | 'error'

  const handleClick = useCallback(() => {
    if (!map || typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
      return;
    }

    setStatus('locating');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Vector-mode map — moveCamera animates center + zoom together
        // natively, no manual pan/zoom phasing required.
        map.moveCamera({ center: { lat: latitude, lng: longitude }, zoom: LOCATE_ZOOM });
        setStatus('idle');
      },
      () => {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 2000);
      },
      {
        enableHighAccuracy: true,
        timeout: GEO_TIMEOUT_MS,
        maximumAge: 30000,
      }
    );
  }, [map]);

  const isError = status === 'error';
  const isLocating = status === 'locating';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Go to my location"
      title="Go to my location"
      disabled={isLocating}
      style={{
        position: 'absolute',
        // Sits above the bottom nav + its floating camera FAB. Adjust if
        // bottom-nav's actual rendered height differs from this estimate.
        bottom: 100,
        right: 16,
        zIndex: 150,
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: 'none',
        background: isError ? '#fee2e2' : '#ffffff',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isLocating ? 'default' : 'pointer',
        ...style,
      }}
    >
      <i
        className={`fa-solid ${isLocating ? 'fa-spinner fa-spin' : 'fa-location-crosshairs'}`}
        aria-hidden="true"
        style={{
          fontSize: 18,
          color: isError ? '#dc2626' : '#2a6697',
        }}
      />
    </button>
  );
}