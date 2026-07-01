'use client';

/**
 * ZoneLegend.js
 *
 * Small fixed legend identifying the three heatmap color tiers: Safe
 * (green), Caution (amber), Dangerous (red).
 *
 * Pure presentational component — the tier colors are a fixed convention
 * shared with Heatmap.js (TIER_COLOR) and ZoneDetailDialog.js (TIER_CONFIG).
 *
 * `position` lets callers place it bottom-right (original default, used
 * nowhere active yet) or top-right (used by the full /map page, per the
 * map requirements — legend stays out of the way of the bottom-left
 * filters and the bottom-right locate button).
 */

const LEGEND_ITEMS = [
  { label: 'Safe', color: '#22c55e' },
  { label: 'Caution', color: '#f59e0b' },
  { label: 'Dangerous', color: '#ef4444' },
];

const POSITION_STYLES = {
  'top-right':    { top: 16, right: 16 },
  'bottom-right': { bottom: 16, right: 16 },
};

export default function ZoneLegend({ position = 'bottom-right' }) {
  const positionStyle = POSITION_STYLES[position] ?? POSITION_STYLES['bottom-right'];

  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyle,
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