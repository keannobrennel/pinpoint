"use client";

import "@/styles/detail.css";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthGuard } from "@/lib/use-auth-guard";
import { useReports } from "@/hooks/useReports";
import ScreenHeader from "@/components/layout/ScreenHeader";
import ListScreenShell from "@/components/ui/ListScreenShell";
import ReportCard from "@/components/ui/ReportCard";

const TABS = [
  { key: "all", label: "All" },
  { key: "pre", label: "Pre-disaster" },
  { key: "post", label: "Post-disaster" },
];

// Maps tab keys to the aiAssessment.mode value written by the report
// submission flow (app/(app)/report/page.js). Same mapping used on
// the Reports page.
const TAB_TO_MODE = {
  pre: "pre_disaster",
  post: "post_disaster",
};

export default function ActivityPage() {
  // Available to any signed-in role — a resident, responder, or engineer
  // all have their own submission history.
  const { profile, status } = useAuthGuard();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState("all");
  const [showVerifiedBanner, setShowVerifiedBanner] = useState(
    searchParams.get("verified") === "1",
  );

  const { reports, loading } = useReports(profile?.role);

  if (status !== "ready") return null;

  // Scope down to reports submitted by the signed-in user.
  // NOTE: adjust `reportedBy` if your report docs key the submitter
  // under a different field (e.g. userId / reporterId).
  const myReports = reports.filter(
    (report) => report.reportedBy === profile.uid,
  );

  const filteredReports =
    activeTab === "all"
      ? myReports
      : myReports.filter(
          (report) => report.aiAssessment?.mode === TAB_TO_MODE[activeTab],
        );

  return (
    <>
      <ScreenHeader title="Activity" />

      <ListScreenShell
        title="My Reports"
        subtitle="Track the status of reports you submitted."
        tabs={TABS}
        defaultTab="all"
        compact
        onFilterChange={setActiveTab}
        onFilterPress={() => {
          /* TODO: open filter modal, if/when one exists */
        }}
      >
        {showVerifiedBanner && (
          <div className="activity-banner activity-banner--success">
            <i className="fa-solid fa-circle-check" aria-hidden="true" />
            <span>Your report has been verified.</span>
            <button
              type="button"
              className="activity-banner__dismiss"
              aria-label="Dismiss"
              onClick={() => setShowVerifiedBanner(false)}
            >
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>
        )}

        {loading ? (
          <p className="reports-list-status">Loading reports...</p>
        ) : filteredReports.length === 0 ? (
          <p className="reports-list-status">
            You haven&apos;t submitted any reports yet.
          </p>
        ) : (
          filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              showReporter={false}
              onClick={() => router.push(`/reports/${report.id}`)}
            />
          ))
        )}
      </ListScreenShell>
    </>
  );
}