/**
 * app/(public)/map/layout.js
 *
 * Full-screen layout for the public map page.
 * Strips all default Next.js app chrome — no padding, no header, no footer.
 * The map fills the entire viewport. The design teammate's overlay UI
 * (greeting card, bottom nav, alerts feed) is positioned absolute inside
 * page.js on top of the map canvas.
 *
 * Why a separate layout.js instead of relying on the root layout?
 * The root layout (app/layout.js) likely applies global padding, a nav bar,
 * or a body background that would bleed under the map. This layout resets
 * all of that for the map route only, without affecting the rest of the app.
 *
 * metadata: Title and description set here appear in the browser tab and
 * are used by social/SEO crawlers. The map page is public, so this matters.
 */

export const metadata = {
  title: 'PinPoint — Live Hazard Map',
  description:
    'Real-time structural hazard and disaster severity map for your area. ' +
    'Report damage, view zone status, and follow official safety advisories.',
};

export default function MapLayout({ children }) {
  return (
    /*
      Outer shell: full viewport, no overflow, no scroll.
      - width: 100vw / height: 100dvh — fills the full visible area.
        Using dvh (dynamic viewport height) is critical on iOS Safari where
        100vh includes the browser chrome, causing the map to be clipped or
        scrollable. dvh accounts for the real usable area.
      - overflow: hidden — prevents any internal layout shift or scroll bleed
        from child components (especially the ZoneInfoPanel slide-up).
      - margin: 0 / padding: 0 — resets any body margin the root layout applies.
      - display: block — ensures no flex gap or grid gap from the root layout
        adds unexpected whitespace around the map canvas.
      - background: #1a1a2e — a dark navy fallback shown while the Google Maps
        SDK loads. Avoids a jarring white flash before tiles appear.
    */
    <main
      style={{
        width: '100vw',
        height: '100dvh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        display: 'block',
        background: '#1a1a2e',
      }}
    >
      {children}
    </main>
  );
}