// app/(app)/reports/[id]/page.js
"use client";

import { useAuthGuard } from "@/lib/use-auth-guard";
import ScreenHeader from "@/components/layout/ScreenHeader";
import MetadataTable from "@/components/ui/MetadataTable";
import SectionHeader from "@/components/ui/SectionHeader";
import PhasePill from "@/components/ui/PhasePill";
import StatusBadge from "@/components/ui/StatusBadge";
import Image from "next/image";

// Mock report — replace with Firestore fetch by params.id when ready.
const MOCK_REPORT = {
  id: "1",
  name: "Cracked Wall in San Jose",
  location: "San Jose del Monte, Bulacan",
  phase: "post-disaster",
  status: "pending",
  reportedOn: "June 29, 2026 | 10 AM",
  reportedBy: "Resident 01",
  reportNumber: "01",
  verifiedOn: null,
  verifiedBy: null,
  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  imageUrl: null,
  responderNote: null,
};

export default function ReportDetailPage({ params }) {
  const { profile, status } = useAuthGuard(["responder", "engineer"]);

  if (status !== "ready") return null;

  const report = MOCK_REPORT;
  const isVerified = report.status === "verified" || report.status === "responder_verified";
  const isResponder = profile?.role === "responder";
  const isEngineer = profile?.role === "engineer";

  const metaRows = [
    { label: "Report Name", value: report.name },
    { label: "Location",    value: report.location },
    { label: "Phase",       value: <PhasePill phase={report.phase} /> },
    { label: "Status",      value: <StatusBadge status={report.status} /> },
    { label: "Reported on", value: report.reportedOn },
    { label: "Reported by", value: report.reportedBy },
    { label: "Report Number", value: report.reportNumber },
    ...(isVerified ? [
      { label: "Verified on", value: report.verifiedOn },
      { label: "Verified by", value: report.verifiedBy },
    ] : []),
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
        <p className="detail-screen__body-text">{report.description}</p>

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

      {/* Action button — responder/engineer can verify or unverify */}
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