// app/(detail)/incidents/[id]/page.js
"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/use-auth-guard";
import ScreenHeader from "@/components/layout/ScreenHeader";
import MetadataTable from "@/components/ui/MetadataTable";
import SectionHeader from "@/components/ui/SectionHeader";
import PhasePill from "@/components/ui/PhasePill";
import StatusBadge from "@/components/ui/StatusBadge";
import ReportCard from "@/components/ui/ReportCard";
import { getMockIncident } from "@/lib/mock-incidents";


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

// remove the old local MOCK_INCIDENT const entirely


export default function IncidentDetailPage({ params }) {
  const routeParams = use(params);
  const incidentId = routeParams.id;
  const { status } = useAuthGuard(["engineer"]);
  const router = useRouter();

  if (status !== "ready") return null;

  const incident = getMockIncident(incidentId);

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
      <ScreenHeader title="Incident Details" onBack={() => router.push("/incidents")} />

      <div className="detail-screen__card">
        <MetadataTable rows={metaRows} />
        <div className="detail-screen__divider" />
        <SectionHeader icon="fa-solid fa-wand-magic-sparkles">
          Description Summary
        </SectionHeader>
        <p className="detail-screen__body-text">{incident.description}</p>
      </div>

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

      <div className="detail-screen__footer">
        {incident.status === "assessed" ? (
          <button
            type="button"
            className="detail-screen__action-btn"
            onClick={() => router.push(`/incidents/${incidentId}/assessment/view`)}
          >
            View Assessment Result
          </button>
        ) : incident.status === "for_review" ? (
          <button
            type="button"
            className="detail-screen__action-btn"
            onClick={() => router.push(`/incidents/${incidentId}/assessment`)}
          >
            Start Assessment
          </button>
        ) : null}
      </div>
    </div>
  );
}