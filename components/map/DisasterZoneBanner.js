'use client';

/**
 * DisasterZoneBanner.js
 *
 * A persistent alert strip rendered inside the map viewport (position:absolute,
 * top of screen) when one or more zones have disasterMode === true.
 *
 * Intended as a heads-up for public users who have the map open but haven't
 * tapped any specific zone yet. Shows the count of active disaster zones and
 * the first alert banner message if only one zone is active, or a generic
 * summary if multiple zones are active.
 *
 * This component is passed the full zones array and filters internally —
 * it doesn't need a separate hook.
 *
 * Placement: rendered inside the position:relative wrapper in MapView.js,
 * above the Map canvas but below the ZoneInfoPanel (zIndex: 150 vs 200).
 *
 * The design teammate can extend or replace this component — it's a functional
 * placeholder with intentionally minimal styling so it doesn't conflict with
 * their incoming design work.
 */

import { useMemo } from 'react';

/**
 * DisasterZoneBanner
 *
 * @param {{
 *   zones: Array<Object>  — Full zones array from useZones()
 * }} props
 */
export default function DisasterZoneBanner({ zones }) {
  /**
   * Filter to zones with disaster mode active.
   * Memoized so it only recomputes when the zones reference changes
   * (i.e., on each Firestore onSnapshot update).
   */
  const disasterZones = useMemo(
    () => zones.filter((z) => !!z.disasterMode),
    [zones]
  );

  // Render nothing if no zones are in disaster mode
  if (!disasterZones.length) return null;

  const count = disasterZones.length;

  /**
   * Message logic:
   * - 1 disaster zone with an alert message → show that message directly
   * - 1 disaster zone with no alert message → show generic "1 zone in disaster mode"
   * - Multiple zones → show count summary (alerts for individual zones are in ZoneInfoPanel)
   */
  const message =
    count === 1 && disasterZones[0].alertBannerMessage
      ? disasterZones[0].alertBannerMessage
      : count === 1
      ? '1 zone currently in disaster mode. Tap the map for details.'
      : `${count} zones currently in disaster mode. Follow official advisories.`;

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: '#dc2626',           // red-600 — unmistakable danger signal
        color: '#ffffff',
        padding: '10px 16px',
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.4,
        // No border-radius — the banner should bleed to both edges of the viewport
        // so it reads as a system-level alert, not a card.
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
        // The design teammate's top chrome (greeting card, logo, nav header)
        // should sit below this via z-index stacking. Coordinate with them.
      }}
    >
      <span
        aria-hidden="true"
        style={{ fontSize: 16, flexShrink: 0 }}
      >
        🔴
      </span>

      <span style={{ flex: 1 }}>
        {message}
      </span>

      {/*
        "Disaster Mode" label badge — useful if the design teammate wants to
        make this banner dismissible or expandable later. Currently static.
      */}
      <span
        aria-hidden="true"
        style={{
          background: 'rgba(255,255,255,0.2)',
          borderRadius: 4,
          padding: '2px 8px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        Disaster Mode
      </span>
    </div>
  );
}
