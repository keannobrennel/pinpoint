// app/(detail)/incidents/[id]/assessment/view/page.js
"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/use-auth-guard";
import ScreenHeader from "@/components/layout/ScreenHeader";
import AssessmentReviewCard from "@/components/assessment/AssessmentReviewCard";
import { getMockIncident, getMockAssessmentForm } from "@/lib/mock-incidents";
import { buildReviewSections } from "@/lib/assessment-review";

export default function ViewAssessmentPage({ params }) {
  const routeParams = use(params);
  const incidentId = routeParams.id;
  const { status } = useAuthGuard(["engineer"]);
  const router = useRouter();

  if (status !== "ready") return null;

  const incident = getMockIncident(incidentId);
  const form = getMockAssessmentForm(incidentId);
  const sections = buildReviewSections(incident.phase, form);

  const handleExportPdf = async () => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}/assessment/pdf`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `assessment-${incident.incidentNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export PDF", err);
    }
  };

  return (
    <div className="detail-screen">
      {/* Reached from multiple places (Incident Details, etc.) — plain
          router.back() is correct here, unlike the wizard's pinned <-. */}
      <ScreenHeader
        title="Assessment Summary"
        onBack={() => router.push(`/incidents/${incidentId}`)}
        action={
          <button
            type="button"
            className="assessment-info-btn"
            aria-label="Assessment info"
            onClick={() => router.push(`/incidents/${incidentId}/assessment/info?from=view`)}
          >
            <i className="fa-solid fa-circle-info" aria-hidden="true" />
          </button>
        }
      />

      <AssessmentReviewCard incident={incident} sections={sections} />

      <div className="detail-screen__footer">
        <button
          type="button"
          className="detail-screen__action-btn detail-screen__action-btn--outline"
          onClick={handleExportPdf}
        >
          Export to PDF
        </button>
      </div>
    </div>
  );
}