// components/assessment/AssessmentResult.jsx
// "Assessment Finished" screen (Part 5) — shown after the wizard's Review
// step is confirmed via "Finish Assessment". Reuses MetadataTable +
// SectionHeader, matching Incident Details' summary-card look.
//
// Props:
//   incident           — { name, location, phase, incidentNumber, reportsIncluded }
//   assessment         — { assessedOn, assessedBy, engineerComments,
//                           recommendedAction? }               (Form A)
//                         { assessedOn, assessedBy, engineerComments,
//                           verdictLabel, restrictions? }       (Form B)
//   onViewResult       — routes to the Assessment Summary / View page
//   onBackToIncidents  — routes to /incidents

import Image from "next/image";
import MetadataTable from "@/components/ui/MetadataTable";
import SectionHeader from "@/components/ui/SectionHeader";
import PhasePill from "@/components/ui/PhasePill";

export default function AssessmentResult({
  incident,
  assessment,
  onViewResult,
  onBackToIncidents,
}) {
  const metaRows = [
    { label: "Incident Name", value: incident.name },
    { label: "Location", value: incident.location },
    { label: "Phase", value: <PhasePill phase={incident.phase} /> },
    { label: "Assessed On", value: assessment.assessedOn },
    { label: "Assessed by", value: assessment.assessedBy },
    { label: "Incident Number", value: incident.incidentNumber },
    { label: "Reports Included", value: incident.reportsIncluded },
  ];

  const isVerdict = assessment.verdictLabel != null;

  return (
    <div className="assessment-result">
      <div className="assessment-result__mascot-wrap">
        <Image
          src="/images/chick1.png"
          alt=""
          width={120}
          height={120}
          className="assessment-result__mascot"
        />
      </div>

      <h1 className="assessment-result__title">Assessment Finished</h1>

      <div className="detail-screen__card">
        <MetadataTable rows={metaRows} />
      </div>

      {isVerdict ? (
        <>
          <SectionHeader>Verdict</SectionHeader>
          <p className="detail-screen__body-text assessment-result__highlight">
            {assessment.verdictLabel}
          </p>

          {assessment.restrictions && (
            <>
              <SectionHeader>Use / Entry Restrictions</SectionHeader>
              <p className="detail-screen__body-text">{assessment.restrictions}</p>
            </>
          )}
        </>
      ) : (
        <>
          <SectionHeader>Recommended Action</SectionHeader>
          <p className="detail-screen__body-text assessment-result__highlight">
            {assessment.recommendedAction}
          </p>
        </>
      )}

      <SectionHeader>Engineer Comments</SectionHeader>
      <p className="detail-screen__body-text">{assessment.engineerComments}</p>

      <div className="detail-screen__footer">
        <button
          type="button"
          className="detail-screen__action-btn detail-screen__action-btn--outline"
          onClick={onViewResult}
        >
          View Assessment Result
        </button>
        <button
          type="button"
          className="detail-screen__action-btn detail-screen__action-btn--outline"
          onClick={onBackToIncidents}
        >
          Back to Incidents
        </button>
      </div>
    </div>
  );
}