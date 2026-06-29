// components/reports/MyReportsList.jsx
"use client";

import { useEffect, useState } from "react";
import ReportCard from "./ReportCard";

export default function MyReportsList({ isEngineer }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        // Residents fetch only their own reports.
        // Engineers fetch ALL community reports awaiting review.
        // The actual filtering should happen server-side (API route checks
        // the session role), this is just which endpoint we call.
        const endpoint = isEngineer ? "/api/reports?scope=all" : "/api/reports?scope=mine";
        const res = await fetch(endpoint);
        const data = await res.json();
        setReports(data.reports ?? []);
      } catch (err) {
        console.error("Failed to load reports:", err);
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, [isEngineer]);

  if (loading) {
    return <p className="loading-text">Loading reports...</p>;
  }

  if (reports.length === 0) {
    return <p className="empty-state">No reports yet.</p>;
  }

  return (
    <div className="reports-list">
      {reports.map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          showReviewButton={isEngineer}
        />
      ))}
    </div>
  );
}