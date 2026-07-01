// components/assessment/AssessmentFrameworkContent.jsx
// Framework overview shown at the top of the Info page, above the
// existing verdict-color / PD 1096 / RA 10121 legend in
// AssessmentInfoContent. Explains what the two form types are adapted
// from and what each records.

export default function AssessmentFrameworkContent() {
  return (
    <>
      <p className="assessment-subsection-title">Engineer Assessment Framework</p>
      <p className="assessment-note">
        The assessment form is a digital consolidation of internationally
        recognized rapid assessment standards and Philippine engineering
        regulations. The app pre-fills observable damage using AI image
        analysis, while the licensed engineer remains the final
        decision-maker and confirms, modifies, or rejects all AI-generated
        observations.
      </p>

      <p className="assessment-subsection-title">Form A — Hazard Assessment (Pre-Disaster)</p>
      <p className="assessment-note">
        Adapted from FEMA P-154 Rapid Visual Screening, NSCP occupancy
        categories, and PD 1096 (National Building Code). Records building
        identification, structure and construction type, visual hazard
        screening, observed structural deficiencies, the engineer&apos;s risk
        finding, and a monitoring/referral recommendation. Completed
        assessments feed PinPoint&apos;s hazard database and public hazard
        heatmap.
      </p>

      <p className="assessment-subsection-title">Form B — Post-Disaster Safety Evaluation</p>
      <p className="assessment-note">
        Adapted from the ATC-20 Rapid Evaluation Safety Assessment, RDANA
        (Rapid Damage Assessment and Needs Analysis), PD 1096, and RA 10121.
        Records inspection information, structural damage assessment, an
        occupancy safety verdict (Green/Yellow/Red placard), required
        engineering actions, and RDANA disaster-reporting details. Completed
        assessments support the LGU&apos;s official inspection process and
        disaster-reporting requirements.
      </p>
    </>
  );
}