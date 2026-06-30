// app/(app)/report-list/page.js
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ReportsHeader from "@/components/report-list/ReportsHeader";
import ReportsTabs from "@/components/report-list/ReportsTabs";
import MyReportsList from "@/components/report-list/MyReportsList";
import CommunityStats from "@/components/report-list/CommunityStats";

export default function ReportsPage() {
  const { role } = useAuth();
  const isEngineer = role === "engineer";

  const [activeTab, setActiveTab] = useState("reports"); // "reports" | "community"

  return (
    <div className="min-h-screen bg-[#f4f7fd]">
      <ReportsHeader
        isEngineer={isEngineer}
        onFilterClick={() => {
          /* TODO: open filter sheet */
        }}
      />

      <ReportsTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isEngineer={isEngineer}
      />

      {activeTab === "reports" && <MyReportsList isEngineer={isEngineer} />}
      {activeTab === "community" && <CommunityStats isEngineer={isEngineer} />}
    </div>
  );
}