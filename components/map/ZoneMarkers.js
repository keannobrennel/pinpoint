'use client';

/**
 * ZoneMarkers.js
 *
 * Engineer-only pin layer. Renders one AdvancedMarker per zone, colored by
 * officialVerdict, with a report count badge and a pulsing ring for zones in
 * disaster mode.
 *
 * This component is only mounted when `isEngineer === true` in MapView.js.
 * Public visitors never see these markers — only the heatmap layer.
 *
 * Color convention MUST stay in sync with components/dashboard/ZoneCard.js
 * so the map and dashboard read consistently.
 *
 * REQUIREMENTS:
 * - Must be inside <APIProvider> + <Map> from @vis.gl/react-google-maps
 * - <Map> must have a mapId prop set (NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID in .env.local)
 *   AdvancedMarker will throw without a Map ID.
 * - Pulse animation CSS (@keyframes pinpoint-pulse) must be defined in globals.css
 */

import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { useCallback } from 'react';

/**
 * Verdict → visual config mapping.
 * Matches ATC-20 placard convention and ZoneCard.js dashboard colors exactly.
 * The `null` key handles zones with no verdict yet (gray = "no data").
 */
const VERDICT_CONFIG = {
  inspected:      { bg: '#22c55e', border: '#16a34a', label: 'Inspected' },
  restricted_use: { bg: '#f59e0b', border: '#d97706', label: 'Restricted Use' },
  unsafe:         { bg: '#ef4444', border: '#dc2626', label: 'Unsafe' },
  null:           { bg: '#6b7280', border: '#4b5563', label: 'No Assessment' },
};

/**
 * The visual pin element rendered inside AdvancedMarker.
 * Uses inline styles only (no Tailwind) because AdvancedMarker renders
 * children into a shadow DOM-like context where Tailwind classes may not apply.
 *
 * @param {{ verdict: string|null, disasterMode: boolean, reportCount: number }} props
 */
function ZonePin({ verdict, disasterMode, reportCount }) {
  // Safely resolve to the null config if the verdict value is unexpected
  const config = VERDICT_CONFIG[verdict] ?? VERDICT_CONFIG['null'];

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        // Ensure the pin stem doesn't create an invisible hit-area beneath
        // the circle that fights with map background click events.
        userSelect: 'none',
      }}
    >
      {/*
        Disaster mode: pulsing red ring behind the pin circle.
        The animation class targets @keyframes pinpoint-pulse in globals.css.
        Inline `animation` references the keyframe name defined there.
        Using a class via className is not reliable in AdvancedMarker's context,
        so the animation name string is referenced directly in the inline style.
      */}
      {disasterMode && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -6,
            left: -6,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#ef4444',
            opacity: 0.35,
            animation: 'pinpoint-pulse 1.5s ease-out infinite',
            zIndex: 0,
          }}
        />
      )}

      {/* Main verdict-colored circle with report count badge */}
      <div
        style={{
          position: 'relative',
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: config.bg,
          border: `3px solid ${config.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontSize: 10,
          fontWeight: 700,
          lineHeight: 1,
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
          zIndex: 1,
        }}
        // Accessible label for screen readers — the visual pin has no text
        title={`${config.label} — ${reportCount} report${reportCount !== 1 ? 's' : ''}`}
      >
        {reportCount > 99 ? '99+' : reportCount}
      </div>

      {/* Pin stem — thin vertical bar connecting circle to map surface */}
      <div
        aria-hidden="true"
        style={{
          width: 2,
          height: 8,
          background: config.border,
          zIndex: 1,
        }}
      />
    </div>
  );
}

/**
 * ZoneMarkers
 *
 * Renders an AdvancedMarker for every zone in the array.
 * Disaster-mode zones are given a higher zIndex so they float above normal zones.
 *
 * @param {{
 *   zones: Array<Object>,
 *   onZoneSelect: (zone: Object) => void
 * }} props
 */
export default function ZoneMarkers({ zones, onZoneSelect }) {
  /**
   * Stable click handler — useCallback prevents new function instances on
   * every render, which would cause AdvancedMarker to detach/reattach listeners.
   */
  const handleClick = useCallback(
    (zone) => {
      onZoneSelect(zone);
    },
    [onZoneSelect]
  );

  return zones
    .filter(
      (zone) =>
        zone.centerCoordinates?.lat != null &&
        zone.centerCoordinates?.lng != null
    )
    .map((zone) => {
      const { lat, lng } = zone.centerCoordinates;

      return (
        <AdvancedMarker
          /**
           * Use Firestore document ID as key. The plan references zone.zoneId but
           * useZones() normalises to doc.id — both work, id is always present.
           */
          key={zone.id}
          position={{ lat, lng }}
          onClick={() => handleClick(zone)}
          /**
           * Disaster zones float above regular markers.
           * zIndex 100 ensures they're always visible when clusters overlap.
           */
          zIndex={zone.disasterMode ? 100 : 1}
          /**
           * title is shown as a native browser tooltip on hover (desktop).
           * Provides a minimal accessibility label without custom tooltip UI.
           */
          title={
            zone.officialVerdict
              ? `${VERDICT_CONFIG[zone.officialVerdict]?.label ?? zone.officialVerdict}`
              : 'No official assessment'
          }
        >
          <ZonePin
            verdict={zone.officialVerdict ?? null}
            disasterMode={!!zone.disasterMode}
            reportCount={zone.reportCount ?? 0}
          />
        </AdvancedMarker>
      );
    });
}
