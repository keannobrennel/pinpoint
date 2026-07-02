//app/(app)/reports/page.js

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/use-auth-guard";
import { useReports } from "@/hooks/useReports";
import ListScreenShell from "@/components/ui/ListScreenShell";
import ReportCard from "@/components/ui/ReportCard";

const TABS = [
  { key: "all", label: "All" },
  { key: "pre", label: "Pre-disaster" },
  { key: "post", label: "Post-disaster" },
];

// Maps tab keys to the aiAssessment.mode value written by the report
// submission flow (app/(app)/report/page.js).
const TAB_TO_MODE = {
  pre: "pre_disaster",
  post: "post_disaster",
};

export default function ReportsPage() {
  const { profile, status } = useAuthGuard(["responder", "engineer"]);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");

  // useReports already listens live to the Firestore "reports" collection
  // for staff roles (see hooks/useReports.js) — this page is backend-connected
  // as-is, status badges just needed StatusBadge to know about "auto_verified".
  const { reports, loading } = useReports(profile?.role);

  if (status !== "ready") return null;

  const filteredReports =
    activeTab === "all"
      ? reports
      : reports.filter(
          (report) => report.aiAssessment?.mode === TAB_TO_MODE[activeTab],
        );

  return (
    <ListScreenShell
      title="Reports"
      subtitle="Review reports submitted by the residents."
      tabs={TABS}
      defaultTab="all"
      // BUGFIX: ListScreenShell's prop is `onFilterChange`, not `onTabChange`.
      // The old prop name was silently ignored, so tab clicks updated the
      // pill highlight but never re-filtered the list below it.
      onFilterChange={setActiveTab}
    >
      {loading ? (
        <p className="reports-list-status">Loading reports...</p>
      ) : filteredReports.length === 0 ? (
        <p className="reports-list-status">No reports to show.</p>
      ) : (
        filteredReports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            showReporter={true}
            onClick={() => router.push(`/reports/${report.id}`)}
          />
        ))
      )}
    </ListScreenShell>
  );
}