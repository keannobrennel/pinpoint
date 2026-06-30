// app/(app)/home/page.js
"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useZones } from "@/hooks/useZones";
import { useGeolocation } from "@/hooks/useGeolocation";
import Header from "@/components/layout/Header";
import Greeting from "@/components/home/Greeting";
import HomeBottomCard from "@/components/home/HomeBottomCard";
import MapView from "@/components/map/MapView";
import "@/styles/(app)/home.css";

export default function HomePage() {
  const { user, role } = useAuth();
  const isEngineer = role === "engineer";

  const { zones: realZones } = useZones();
  const { location, zoom } = useGeolocation();
  // Add alongside the other useState calls
  const [isMapInteracting, setIsMapInteracting] = useState(false);
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

  return (
    <div className="home-page">
      <Header userName={user?.name} />

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

        // Top overlay (Greeting) — slides up, tucking behind the header
        <div
          className="home-page__top-overlay"
          style={{
            transform: isMapInteracting ? 'translateY(-150%)' : 'translateY(0)',
            transition: 'transform 0.32s ease',
          }}
        >
          <Greeting isEngineer={isEngineer} userName={user?.name} />
        </div>

        <div
          className="home-page__bottom-overlay"
          style={{
            transform: isMapInteracting ? 'translateY(150%)' : 'translateY(0)',
            transition: 'transform 0.32s ease',
          }}
        >
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