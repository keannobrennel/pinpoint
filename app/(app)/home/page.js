// app/(app)/home/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useZones } from "@/hooks/useZones";
import { useGeolocation } from "@/hooks/useGeolocation";
import Header from "@/components/layout/Header";
import Greeting from "@/components/home/Greeting";
import HomeBottomCard from "@/components/home/HomeBottomCard";
import MapView from "@/components/map/MapView";
import "@/styles/home.css";

// Duration of the overlay slide transform — kept as a named constant so the
// "wait for the animation to finish, THEN navigate" timeout below can never
// drift out of sync with the CSS transition it's timed against.
const OVERLAY_TRANSITION_MS = 320;

export default function HomePage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const isEngineer = role === "engineer";

  const { zones: realZones } = useZones();
  const { location, zoom } = useGeolocation();
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
  // renders. MapController (inside MapView.js) pans/zooms based on object
  // reference changes — recreating this array on every render would cause
  // unwanted re-pans whenever unrelated state (e.g. dialogZone) updates.
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
  // Driving this via "‹ ›" also re-centers the map, through focusZone below.
  const [activeAlertIndex, setActiveAlertIndex] = useState(0);

  const handleZoneSelect = (zone) => setDialogZone(zone);
  const handleCloseDialog = () => setDialogZone(null);
  const handleViewMore = (zone) => setDialogZone(zone);

  const handleAlertIndexChange = (newIndex) => {
    if (!nearbyAlerts.length) return;
    const clamped =
      ((newIndex % nearbyAlerts.length) + nearbyAlerts.length) % nearbyAlerts.length;
    setActiveAlertIndex(clamped);
  };

  // The zone the map should pan/zoom to. Recomputed whenever the carousel
  // index changes — independent of whether the dialog is open or closed.
  const focusZone = nearbyAlerts[activeAlertIndex] ?? null;

  // Overlays (Header+Greeting, HomeBottomCard) should hide whenever:
  //   - the map is being interacted with (panning/zooming), OR
  //   - a zone dialog is open (tapped a heatmap blob or an engineer pin), OR
  //   - the user just tapped "Go to Map" and we're mid-exit-transition, OR
  //   - the page hasn't finished its mount-entrance transition yet.
  // NOTE: dialogZone was dropped from this condition in a previous edit —
  // restored here, since without it the dialog pops open on top of overlays
  // that don't get out of the way.
  const shouldHideOverlays =
    isMapInteracting || !!dialogZone || isLeavingToMap || !hasEntered;

  return (
    <div className="home-page">
      <div className="home-page__map-area">
        <div className="home-page__map-fill">
          <MapView
            zones={zones ?? []}
            userLocation={location}
            defaultZoom={zoom}
            isEngineer={isEngineer}
            selectedZone={dialogZone}
            onZoneSelect={handleZoneSelect}
            onClose={handleCloseDialog}
            focusZone={focusZone}
            onMapInteractionChange={setIsMapInteracting}
          />
        </div>

        {/*
          Top overlay — Header + Greeting slide/hide TOGETHER as one unit.
          Same transform/transition driving the entrance animation (mount),
          the map-drag hide, the dialog-open hide, and the "Go to Map" exit —
          all just different reasons shouldHideOverlays can be true.
        */}
        <div
          className="home-page__top-overlay"
          style={{
            transform: shouldHideOverlays ? 'translateY(-150%)' : 'translateY(0)',
            transition: `transform ${OVERLAY_TRANSITION_MS}ms ease`,
          }}
        >
          <Header userName={user?.name} />
          <Greeting isEngineer={isEngineer} userName={user?.name} />
        </div>

        {/*
          Bottom overlay — UNCHANGED from its original CSS-driven position
          (home.css presumably sets position:absolute; bottom:0 on this
          class to float it over the map). Do not add inline `position`
          here — see the earlier bug this caused (broke the overlay's
          float-over-map behavior entirely).
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
            Alerts card (not overlapping its corner like a FAB anymore),
            with a visible gap above the card. Plain flex row in normal
            flow, so no extra positioned wrapper is needed here — simpler
            and safer than the earlier absolute-positioned version.
          */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: 12, // the "space between them" gap
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

          <HomeBottomCard
            alerts={nearbyAlerts}
            stats={stats}
            isEngineer={isEngineer}
            activeAlertIndex={activeAlertIndex}
            onAlertIndexChange={handleAlertIndexChange}
            onViewMore={handleViewMore}
          />
        </div>
      </div>
    </div>
  );
}