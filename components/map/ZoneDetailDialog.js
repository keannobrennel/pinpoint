'use client';

/**
 * ZoneDetailDialog.js
 *
 * Replaces the old bottom-sheet ZoneInfoPanel with a centered modal dialog,
 * matching the requested reference layout: a compact card with the essential
 * facts (location, verdict, severity), plus a "More info" button that expands
 * a side panel with full details and the user-submitted report image.
 *
 * Opened by EITHER:
 * - Tapping an engineer-only AdvancedMarker pin (ZoneMarkers.js)
 * - Tapping a heatmap blob directly (Heatmap.js hit-test → onBlobClick)
 *
 * Data shown is strictly zone-level — no submitter info, no raw AI data.
 *
 * `zone.reportImageUrl` is read if present (a representative photo from the
 * zone's most relevant report). If absent, a placeholder is shown instead —
 * wiring the real field from the reports collection is a follow-up task.
 */

import { useEffect, useState } from 'react';
import { reverseGeocode } from '@/lib/geocoding';
import { verdictToTier, TIER_COLOR } from './Heatmap';

/**
 * Tier → display config. Matches the 3-tier system used by the heatmap
 * and the legend exactly (safe / caution / dangerous).
 */
const TIER_CONFIG = {
  safe:      { label: 'Safe', color: '#22c55e' },
  caution:   { label: 'Caution', color: '#f59e0b' },
  dangerous: { label: 'Dangerous', color: '#ef4444' },
  unknown:   { label: 'Unassessed', color: '#6b7280' },
};

const VERDICT_TEXT = {
  inspected:      'Inspected',
  restricted_use: 'Restricted Use',
  unsafe:         'UNSAFE',
  null:           'No Official Assessment',
};

const INSPECTION_STATUS_LABEL = {
  no_assessment:        'No assessment yet',
  pending_inspection:   'Pending inspection',
  inspector_dispatched: 'Inspector dispatched',
  assessed:             'Assessment complete',
};

/**
 * ZoneDetailDialog
 *
 * @param {{
 *   zone: Object | null,   — Selected zone document, or null
 *   onClose: () => void    — Called when user dismisses the dialog
 * }} props
 */
export default function ZoneDetailDialog({ zone, onClose }) {
  const [zoneName, setZoneName] = useState('Loading location...');
  const [expanded, setExpanded] = useState(false);

  // Reset the expanded panel every time a different zone is selected
  useEffect(() => {
    setExpanded(false);
  }, [zone]);

  useEffect(() => {
    if (!zone) return;

    setZoneName('Loading location...');

    const { lat, lng } = zone.centerCoordinates ?? {};
    if (lat == null || lng == null) {
      setZoneName('Unknown location');
      return;
    }

    let cancelled = false;
    reverseGeocode(lat, lng).then((name) => {
      if (!cancelled) setZoneName(name);
    });

    return () => {
      cancelled = true;
    };
  }, [zone]);

  if (!zone) return null;

  const verdict = zone.officialVerdict ?? null;
  const tier = verdictToTier(verdict);
  const tierConfig = TIER_CONFIG[tier];
  const verdictText = VERDICT_TEXT[verdict] ?? VERDICT_TEXT['null'];

  const alertIsActive =
    zone.alertBannerMessage &&
    (!zone.alertExpiresAt || zone.alertExpiresAt.toMillis() > Date.now());

  const inspectionStatusText =
    INSPECTION_STATUS_LABEL[zone.inspectionStatus] ??
    zone.inspectionStatus ??
    null;

  const severity = zone.averageSeverityScore ?? 0;

  return (
    <>
      {/* Backdrop — click closes the dialog */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 199,
          background: 'rgba(15, 23, 42, 0.45)',
        }}
      />

      {/* Dialog wrapper — centers the compact card; side panel attaches to its right */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'stretch',
          gap: 0,
          maxWidth: '95vw',
        }}
      >
        {/* ── Compact card — essentials only ──────────────────────────────── */}
        <div
          role="dialog"
          aria-label={`Zone information: ${zoneName}`}
          aria-modal="true"
          style={{
            position: 'relative',
            width: 320,
            background: '#ffffff',
            borderRadius: expanded ? '16px 0 0 16px' : 16,
            padding: '20px 22px 22px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
            animation: 'fadeScaleIn 0.18s ease-out',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close zone dialog"
            style={{
              position: 'absolute',
              top: 12,
              right: 14,
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

          {/* Tier badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 9999,
              background: tierConfig.color,
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            {tierConfig.label}
          </div>

          {/* Location name */}
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#111827',
              margin: '0 0 4px',
              paddingRight: 28,
            }}
          >
            📍 {zoneName}
          </p>

          {/* Official verdict + severity score, side by side */}
          <div style={{ display: 'flex', gap: 16, margin: '8px 0 4px' }}>
            <div>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Verdict
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>
                {verdictText}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Severity
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>
                {severity} / 10
              </p>
            </div>
          </div>

          {/* Report count */}
          <p style={{ fontSize: 13, color: '#6b7280', margin: '6px 0 14px' }}>
            {zone.reportCount ?? 0}{' '}
            {(zone.reportCount ?? 0) === 1 ? 'report' : 'reports'} submitted
          </p>

          {/* Disaster mode notice — kept compact here */}
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
                padding: '8px 12px',
                fontSize: 12,
                color: '#991b1b',
                fontWeight: 600,
                marginBottom: 14,
                lineHeight: 1.4,
              }}
            >
              <span aria-hidden="true" style={{ flexShrink: 0 }}>🔴</span>
              <span>Disaster Mode Active</span>
            </div>
          )}

          {/* More info toggle */}
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              width: '100%',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: 8,
              padding: '9px 0',
              fontSize: 13,
              fontWeight: 600,
              color: '#374151',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {expanded ? 'Hide details' : 'More info'}
            <span
              aria-hidden="true"
              style={{
                fontSize: 11,
                transform: expanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s',
              }}
            >
              ▶
            </span>
          </button>
        </div>

        {/* ── Expanded side panel — full details + image ──────────────────── */}
        {expanded && (
          <div
            style={{
              width: 300,
              background: '#ffffff',
              borderRadius: '0 16px 16px 0',
              borderLeft: '1px solid #e5e7eb',
              padding: '20px 22px 22px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
              animation: 'fadeSlideInRight 0.18s ease-out',
              overflowY: 'auto',
              maxHeight: '80vh',
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>
              Report Details
            </h3>

            {/* User-submitted image — falls back to a placeholder if absent */}
            <div
              style={{
                width: '100%',
                aspectRatio: '4 / 3',
                borderRadius: 10,
                overflow: 'hidden',
                background: '#f3f4f6',
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {zone.reportImageUrl ? (
                <img
                  src={zone.reportImageUrl}
                  alt={`Submitted report photo for ${zoneName}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: 12, color: '#9ca3af' }}>No photo submitted</span>
              )}
            </div>

            {/* Inspection workflow status */}
            {inspectionStatusText && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Inspection Status
                </p>
                <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>
                  {inspectionStatusText}
                </p>
              </div>
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
                  padding: '10px 12px',
                  fontSize: 13,
                  color: '#92400e',
                  marginBottom: 12,
                  lineHeight: 1.5,
                }}
              >
                <span aria-hidden="true" style={{ flexShrink: 0 }}>⚠️</span>
                <span>{zone.alertBannerMessage}</span>
              </div>
            )}

            {/* Coordinates — useful extra detail in the expanded view */}
            <div>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Coordinates
              </p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0, fontFamily: 'monospace' }}>
                {zone.centerCoordinates?.lat?.toFixed(5)}, {zone.centerCoordinates?.lng?.toFixed(5)}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}