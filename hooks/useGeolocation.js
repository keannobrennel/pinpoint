'use client';

import { useState, useEffect } from 'react';

// Default: Metro Manila city center
const METRO_MANILA_FALLBACK = { lat: 14.5995, lng: 120.9842 };
const DEFAULT_ZOOM = 13;
const GPS_TIMEOUT_MS = 6000;

/**
 * Provides the user's current GPS location with a Metro Manila fallback.
 *
 * @returns {{
 *   location: { lat: number, lng: number },
 *   zoom: number,
 *   status: 'pending' | 'granted' | 'denied' | 'fallback'
 * }}
 */
export function useGeolocation() {
  const [location, setLocation] = useState(METRO_MANILA_FALLBACK);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    // SSR guard — navigator is not available on the server
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setStatus('fallback');
      return;
    }

    // If GPS hasn't answered in GPS_TIMEOUT_MS, fall back silently
    const timeoutId = setTimeout(() => {
      setStatus('fallback');
    }, GPS_TIMEOUT_MS);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        // Zoom in slightly more when we have an exact location
        setZoom(14);
        setStatus('granted');
      },
      () => {
        clearTimeout(timeoutId);
        // location stays at METRO_MANILA_FALLBACK
        setStatus('denied');
      },
      {
        // enableHighAccuracy: false — network-based location is fast enough for
        // map centering and avoids waking GPS hardware on mobile.
        enableHighAccuracy: false,
        timeout: GPS_TIMEOUT_MS,
        maximumAge: 60000,
      }
    );

    return () => clearTimeout(timeoutId);
  }, []);

  return { location, zoom, status };
}
