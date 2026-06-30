// app/(app)/report-list/page.js
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ReportsHeader from "@/components/report-list/ReportsHeader";
import MyReportsList from "@/components/report-list/MyReportsList";
import CommunityStats from "@/components/report-list/CommunityStats";

export default function ReportsPage() {
  const { role } = useAuth();
  const isEngineer = role === "engineer";
  const isStaff = role === "engineer" || role === "admin" || role === "responder";

  const [activeTab, setActiveTab] = useState("reports"); // "reports" | "community"

  return (
    <div className="reports-page">
      <ReportsHeader isEngineer={isEngineer} />

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

      {activeTab === "reports" && <MyReportsList isEngineer={isStaff} showReviewButton={isEngineer} />}
      {activeTab === "community" && <CommunityStats isEngineer={isEngineer} />}
    </div>
  );
}