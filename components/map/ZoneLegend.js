'use client';

/**
 * ZoneLegend.js
 *
 * Small fixed legend in the bottom-right corner of the map identifying the
 * three heatmap color tiers: Safe (green), Caution (amber), Dangerous (red).
 *
 * Pure presentational component — no props needed since the tier colors
 * are a fixed convention shared with Heatmap.js (TIER_COLOR) and
 * ZoneDetailDialog.js (TIER_CONFIG).
 */

const LEGEND_ITEMS = [
  { label: 'Safe', color: '#22c55e' },
  { label: 'Caution', color: '#f59e0b' },
  { label: 'Dangerous', color: '#ef4444' },
];

export default function ZoneLegend() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        zIndex: 150,
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 10,
        padding: '10px 14px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
        fontSize: 12,
        color: '#374151',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            aria-hidden="true"
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: item.color,
              flexShrink: 0,
            }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}