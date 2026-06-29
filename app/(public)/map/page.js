'use client';

/**
 * app/(public)/map/page.js
 *
 * Public map page — the one page in the app that must work for a completely
 * anonymous visitor (per handoff-8-map.md). No auth guard, no login wall.
 *
 * Deliberately thin: wires the three hooks (useGeolocation, useZones, useAuth)
 * and hands their output down to <MapView>. All map rendering logic lives in
 * components/map/* — this file owns no map state itself.
 *
 * Data flow:
 *   useGeolocation() → { location, zoom }      → where to center the map
 *   useZones()       → { zones, loading, error} → live Firestore zone docs
 *   useAuth()        → { user, role }          → gates the engineer pin layer
 *
 * Per handoff-8-map.md: the greeting card, "Nearby Alerts" feed, bottom nav,
 * and exact spacing/copy from the design mockup are explicitly OUT of scope
 * here. Those are a separate design teammate's work and get layered in via
 * position:absolute. Do not build placeholder chrome beyond the comment slot
 * left for them below.
 */

import MapView from '@/components/map/MapView';
import { useZones } from '@/hooks/useZones';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/hooks/useAuth';

export default function MapPage() {
  const { location, zoom } = useGeolocation();
  const { zones, loading, error } = useZones();
  const { role } = useAuth(); // useAuth already exists — role is null/undefined when logged out

  const isEngineer = role === 'engineer' || role === 'admin';

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100dvh', // dvh, not vh — avoids iOS Safari chrome overlapping the map
        overflow: 'hidden',
      }}
    >
      {/* ── Initial loading overlay ──────────────────────────────────────── */}
      {/*
        Shown only until the first Firestore snapshot resolves. `loading`
        flips to false even if zones comes back empty — this is "data
        hasn't arrived yet", not "no zones found" (that's a design-layer
        empty state, not ours to build here).
      */}
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 300,
            fontSize: 14,
            color: '#6b7280',
          }}
        >
          Loading map data…
        </div>
      )}

      {/* ── Firestore snapshot error state ──────────────────────────────── */}
      {/*
        useZones() surfaces onSnapshot errors here (rules misconfiguration,
        offline, etc.) instead of failing silently. The map still mounts
        underneath with whatever `zones` array it has — likely empty.
      */}
      {error && !loading && (
        <div
          role="alert"
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            zIndex: 300,
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
          }}
        >
          Couldn't load live zone data. Showing the map without it.
        </div>
      )}

      <MapView
        zones={zones}
        userLocation={location}
        defaultZoom={zoom}
        isEngineer={isEngineer}
      />

      {/*
        ── Design teammate slot ──────────────────────────────────────────
        Greeting card, bottom nav, and the "Nearby Alerts" feed card land
        here via position:absolute, layered on top of <MapView>. They
        should read from the same `zones` array fetched above rather than
        calling useZones() again — see handoff-8-map.md.
      */}
    </div>
  );
}