// app/(app)/home/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useZones } from "@/hooks/useZones";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import Greeting from "@/components/home/Greeting";
import NearbyAlertsPage from "@/components/home/NearbyAlertsPage";
import MapView from "@/components/map/MapView";
import "@/styles/home.css";
import "@/styles/bottom-nav.css";

// Duration of the overlay slide transform — kept as a named constant so the
// "wait for the animation to finish, THEN navigate" timeout below can never
// drift out of sync with the CSS transition it's timed against.
const OVERLAY_TRANSITION_MS = 320;

// The home map ALWAYS opens showing Metro Manila as a whole, regardless of
// the user's actual GPS position or which nearby alert happens to be first
// in the list. Zooming to "where the user/an alert is" is intentionally
// reserved for explicit user actions — stepping the carousel, tapping
// "Go to" on a card, or the LocateButton + carousel flights on the full
// /map page. Deliberately NOT sourced from useGeolocation() here: that
// hook also triggers a GPS permission prompt as a side effect, which we
// don't want firing just for a value we're not using on this page.
const METRO_MANILA_CENTER = { lat: 14.5995, lng: 120.9842 };
const METRO_MANILA_ZOOM = 11;

export default function HomePage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const isEngineer = role === "engineer";

  const { zones: realZones } = useZones();
  const [isMapInteracting, setIsMapInteracting] = useState(false);

  // ── Entrance animation ──────────────────────────────────────────────────
  // Starts "hidden" (as if mid-exit) and flips to visible one tick after
  // mount, so the overlays visibly slide INTO place every time this page
  // mounts — including when the user taps <BackButton> on /map and lands
  // back here (Next.js fully remounts the page on a route change like
  // (public)/map → (app)/home, so this fires again naturally).
  const [hasEntered, setHasEntered] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setHasEntered(true), 20);
    return () => clearTimeout(id);
  }, []);

  // ── Exit animation — triggered by the "Go to Map" button ───────────────
  // Slides the overlays out first, THEN navigates once the transition has
  // had time to finish, so the transition is actually seen instead of the
  // page unmounting mid-slide.
  const [isLeavingToMap, setIsLeavingToMap] = useState(false);
  const handleGoToMap = () => {
    if (isLeavingToMap) return; // guard against double-taps
    setIsLeavingToMap(true);
    setTimeout(() => router.push("/map"), OVERLAY_TRANSITION_MS);
  };

  // TEMP TEST DATA — remove before merging
  //
  // Wrapped in useMemo so the array keeps stable object identities across
  // renders. This matters less now for the fly-to-flight logic (see
  // requestFocus below, which always wraps in a fresh object anyway), but
  // it's still worth keeping stable so NearbyAlertsPage/ZoneDetailDialog
  // don't re-render on unrelated state changes.
  //
  // placeName / postedBy / distance / timeAgo are the fields NearbyAlertsPage
  // needs for its card. They live directly on the zone object (instead of a
  // separate "alerts" shape) so the exact same object can be handed to
  // ZoneDetailDialog via "View More" with zero remapping.
  const testZones = useMemo(
    () => [
      {
        id: 'test-1',
        centerCoordinates: { lat: 14.5995, lng: 120.9842 }, // Manila
        averageSeverityScore: 2,
        reportCount: 1,
        officialVerdict: 'unsafe',
        inspectionStatus: 'inspector_dispatched',
        alertBannerMessage: 'Building collapse reported. Avoid the area.',
        disasterMode: true,
        placeName: 'Mabini Elementary School',
        postedBy: 'San Jose Engineering Office',
        distance: '300m',
        timeAgo: '2 days ago',
      },
      {
        id: 'test-2',
        centerCoordinates: { lat: 14.6090, lng: 121.0000 }, // Quezon City
        averageSeverityScore: 5,
        reportCount: 4,
        officialVerdict: 'restricted_use',
        inspectionStatus: 'pending_inspection',
        alertBannerMessage: '',
        disasterMode: false,
        placeName: 'Quezon City Hall Annex',
        postedBy: 'QC Engineering Office',
        distance: '1.2km',
        timeAgo: '5 hours ago',
      },
      {
        id: 'test-3',
        centerCoordinates: { lat: 14.5800, lng: 120.9800 }, // Ermita
        averageSeverityScore: 2,
        reportCount: 1,
        officialVerdict: 'inspected',
        inspectionStatus: 'assessed',
        alertBannerMessage: '',
        disasterMode: false,
        placeName: 'Ermita Barangay Hall',
        postedBy: 'Manila DEO',
        distance: '850m',
        timeAgo: '1 day ago',
      },
      {
        id: 'test-4',
        centerCoordinates: { lat: 14.5548, lng: 121.0244 }, // Makati
        averageSeverityScore: 7,
        reportCount: 8,
        officialVerdict: 'unsafe',
        inspectionStatus: 'inspector_dispatched',
        alertBannerMessage: 'Structural damage reported.',
        disasterMode: true,
        placeName: 'Makati Commercial Tower',
        postedBy: 'Makati Engineering Office',
        distance: '2.4km',
        timeAgo: '3 hours ago',
      },
      {
        id: 'test-5',
        centerCoordinates: { lat: 14.6507, lng: 121.0494 }, // Quezon City (Cubao)
        averageSeverityScore: 4,
        reportCount: 3,
        officialVerdict: 'restricted_use',
        inspectionStatus: 'pending_inspection',
        alertBannerMessage: '',
        disasterMode: false,
        placeName: 'Cubao Public Market',
        postedBy: 'QC Engineering Office',
        distance: '1.8km',
        timeAgo: '6 hours ago',
      },
      {
        id: 'test-6',
        centerCoordinates: { lat: 14.5200, lng: 121.0190 }, // Taguig
        averageSeverityScore: 1,
        reportCount: 2,
        officialVerdict: 'inspected',
        inspectionStatus: 'assessed',
        alertBannerMessage: '',
        disasterMode: false,
        placeName: 'Taguig City Hospital',
        postedBy: 'Taguig CDRRMO',
        distance: '3.1km',
        timeAgo: '2 days ago',
      },
      {
        id: 'test-7',
        centerCoordinates: { lat: 14.6760, lng: 121.0437 }, // Caloocan
        averageSeverityScore: 6,
        reportCount: 5,
        officialVerdict: null,
        inspectionStatus: 'no_assessment',
        alertBannerMessage: '',
        disasterMode: false,
        placeName: 'Caloocan North Bridge',
        postedBy: 'Caloocan CDRRMO',
        distance: '4.5km',
        timeAgo: '10 hours ago',
      },
      {
        id: 'test-8',
        centerCoordinates: { lat: 14.5794, lng: 121.0359 }, // Mandaluyong
        averageSeverityScore: 8,
        reportCount: 15,
        officialVerdict: 'unsafe',
        inspectionStatus: 'assessed',
        alertBannerMessage: 'Evacuation in progress.',
        disasterMode: true,
        placeName: 'Mandaluyong Medical Center',
        postedBy: 'Mandaluyong Engineering Office',
        distance: '900m',
        timeAgo: '1 hour ago',
      },
    ],
    []
  );
  const zones = testZones; // swap to `realZones` when done testing

  // Nearby alerts ARE zones — see field comment above. Swap to a filtered
  // subset later (e.g. closest N, or disasterMode-only) once real data lands.
  const nearbyAlerts = zones;

  const stats = {
    activeReports: 4,
    totalReportsToday: 12,
    zonesAssessed: 4,
    reportsThisMonth: 129,
    reportsResolved: 4,
    avgResponseTime: "2 days",
    pendingVerdicts: 4,
    unsafeZones: 129,
    aiConfidenceAvg: 4,
    verdictsThisMonth: "44 m",
  };

  // ── Shared state between MapView, NearbyAlertsPage, and ZoneDetailDialog ──

  // dialogZone: the zone currently shown in the full ZoneDetailDialog.
  // Opened by tapping a map pin/blob (inside MapView) OR tapping
  // "View More" on a nearby alert (NearbyAlertsPage) — same dialog, same state.
  const [dialogZone, setDialogZone] = useState(null);

  // activeAlertIndex: which nearby alert the carousel is currently on.
  const [activeAlertIndex, setActiveAlertIndex] = useState(0);

  // focusZone: the zone the map should fly to. Starts null — the map just
  // sits on the Metro Manila overview on mount, untouched, until the user
  // does something that explicitly asks for a flight: stepping the
  // carousel ("‹"/"›"/dots) or tapping the new "Go to" button.
  //
  // Each request wraps the zone in a FRESH object (spread + a nonce)
  // instead of reusing the array item straight from nearbyAlerts.
  // MapController's flight effect (in MapView.js) keys off object
  // identity — if "Go to" reused the same reference already sitting in
  // focusZone (e.g. tapping it twice on the same card, or after the user
  // panned the map away by hand), the effect simply wouldn't re-run since
  // nothing "changed" as far as React's dependency check is concerned. The
  // nonce guarantees every request is a genuinely new reference, so the
  // flight always fires, every time.
  const [focusZone, setFocusZone] = useState(null);

  const requestFocus = (zone) => {
    if (!zone) return;
    setFocusZone({ ...zone, __focusNonce: Date.now() });
  };

  const handleZoneSelect = (zone) => setDialogZone(zone);
  const handleCloseDialog = () => setDialogZone(null);
  const handleViewMore = (zone) => setDialogZone(zone);

  const handleAlertIndexChange = (newIndex) => {
    if (!nearbyAlerts.length) return;
    const clamped =
      ((newIndex % nearbyAlerts.length) + nearbyAlerts.length) % nearbyAlerts.length;
    setActiveAlertIndex(clamped);
    requestFocus(nearbyAlerts[clamped]);
  };

  // "Go to" button on the NearbyAlertsPage card — re-centers/flies the map
  // to whichever zone is currently showing, WITHOUT changing the carousel
  // index or opening the dialog. Useful when the user has panned the map
  // away manually and wants to snap back to the alert they're looking at.
  const handleGoTo = (zone) => requestFocus(zone);

  // Overlays that should hide/tuck away whenever:
  //   - the map is being interacted with (panning/zooming), OR
  //   - a zone dialog is open (tapped a heatmap blob or an engineer pin), OR
  //   - the user just tapped "Go to Map" and we're mid-exit-transition, OR
  //   - the page hasn't finished its mount-entrance transition yet.
  //
  // This only drives the Greeting card + the bottom overlay — Header is
  // intentionally excluded, see the JSX below.
  const shouldHideOverlays =
    isMapInteracting || !!dialogZone || isLeavingToMap || !hasEntered;

  return (
    <div className="home-page">
      <div className="home-page__map-area">
        <div className="home-page__map-fill">
          <MapView
            zones={zones ?? []}
            userLocation={METRO_MANILA_CENTER}
            defaultZoom={METRO_MANILA_ZOOM}
            isEngineer={isEngineer}
            selectedZone={dialogZone}
            onZoneSelect={handleZoneSelect}
            onClose={handleCloseDialog}
            focusZone={focusZone}
            onMapInteractionChange={setIsMapInteracting}
          />
        </div>

        {/*
          Top overlay — Header stays fixed here, un-animated, for the entire
          lifetime of the page. Only the inner wrap around <Greeting>
          slides. Header keeps its z-index:30 (set in home.css, higher than
          the greeting wrap's z-index:10), so as the greeting card slides
          upward it passes BEHIND the opaque header instead of the two
          moving together.
        */}
        <div className="home-page__top-overlay">
          <Header userName={user?.name} />

          <div
            className="home-page__greeting-wrap"
            style={{
              transform: shouldHideOverlays ? 'translateY(-150%)' : 'translateY(0)',
              transition: `transform ${OVERLAY_TRANSITION_MS}ms ease`,
            }}
          >
            <Greeting userName={user?.name} />
          </div>
        </div>

        {/*
          Bottom overlay — UNCHANGED CSS-driven position (home.css sets
          position:absolute; bottom:0 on this class to float it over the
          map). Do not add inline `position` here — see the earlier bug
          this caused.
        */}
        <div
          className="home-page__bottom-overlay"
          style={{
            transform: shouldHideOverlays ? 'translateY(150%)' : 'translateY(0)',
            transition: `transform ${OVERLAY_TRANSITION_MS}ms ease`,
          }}
        >
          {/*
            "Go to Map" button row — top-right, fully OUTSIDE the Nearby
            Alerts card, with a visible gap above the card.
          */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              margin: '0 16px 12px',
            }}
          >
            <button
              type="button"
              onClick={handleGoToMap}
              aria-label="Open full hazard map"
              title="Open full hazard map"
              style={{
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
                flexShrink: 0,
              }}
            >
              <i
                className="fa-solid fa-map-location-dot"
                aria-hidden="true"
                style={{ fontSize: 18, color: '#2a6697' }}
              />
            </button>
          </div>

          <NearbyAlertsPage
            alerts={nearbyAlerts}
            stats={stats}
            isEngineer={isEngineer}
            activeIndex={activeAlertIndex}
            onIndexChange={handleAlertIndexChange}
            onViewMore={handleViewMore}
            onGoTo={handleGoTo}
          />
        </div>
      </div>

      {/*
        Fixed bottom nav — sibling of .home-page__map-area, not a child of
        it. bottom-nav.css positions it with position:fixed so its own
        placement in the DOM tree doesn't matter for layout, but it needs
        to actually be rendered somewhere: previously it wasn't rendered
        on /home at all (layout.js skips wrapping /home in app-shell,
        so home is fully responsible for supplying its own nav). That's
        why .home-page__bottom-overlay had nothing real to sit above.
      */}
      <BottomNav />
    </div>
  );
}