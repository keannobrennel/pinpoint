// app/(app)/report-list/page.js
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import MyReportsList from "@/components/report-list/MyReportsList";
import CommunityStats from "@/components/report-list/CommunityStats";

export default function ReportsPage() {
  const { role } = useAuth();
  const isEngineer = role === "engineer";

  // "reports" tab label flips to "Reports" (engineer) vs "My Reports" (resident)
  // but it is still ONE tab / ONE route — not two pages.
  const [activeTab, setActiveTab] = useState("reports"); // "reports" | "community"

  return (
    <div className="reports-page">
      <h1>Reports</h1>
      <p className="reports-subtext">
        {isEngineer
          ? "Review reports submitted by the residents."
          : "Track the status of reports you submitted. See stats of reports in your community."}
      </p>

      <div className="reports-tabs">
        <button
          className={activeTab === "reports" ? "tab active" : "tab"}
          onClick={() => setActiveTab("reports")}
        >
          {isEngineer ? "Reports" : "My Reports"}
        </button>
        <button
          className={activeTab === "community" ? "tab active" : "tab"}
          onClick={() => setActiveTab("community")}
        >
          Community
        </button>
      </div>

      {activeTab === "reports" && <MyReportsList isEngineer={isEngineer} />}
      {activeTab === "community" && <CommunityStats isEngineer={isEngineer} />}
    </div>
  );
}