// app/(app)/incidents/[id]/page.js
"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/use-auth-guard";
import { useIncident } from "@/hooks/useIncident";
import {
  formatIncidentTitle,
  formatIncidentLocation,
  formatIncidentPhase,
  formatIncidentDateTime,
} from "@/lib/incident-format";
import ScreenHeader from "@/components/layout/ScreenHeader";
import MetadataTable from "@/components/ui/MetadataTable";
import SectionHeader from "@/components/ui/SectionHeader";
import PhasePill from "@/components/ui/PhasePill";
import StatusBadge from "@/components/ui/StatusBadge";
import ReportCard from "@/components/ui/ReportCard";

export default function IncidentDetailPage({ params }) {
  const routeParams = use(params);
  const incidentId = routeParams.id;
  const { status } = useAuthGuard(["engineer"]);
  const router = useRouter();

  const { incident, loading, error } = useIncident(incidentId);

  if (status !== "ready") return null;

  if (loading) {
    return (
      <div className="detail-screen">
        <ScreenHeader title="Incident Details" onBack={() => router.push("/incidents")} />
        <p className="reports-list-status">Loading incident...</p>
      </div>
    );
  }

  if (error === "not-found" || !incident) {
    return (
      <div className="detail-screen">
        <ScreenHeader title="Incident Details" onBack={() => router.push("/incidents")} />
        <p className="reports-list-status">Incident not found.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-screen">
        <ScreenHeader title="Incident Details" onBack={() => router.push("/incidents")} />
        <p className="reports-list-status">Couldn&apos;t load this incident. Please try again.</p>
      </div>
    );
  }

  const reportCount = incident.reportCount ?? incident.reportIds?.length ?? 0;

  const metaRows = [
    { label: "Incident Name", value: formatIncidentTitle(incident) },
    { label: "Location", value: formatIncidentLocation(incident) || "—" },
    { label: "Phase", value: <PhasePill phase={formatIncidentPhase(incident)} /> },
    { label: "Status", value: <StatusBadge status={incident.status} /> },
    { label: "First reported", value: formatIncidentDateTime(incident.firstReportedAt) },
    { label: "Reports Included", value: reportCount },
    // Populated once an engineer assessment exists (see lib/schemas.js —
    // Incident.engineerAssessment). Left out entirely until then, same
    // pattern as the "Verified on/by" rows in reports/[id]/page.js.
    ...(incident.engineerAssessment
      ? [
          { label: "Assessed on", value: formatIncidentDateTime(incident.engineerAssessment.assessedAt) },
          { label: "Assessed by", value: incident.engineerAssessment.assessedBy ?? "—" },
        ]
      : []),
  ];

  return (
    <div className="detail-screen">
      <ScreenHeader title="Incident Details" onBack={() => router.push("/incidents")} />

      <div className="detail-screen__card">
        <MetadataTable rows={metaRows} />

        {incident.engineerAssessment?.officialVerdict && (
          <>
            <div className="detail-screen__divider" />
            <SectionHeader icon="fa-solid fa-wand-magic-sparkles">
              Description Summary
            </SectionHeader>
            <p className="detail-screen__body-text">
              {incident.engineerAssessment.officialVerdict}
            </p>
          </>
        )}
      </div>

      <SectionHeader>Reports Included ({reportCount})</SectionHeader>

      <div className="detail-screen__report-list">
        {(incident.reports ?? []).map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            showReporter={true}
            onClick={() => router.push(`/reports/${report.id}`)}
          />
        ))}
      </div>

      <div className="detail-screen__footer">
        {incident.status === "inspected" || incident.status === "resolved" ? (
          <button
            type="button"
            className="detail-screen__action-btn"
            onClick={() => router.push(`/incidents/${incidentId}/assessment/view`)}
          >
            View Assessment Result
          </button>
        ) : incident.status === "open" || incident.status === "inspector_dispatched" ? (
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