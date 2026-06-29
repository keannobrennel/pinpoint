/**
 * app/(public)/map/layout.js
 *
 * Layout for the public map route segment.
 *
 * Deliberately a pass-through — no navbar, no padding, no shared chrome.
 * The map page is full-screen (100vw × 100dvh, set in page.js), and any
 * wrapping element here that adds padding or a fixed-height header would
 * break that full-bleed layout and offset the map canvas from the
 * viewport edges.
 *
 * Server component (no 'use client') — it renders no interactivity of its
 * own, so there's no reason to ship it to the client bundle.
 *
 * If the design teammate's shell needs a persistent layout-level element
 * (e.g. a nav bar shared across public routes), it should NOT be added
 * here without checking with them first — it would affect this page's
 * full-screen assumption.
 */
export default function MapLayout({ children }) {
  return children;
}