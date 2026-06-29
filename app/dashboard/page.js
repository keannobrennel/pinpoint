"use client";

import { useState } from "react";
import { useAuthGuard } from "@/lib/use-auth-guard";
import { useReportsFeed, useZonesFeed } from "@/lib/use-dashboard-data";
import ZoneCard from "@/components/dashboard/ZoneCard";
import TriageFeed from "@/components/dashboard/TriageFeed";

const ALLOWED_ROLES = ["engineer", "admin"];

export default function DashboardPage() {
  const { profile, status } = useAuthGuard(ALLOWED_ROLES);
  const { zones, loading: zonesLoading } = useZonesFeed();
  const { reports, loading: reportsLoading } = useReportsFeed();
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [refreshedAt, setRefreshedAt] = useState(() => new Date());

  if (status !== "ready") {
    return null;
  }

  const handleSelectZone = (zoneId) => {
    setSelectedZoneId((current) => (current === zoneId ? null : zoneId));
  };

  const handleRefresh = () => {
    // Data already streams live via onSnapshot; this just gives the
    // engineer a visible confirmation that the feed is current.
    setRefreshedAt(new Date());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">
              Triage dashboard
            </h1>
            <p className="text-xs text-gray-500">
              Signed in as {profile?.email}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              Updated {refreshedAt.toLocaleTimeString()}
            </span>
            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
          <section>
            <h2 className="mb-2 text-sm font-medium text-gray-700">
              Zones by priority
            </h2>

            {zonesLoading ? (
              <p className="text-sm text-gray-400">Loading zones…</p>
            ) : zones.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center">
                <p className="text-sm text-gray-500">No zones yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {zones.map((zone) => (
                  <ZoneCard
                    key={zone.id}
                    zone={zone}
                    onSelect={handleSelectZone}
                    selected={selectedZoneId === zone.id}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-gray-700">Reports</h2>

            {reportsLoading ? (
              <p className="text-sm text-gray-400">Loading reports…</p>
            ) : (
              <TriageFeed
                reports={reports}
                selectedZoneId={selectedZoneId}
                onClearZoneFilter={() => setSelectedZoneId(null)}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
