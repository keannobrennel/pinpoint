// app/(app)/home/page.js
"use client";

import { useAuth } from "@/hooks/useAuth";
import Greeting from "@/components/home/Greeting";
import HomeBottomCard from "@/components/home/HomeBottomCard";
import MapView from "@/components/map/MapView";

export default function HomePage() {
  const { user, role } = useAuth();
  const isEngineer = role === "engineer";

  // TODO: replace with real data fetching (Firestore listener / API call)
  const nearbyAlerts = [
    {
      id: "1",
      location: "Mabini Elementary School",
      status: "Inspection in progress",
      distance: "300m",
      timeAgo: "2 days ago",
    },
  ];

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

  return (
    <div className="home-page">
      <Greeting isEngineer={isEngineer} userName={user?.name} />

      <MapView />

      <HomeBottomCard
        alerts={nearbyAlerts}
        stats={stats}
        isEngineer={isEngineer}
      />
    </div>
  );
}