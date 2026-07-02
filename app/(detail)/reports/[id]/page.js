// app/(app)/reports/[id]/page.js
"use client";

import { use } from "react";
import { useAuthGuard } from "@/lib/use-auth-guard";
import { useReport } from "@/hooks/useReport";
import { formatReportTitle, formatReportLocation, formatReportDateTime } from "@/lib/report-format";
import ScreenHeader from "@/components/layout/ScreenHeader";
import MetadataTable from "@/components/ui/MetadataTable";
import SectionHeader from "@/components/ui/SectionHeader";
import PhasePill from "@/components/ui/PhasePill";
import StatusBadge from "@/components/ui/StatusBadge";
import Image from "next/image";

export default function ReportDetailPage({ params }) {
  const { id } = use(params);
  const { profile, status } = useAuthGuard(["responder", "engineer"]);
  const { report, loading, error } = useReport(id);

  if (status !== "ready") return null;

  if (loading) {
    return (
      <div className="detail-screen">
        <ScreenHeader title="Report Details" />
        <p className="reports-list-status">Loading report...</p>
      </div>
    );
  }

  if (error === "not-found" || !report) {
    return (
      <div className="detail-screen">
        <ScreenHeader title="Report Details" />
        <p className="reports-list-status">Report not found.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-screen">
        <ScreenHeader title="Report Details" />
        <p className="reports-list-status">Couldn&apos;t load this report. Please try again.</p>
      </div>
    );
  }

  const isVerified = report.status === "verified" || report.status === "responder_verified";
  const isResponder = profile?.role === "responder";
  const isEngineer = profile?.role === "engineer";

  const metaRows = [
    { label: "Report Name", value: formatReportTitle(report) },
    { label: "Location", value: formatReportLocation(report) || "—" },
    // NOTE: aiAssessment.phase isn't defined in lib/schemas.js (only
    // aiAssessment.mode is). Falls back to "pre-disaster" until that's
    // resolved — see the mode-vs-phase note also flagged in ReportCard.jsx.
    { label: "Phase", value: <PhasePill phase={report.aiAssessment?.phase ?? "pre-disaster"} /> },
    { label: "Status", value: <StatusBadge status={report.status} /> },
    { label: "Reported on", value: formatReportDateTime(report.reportedAt) },
    // submittedByName is resolved client-side in useReport.js by looking
    // up the users/{uid} doc — falls back to the raw uid if that lookup
    // fails (e.g. security rules deny it, or the user doc is gone).
    { label: "Reported by", value: report.submittedByName ?? report.submittedBy ?? "—" },
    ...(isVerified
      ? [
          { label: "Verified on", value: formatReportDateTime(report.verifiedAt) },
          { label: "Verified by", value: report.verifiedByName ?? "—" },
        ]
      : []),
  ];

  return (
    <div className="detail-screen">
      <ScreenHeader title="Report Details" />

      {/* Verified banner */}
      {isVerified && (
        <div className="detail-screen__verified-banner">
          <i className="fa-solid fa-circle-check" aria-hidden="true" />
          Report has been verified.
        </div>
      )}

      {/* Metadata card */}
      <div className="detail-screen__card">
        <MetadataTable rows={metaRows} />

        <div className="detail-screen__divider" />

        <SectionHeader>Description</SectionHeader>
        <p className="detail-screen__body-text">
          {report.description || "No description provided."}
        </p>

        {/* Responder Comments — only shown after verification */}
        {isVerified && report.responderNote && (
          <>
            <SectionHeader>Responder Comments</SectionHeader>
            <p className="detail-screen__body-text">{report.responderNote}</p>
          </>
        )}
      </div>

      {/* Photo Preview */}
      <SectionHeader>Photo Preview</SectionHeader>
      <div className="detail-screen__photo">
        {report.imageUrl ? (
          <Image
            src={report.imageUrl}
            alt="Report photo"
            fill
            className="detail-screen__photo-img"
          />
        ) : (
          <div className="detail-screen__photo-placeholder">
            <i className="fa-solid fa-image" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Action button — responder/engineer can verify or unverify.
          NOTE: click handler intentionally left unwired. auth-middleware.js
          suggests verification is meant to go through an authenticated API
          route (adminDb write) rather than a direct client-side Firestore
          write — say the word if you want that route + the handler built. */}
      {(isResponder || isEngineer) && (
        <div className="detail-screen__footer">
          <button
            type="button"
            className={`detail-screen__action-btn${isVerified ? " detail-screen__action-btn--outline" : ""}`}
          >
            {isVerified ? "Unverify Report" : "Verify Report"}
          </button>
        </div>
      )}
    </div>
  );
}