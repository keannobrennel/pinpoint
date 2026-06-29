// components/reports/CommunityStats.jsx
"use client";

import { useEffect, useState } from "react";

function StatCard({ label, value, color }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className={`stat-value ${color ? `text-${color}` : ""}`}>{value}</p>
    </div>
  );
}

export default function CommunityStats({ isEngineer }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/zones?summary=true");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to load community stats:", err);
      }
    }
    loadStats();
  }, []);

  if (!stats) {
    return <p className="loading-text">Loading community stats...</p>;
  }

  return (
    <div className="community-stats">
      <div className="community-banner">
        <div>
          <p className="community-banner-title">
            Your Community <span className="highlight">at a Glance</span>
          </p>
          <p className="community-banner-meta">As of today, {stats.asOf}</p>
        </div>
      </div>

      <div className="stats-grid">
        {isEngineer ? (
          <>
            <StatCard label="Pending Verdicts" value={stats.pendingVerdicts} color="orange" />
            <StatCard label="Unsafe Zones" value={stats.unsafeZones} color="red" />
            <StatCard label="AI Confidence Avg." value={stats.aiConfidenceAvg} color="green" />
            <StatCard label="Your Verdicts This Month" value={stats.verdictsThisMonth} color="red" />
          </>
        ) : (
          <>
            <StatCard label="Active reports" value={stats.activeReports} color="orange" />
            <StatCard label="Total Reports Today" value={stats.totalReportsToday} />
            <StatCard label="Zones Assessed" value={stats.zonesAssessed} color="orange" />
            <StatCard label="Reports this Month" value={stats.reportsThisMonth} />
            <StatCard label="Reports Resolved" value={stats.reportsResolved} color="green" />
            <StatCard label="Avg. Response Time" value={stats.avgResponseTime} color="blue" />
            <StatCard label="Nearest Active Hazard" value={stats.nearestActiveHazard} color="red" />
            <StatCard label="Most Reported Zone" value={stats.mostReportedZone} />
          </>
        )}
      </div>
    </div>
  );
}