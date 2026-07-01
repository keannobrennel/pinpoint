// components/assessment/AssessmentReviewCard.jsx
// Read-only, section-by-section recap of everything entered in the wizard.
// Used in two places, per the mockup's explicit note that they share the
// same design/CSS/shared components:
//   1. The wizard's own "Review Assessment" step (right before Finish) —
//      sections built live from the in-progress form state.
//   2. The standalone "Assessment Summary" / View Assessment page —
//      sections built from the persisted/mock assessment.
//
// Props:
//   incident  — { incidentNumber, name, location, phase }
//   sections  — [{ title: "I. INFORMATION", rows: [{ label, value }] }]

import AssessmentBanner from "@/components/assessment/AssessmentBanner";
import AssessmentSectionHeader from "@/components/assessment/AssessmentSectionHeader";
import MetadataTable from "@/components/ui/MetadataTable";

export default function AssessmentReviewCard({ incident, sections = [] }) {
  return (
    <div className="detail-screen__card assessment-review-card">
      <AssessmentBanner
        incidentNumber={incident.incidentNumber}
        name={incident.name}
        location={incident.location}
        phase={incident.phase}
      />

      {sections.map((section) => (
        <div key={section.title} className="assessment-review-card__section">
          <AssessmentSectionHeader>{section.title}</AssessmentSectionHeader>
          <MetadataTable rows={section.rows} />
        </div>
      ))}
    </div>
  );
}