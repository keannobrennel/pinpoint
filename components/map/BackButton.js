'use client';

/**
 * BackButton.js
 *
 * "Back" button for the full /map page — returns to /home. Rendered
 * directly by app/(public)/map/page.js (a sibling of <MapView>, NOT a
 * child of <Map>), since — unlike LocateButton — it has no need for the
 * Google Maps instance (useMap()); it's pure navigation.
 *
 * Sits directly ABOVE LocateButton's target icon (same 44px circle size,
 * same bottom-right stack), per the requested layout: back button on top,
 * locate/target button below it.
 *
 * Navigating home lets app/(app)/home/page.js's own mount-entrance
 * animation handle the "coming back" transition (Header/Greeting/
 * NearbyAlerts sliding back into place) — no exit animation is needed
 * here since /map has no chrome of its own to animate away.
 */

import { useRouter } from 'next/navigation';

export default function BackButton({ style }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push('/home')}
      aria-label="Back to home"
      title="Back to home"
      style={{
        position: 'absolute',
        // 100 (LocateButton's bottom) + 44 (its height) + 12 (gap) = 156
        bottom: 156,
        right: 16,
        zIndex: 150,
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: 'none',
        background: '#ffffff',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        ...style,
      }}
    >
      <i
        className="fa-solid fa-arrow-left"
        aria-hidden="true"
        style={{ fontSize: 16, color: '#2a6697' }}
      />
    </button>
  );
}