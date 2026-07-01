// app/(app)/incidents/[id]/page.js
"use client";

import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/use-auth-guard";
import ScreenHeader from "@/components/layout/ScreenHeader";
import MetadataTable from "@/components/ui/MetadataTable";
import SectionHeader from "@/components/ui/SectionHeader";
import PhasePill from "@/components/ui/PhasePill";
import StatusBadge from "@/components/ui/StatusBadge";
import ReportCard from "@/components/ui/ReportCard";

// Mock incident — replace with Firestore fetch by params.id when ready.
const MOCK_INCIDENT = {
  id: "1",
  name: "Cracked Walls in San Jose",
  location: "San Jose del Monte, Bulacan",
  phase: "post-disaster",
  status: "for_review",
  verifiedOn: "June 29, 2026 | 10 AM",
  verifiedBy: "Responder 01",
  incidentNumber: "01",
  reportsIncluded: 18,
  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  hasAssessment: false,
};

const MOCK_REPORTS = [
  {
    id: "r1",
    imageUrl: null,
    aiAssessment: { damageClassification: "structural_crack", affectedStructureType: "San Jose", phase: "post-disaster" },
    location: { barangay: "San Jose del Monte", city: "Bulacan" },
    status: "verified",
    reportedAt: "2026-06-29T10:00:00.000Z",
    verifiedByName: "EMILY ELIMY",
  },
  {
    id: "r2",
    imageUrl: null,
    aiAssessment: { damageClassification: "structural_crack", affectedStructureType: "San Jose", phase: "post-disaster" },
    location: { barangay: "San Jose del Monte", city: "Bulacan" },
    status: "verified",
    reportedAt: "2026-06-29T10:00:00.000Z",
    verifiedByName: "EMILY ELIMY",
  },
];

export default function IncidentDetailPage({ params }) {
  const { status } = useAuthGuard(["engineer"]);
  const router = useRouter();

  if (status !== "ready") return null;

  const incident = MOCK_INCIDENT;

  const metaRows = [
    { label: "Incident Name",      value: incident.name },
    { label: "Location",           value: incident.location },
    { label: "Phase",              value: <PhasePill phase={incident.phase} /> },
    { label: "Status",             value: <StatusBadge status={incident.status} /> },
    { label: "Verified on",        value: incident.verifiedOn },
    { label: "Verified by",        value: incident.verifiedBy },
    { label: "Incident Number",    value: incident.incidentNumber },
    { label: "Reports Included",   value: incident.reportsIncluded },
  ];

  return (
    <div className="detail-screen">
      <ScreenHeader title="Incident Details" />

      {/* Metadata card */}
      <div className="detail-screen__card">
        <MetadataTable rows={metaRows} />

        <div className="detail-screen__divider" />

        <SectionHeader icon="fa-solid fa-wand-magic-sparkles">
          Description Summary
        </SectionHeader>
        <p className="detail-screen__body-text">{incident.description}</p>
      </div>

      {/* Included reports list */}
      <SectionHeader>
        Reports Included ({incident.reportsIncluded})
      </SectionHeader>

      <div className="detail-screen__report-list">
        {MOCK_REPORTS.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            showReporter={true}
            onClick={() => router.push(`/reports/${report.id}`)}
          />
        ))}
      </div>

      {/* Action button */}
      <div className="detail-screen__footer">
        {incident.hasAssessment ? (
          <button
            type="button"
            className="detail-screen__action-btn"
            onClick={() => router.push(`/incidents/${params.id}/assessment`)}
          >
            View Assessment Result
          </button>
        ) : (
          <button
            type="button"
            className="detail-screen__action-btn"
            onClick={() => router.push(`/incidents/${params.id}/assessment`)}
          >
            Start Assessment
          </button>
        )}
      </div>
    </div>
  );
}