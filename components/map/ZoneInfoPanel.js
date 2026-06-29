'use client';

/**
 * ZoneInfoPanel.js
 *
 * Bottom sheet panel that slides up when a zone marker is tapped.
 * Displays reverse-geocoded zone name, official ATC-20 verdict badge,
 * inspection status, active alert banner, and disaster mode notice.
 *
 * Data shown here is strictly zone-level — no individual report details,
 * no submitter info, no raw AI assessment data. Public-safe by design.
 *
 * Rendered OUTSIDE the <Map> element but inside the position:relative
 * container in MapView.js, so it overlays the map surface correctly.
 *
 * The reverse geocode call is deferred — it fires only when a zone is selected,
 * not on mount, keeping the panel fast and the Geocoding API call count low.
 */

import { useEffect, useState, useCallback } from 'react';
import { reverseGeocode } from '@/lib/geocoding';

/**
 * ATC-20 verdict → display label + badge color.
 * Null verdict = zone has reports but no official engineer assessment yet.
 * Colors match ZoneCard.js and ZoneMarkers.js exactly.
 */
const VERDICT_LABEL = {
  inspected:      { text: 'Inspected',            color: '#22c55e', textColor: '#ffffff' },
  restricted_use: { text: 'Restricted Use',        color: '#f59e0b', textColor: '#ffffff' },
  unsafe:         { text: 'UNSAFE',                color: '#ef4444', textColor: '#ffffff' },
  null:           { text: 'No Official Assessment', color: '#6b7280', textColor: '#ffffff' },
};

/**
 * inspectionStatus field values → human-readable strings shown to the public.
 * These match the schema values documented in handoff-8-map.md.
 */
const INSPECTION_STATUS_LABEL = {
  no_assessment:        'No assessment yet',
  pending_inspection:   'Pending inspection',
  inspector_dispatched: 'Inspector dispatched',
  assessed:             'Assessment complete',
};

/**
 * ZoneInfoPanel
 *
 * @param {{
 *   zone: Object | null,   — Selected zone document from useZones(), or null
 *   onClose: () => void    — Called when user dismisses the panel
 * }} props
 */
export default function ZoneInfoPanel({ zone, onClose }) {
  const [zoneName, setZoneName] = useState('Loading location…');

  /**
   * Fetch reverse-geocoded name whenever the selected zone changes.
   * The geocoding utility caches results in module scope, so repeat taps
   * on the same zone don't trigger a network call.
   *
   * Reset to loading state immediately on zone change to avoid showing the
   * previous zone's name while the new one resolves.
   */
  useEffect(() => {
    if (!zone) return;

    setZoneName('Loading location…');

    const { lat, lng } = zone.centerCoordinates ?? {};
    if (lat == null || lng == null) {
      setZoneName('Unknown location');
      return;
    }

    let cancelled = false;
    reverseGeocode(lat, lng).then((name) => {
      if (!cancelled) setZoneName(name);
    });

    // Cancel the state update if the panel closes or zone changes before
    // the geocode resolves — prevents setting state on unmounted component.
    return () => {
      cancelled = true;
    };
  }, [zone]);

  // Render nothing when no zone is selected — keeps the DOM clean.
  if (!zone) return null;

  const verdict = zone.officialVerdict ?? null;
  const verdictConfig = VERDICT_LABEL[verdict] ?? VERDICT_LABEL['null'];

  /**
   * alertBannerMessage is shown only if:
   *   1. The field is non-empty, AND
   *   2. alertExpiresAt is either absent (no expiry) OR has not yet passed.
   *
   * Firestore doesn't auto-expire fields, so the expiry check is client-side.
   * alertExpiresAt is a Firestore Timestamp — call .toMillis() to compare.
   */
  const alertIsActive =
    zone.alertBannerMessage &&
    (
      !zone.alertExpiresAt ||
      zone.alertExpiresAt.toMillis() > Date.now()
    );

  const inspectionStatusText =
    INSPECTION_STATUS_LABEL[zone.inspectionStatus] ??
    zone.inspectionStatus ??
    null;

  return (
    <>
      {/*
        Backdrop: tapping outside the panel body (on the map area above)
        triggers onClose via the Map's onClick in MapView.js.
        This invisible overlay catches taps on the bottom ~40% of the screen
        that the panel itself doesn't cover.
      */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          bottom: 'auto',
          top: 0,
          height: '60%',
          zIndex: 199,
          background: 'transparent',
        }}
      />

      {/* Panel body */}
      <div
        role="dialog"
        aria-label={`Zone information: ${zoneName}`}
        aria-modal="false"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#ffffff',
          borderRadius: '16px 16px 0 0',
          padding: '12px 24px 40px',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.15)',
          zIndex: 200,
          maxHeight: '42vh',
          overflowY: 'auto',
          // Smooth slide-up entrance — CSS only, no JS animation library needed.
          // The design teammate can replace this with Framer Motion if they prefer.
          animation: 'slideUp 0.22s ease-out',
        }}
      >
        {/* Drag handle — visual affordance, no actual drag behavior (scope) */}
        <div
          aria-hidden="true"
          style={{
            width: 40,
            height: 4,
            background: '#e5e7eb',
            borderRadius: 2,
            margin: '0 auto 14px',
          }}
        />

        {/* Close button — top-right corner */}
        <button
          onClick={onClose}
          aria-label="Close zone panel"
          style={{
            position: 'absolute',
            top: 14,
            right: 18,
            background: 'none',
            border: 'none',
            padding: '4px 6px',
            fontSize: 20,
            lineHeight: 1,
            cursor: 'pointer',
            color: '#9ca3af',
            borderRadius: 4,
          }}
        >
          ×
        </button>

        {/* Location name (reverse geocoded) */}
        <p
          style={{
            fontSize: 13,
            color: '#6b7280',
            margin: '0 0 2px',
            paddingRight: 32, // Don't overlap the close button
          }}
        >
          📍 {zoneName}
        </p>

        {/* Report count */}
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 14px' }}>
          {zone.reportCount ?? 0}{' '}
          {(zone.reportCount ?? 0) === 1 ? 'report' : 'reports'} submitted
        </p>

        {/* ATC-20 verdict badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '5px 14px',
            borderRadius: 9999,
            background: verdictConfig.color,
            color: verdictConfig.textColor,
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.01em',
            marginBottom: 8,
          }}
        >
          {verdictConfig.text}
        </div>

        {/* Inspection workflow status */}
        {inspectionStatusText && (
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>
            {inspectionStatusText}
          </p>
        )}

        {/* Active alert banner from engineer */}
        {alertIsActive && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              background: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: '#92400e',
              marginTop: 10,
              lineHeight: 1.5,
            }}
          >
            <span aria-hidden="true" style={{ flexShrink: 0 }}>⚠️</span>
            <span>{zone.alertBannerMessage}</span>
          </div>
        )}

        {/* Disaster mode notice */}
        {zone.disasterMode && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: '#991b1b',
              fontWeight: 600,
              marginTop: 10,
              lineHeight: 1.5,
            }}
          >
            <span aria-hidden="true" style={{ flexShrink: 0 }}>🔴</span>
            <span>Disaster Mode Active — Follow official advisories.</span>
          </div>
        )}
      </div>
    </>
  );
}
