// app/(detail)/incidents/[id]/assessment/page.js
"use client";

import { use, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthGuard } from "@/lib/use-auth-guard";
import ScreenHeader from "@/components/layout/ScreenHeader";
import AssessmentBanner from "@/components/assessment/AssessmentBanner";
import AssessmentProgress from "@/components/assessment/AssessmentProgress";
import AssessmentSectionHeader from "@/components/assessment/AssessmentSectionHeader";
import FormField from "@/components/assessment/FormField";
import RecommendedActionCard from "@/components/assessment/RecommendedActionCard";
import RadioPillGroup from "@/components/assessment/RadioPillGroup";
import CheckboxGroup from "@/components/assessment/CheckboxGroup";
import SeverityMatrix from "@/components/assessment/SeverityMatrix";
import VerdictCard from "@/components/assessment/VerdictCard";
import AssessmentReviewCard from "@/components/assessment/AssessmentReviewCard";
import AssessmentResult from "@/components/assessment/AssessmentResult";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { getMockIncident } from "@/lib/mock-incidents";
import {
  RECOMMENDED_ACTIONS,
  FORM_A_SEVERITY_ROWS,
  PREVIOUS_POSTING_OPTIONS,
  AREAS_INSPECTED_OPTIONS,
  FACILITY_TYPE_OPTIONS,
  FORM_B_SEVERITY_ROWS,
  VERDICT_OPTIONS,
  FURTHER_ACTIONS_OPTIONS,
} from "@/lib/assessment-review";

// Mock incident — mirrors the shape used in (app)/incidents/[id]/page.js.
// Replace with a Firestore fetch by incidentId when ready.
// phase: "post-disaster" -> Form B (4 steps). "pre-disaster" -> Form A (3 steps).

const INITIAL_FORM_A = {
  dateTime: "June 30, 2026 | 10 AM",
  screeningEngineer: "Engr. Emily Dimakatulog",
  prcLicense: "0123456789",
  obo: "",
  siteAddress: "",
  gpsCoordinates: "",
  areasInspected: "",
  structureType: "",
  constructionType: "",
  visibleIrregularities: "",
  fallingHazard: "",
  damage: {},
  otherCondition: "",
  siteSoilNotes: "",
  proximityFault: "",
  engineerComments: "",
  recommendedAction: "monitor",
};

const INITIAL_FORM_B = {
  dateTime: "June 30, 2026 | 10 AM",
  siteAddress: "",
  barangayCityProvince: "",
  gpsCoordinates: "",
  disasterEventRef: "",
  inspectingEngineer: "Engr. Emily Dimakatulog",
  prcLicense: "0123456789",
  lguOboLdrrmo: "",
  affiliation: "",
  previousPosting: "none",
  areasInspected: "exterior_only",
  facilityType: [],
  facilityTypeOther: "",
  damage: {},
  engineerComments: "",
  verdict: "inspected",
  restrictions: "",
  furtherActions: [],
  furtherActionsOther: "",
  lifelineAffected: "",
  displacementStatus: "",
  occupantsAffected: "",
  occupantsBreakdown: "",
};



// ── Review-step helpers ──
// Build the same section/row shape AssessmentReviewCard expects, straight
// from the live in-progress form state. Mirrors the headers already used
// per step above ("I. INFORMATION", "II. ...", etc.) so the review reads
// as a recap, not a re-design.

const SEVERITY_LABELS = { none: "None", minor: "Minor", moderate: "Moderate", severe: "Severe" };

function damageRows(rows, damage = {}) {
  return rows.map((row) => ({
    label: row.label,
    value: damage[row.id] ? SEVERITY_LABELS[damage[row.id]] : "—",
  }));
}

function pillLabel(options, key) {
  return options.find((o) => o.key === key)?.label ?? "—";
}

function pillLabels(options, keys = [], otherValue) {
  if (!keys.length) return "—";
  return keys
    .map((k) => (k === "other" && otherValue ? `Other: ${otherValue}` : pillLabel(options, k)))
    .join(", ");
}

function buildFormAReviewSections(form) {
  return [
    {
      title: "I. INFORMATION",
      rows: [
        { label: "Date and Time of Screening", value: form.dateTime || "—" },
        { label: "Screening Engineer", value: form.screeningEngineer || "—" },
        { label: "PRC License No.", value: form.prcLicense || "—" },
        { label: "LGU Office of the Building Official (OBO)", value: form.obo || "—" },
        { label: "Site Address", value: form.siteAddress || "—" },
        { label: "GPS Coordinates", value: form.gpsCoordinates || "—" },
        { label: "Areas Inspected", value: form.areasInspected || "—" },
        { label: "Structure Type", value: form.structureType || "—" },
        { label: "Construction Type", value: form.constructionType || "—" },
      ],
    },
    {
      title: "II. STRUCTURAL DAMAGE ASSESSMENT",
      rows: [
        { label: "Visible Irregularities", value: form.visibleIrregularities || "—" },
        { label: "Falling-Hazard Elements Present", value: form.fallingHazard || "—" },
        ...damageRows(FORM_A_SEVERITY_ROWS, form.damage),
        { label: "Other Structural Condition Observed", value: form.otherCondition || "—" },
        { label: "Site / Soil Condition Notes", value: form.siteSoilNotes || "—" },
        { label: "Proximity to Mapped Fault", value: form.proximityFault || "—" },
        { label: "Engineer Comments", value: form.engineerComments || "—" },
      ],
    },
    {
      title: "III. RECOMMENDED ACTION",
      rows: [
        {
          label: "Recommended Action",
          value: pillLabel(RECOMMENDED_ACTIONS, form.recommendedAction),
        },
      ],
    },
  ];
}

function buildFormBReviewSections(form) {
  return [
    {
      title: "I. IDENTIFICATION",
      rows: [
        { label: "Date and Time of Inspection", value: form.dateTime || "—" },
        { label: "Site Address", value: form.siteAddress || "—" },
        { label: "Barangay / City / Province", value: form.barangayCityProvince || "—" },
        { label: "GPS Coordinates", value: form.gpsCoordinates || "—" },
        { label: "Disaster Event / Incident Reference", value: form.disasterEventRef || "—" },
        { label: "Inspecting Engineer Name", value: form.inspectingEngineer || "—" },
        { label: "PRC License No.", value: form.prcLicense || "—" },
        { label: "LGU OBO / LDRRMO", value: form.lguOboLdrrmo || "—" },
        { label: "Affiliation", value: form.affiliation || "—" },
        { label: "Previous Posting", value: pillLabel(PREVIOUS_POSTING_OPTIONS, form.previousPosting) },
        { label: "Areas Inspected", value: pillLabel(AREAS_INSPECTED_OPTIONS, form.areasInspected) },
        {
          label: "Facility / Structure Type",
          value: pillLabels(FACILITY_TYPE_OPTIONS, form.facilityType, form.facilityTypeOther),
        },
      ],
    },
    {
      title: "II. STRUCTURAL DAMAGE ASSESSMENT",
      rows: [
        ...damageRows(FORM_B_SEVERITY_ROWS, form.damage),
        { label: "Engineer Comments", value: form.engineerComments || "—" },
      ],
    },
    {
      title: "III. VERDICT",
      rows: [
        { label: "Verdict", value: VERDICT_OPTIONS.find((v) => v.key === form.verdict)?.label ?? "—" },
        { label: "Use / Entry Restrictions", value: form.restrictions || "—" },
        {
          label: "Further Actions Required",
          value: pillLabels(FURTHER_ACTIONS_OPTIONS, form.furtherActions, form.furtherActionsOther),
        },
      ],
    },
    {
      title: "IV. DISASTER REPORTING ROLL-UP",
      rows: [
        { label: "Lifeline / Critical Facility Affected", value: form.lifelineAffected || "—" },
        { label: "Displacement Status (Y/N)", value: form.displacementStatus || "—" },
        { label: "Estimated Occupants Affected", value: form.occupantsAffected || "—" },
        { label: "of which: (Children / Women / PWDs)", value: form.occupantsBreakdown || "—" },
      ],
    },
  ];
}

export default function AssessmentPage({ params }) {
  const routeParams = use(params);
  const incidentId = routeParams.id;
  const { status } = useAuthGuard(["engineer"]);
  const router = useRouter();
  const searchParams = useSearchParams();

  const incident = getMockIncident(incidentId);
  const isPost = incident.phase === "post-disaster";
  const TOTAL_STEPS = isPost ? 4 : 3;

  // Read an initial ?step= so returning from the Info page lands back on
  // the correct part instead of resetting to Part 1. The Info page can
  // also send back "review" or "finished", which aren't numeric steps, so
  // those have to be checked before the numeric parse.
  const stepParam = searchParams.get("step");
  const initialStep = (() => {
    if (stepParam === "review" || stepParam === "finished") return stepParam;
    const parsed = parseInt(stepParam, 10);
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= TOTAL_STEPS ? parsed : 1;
  })();

  // step: 1..TOTAL_STEPS | "review" | "finished"
  const [step, setStep] = useState(initialStep);
  const [formA, setFormA] = useState(INITIAL_FORM_A);
  const [formB, setFormB] = useState(INITIAL_FORM_B);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  if (status !== "ready") return null;

  const isReview = step === "review";
  const isFinished = step === "finished";
  const isDataStep = typeof step === "number";
  const form = isPost ? formB : formA;
  const setForm = isPost ? setFormB : setFormA;

  const updateField = (key) => (value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateDamage = (id, severity) =>
    setForm((prev) => ({ ...prev, damage: { ...prev.damage, [id]: severity } }));

  // The `<-` arrow is hard-wired to Incident Details on every wizard
  // screen — never router.back().
  // The `<-` arrow is pinned to Incident Details — never router.back(),
    // since this route is entered from several places and history depth
    // isn't reliable. Mid-assessment, it discards unsaved progress, so it's
    // gated behind a confirm modal; once finished there's nothing left to
    // lose, so it goes straight through.
    const handleBackArrow = () => {
    if (isFinished) {
        router.push(`/incidents/${incidentId}`);
    } else {
        setShowQuitConfirm(true);
    }
    };

    const confirmQuit = () => {
    setShowQuitConfirm(false);
    router.push(`/incidents/${incidentId}`);
    };

    const cancelQuit = () => setShowQuitConfirm(false);

  // "Cancel" always exits the wizard back to the incident (Part 1 only) —
  // it's a different action from "Back" / "Go Back", which move within
  // the wizard.
  const handleCancel = () => router.push(`/incidents/${incidentId}`);
  const handleFinish = () => setStep("finished");

  const isFirstStep = step === 1;
  const isLastDataStep = step === TOTAL_STEPS;

  const actionLabel =
    RECOMMENDED_ACTIONS.find((a) => a.key === formA.recommendedAction)?.label ?? "—";
  const verdictOption = VERDICT_OPTIONS.find((v) => v.key === formB.verdict);

  const reviewSections = isPost
    ? buildFormBReviewSections(formB)
    : buildFormAReviewSections(formA);

  const infoHref = (fromStep) =>
    `/incidents/${incidentId}/assessment/info?from=${fromStep}`;
  const infoFromValue = isFinished ? "finished" : isReview ? "review" : step;

  return (
    <div className={`detail-screen${isReview || isFinished ? " detail-screen--stacked-footer" : ""}`}>
        <ConfirmDialog
        open={showQuitConfirm}
        title="Quit Assessment?"
        message="Your progress on this assessment will not be saved."
        confirmLabel="Quit"
        cancelLabel="Keep Editing"
        onConfirm={confirmQuit}
        onCancel={cancelQuit}
        />
      <ScreenHeader
        title="Structural Assessment"
        onBack={handleBackArrow}
        action={
          <button
            type="button"
            className="assessment-info-btn"
            aria-label="Assessment info"
            onClick={() => router.push(infoHref(infoFromValue))}
          >
            <i className="fa-solid fa-circle-info" aria-hidden="true" />
          </button>
        }
      />

      {isFinished ? (
        <AssessmentResult
          incident={incident}
          assessment={
            isPost
              ? {
                  assessedOn: "June 29, 2026 | 10 AM",
                  assessedBy: formB.inspectingEngineer,
                  verdictLabel: verdictOption?.label,
                  restrictions: formB.restrictions,
                  engineerComments: formB.engineerComments || "No additional comments.",
                }
              : {
                  assessedOn: "June 29, 2026 | 10 AM",
                  assessedBy: formA.screeningEngineer,
                  recommendedAction: actionLabel,
                  engineerComments: formA.engineerComments || "No additional comments.",
                }
          }
          onViewResult={() => router.push(`/incidents/${incidentId}/assessment/view`)}
          onBackToIncidents={() => router.push("/incidents")}
        />
      ) : isReview ? (
        <>
          <AssessmentSectionHeader>REVIEW ASSESSMENT</AssessmentSectionHeader>
          <AssessmentReviewCard incident={incident} sections={reviewSections} />
        </>
      ) : (
        <>
          <AssessmentBanner
            incidentNumber={incident.incidentNumber}
            name={incident.name}
            location={incident.location}
            phase={incident.phase}
          />
          <AssessmentProgress step={step} totalSteps={TOTAL_STEPS} />

          {/* ══════════════════ FORM A — PRE-DISASTER ══════════════════ */}
          {!isPost && step === 1 && (
            <>
              <AssessmentSectionHeader>I. INFORMATION</AssessmentSectionHeader>
              <FormField
                label="Date and Time of Screening"
                value={formA.dateTime}
                onChange={updateField("dateTime")}
              />
              <FormField
                label="Screening Engineer"
                value={formA.screeningEngineer}
                readOnly
              />
              <FormField label="PRC License No." value={formA.prcLicense} readOnly />
              <FormField
                label="LGU Office of the Building Official (OBO)"
                value={formA.obo}
                onChange={updateField("obo")}
              />
              <FormField
                label="Site Address"
                value={formA.siteAddress}
                onChange={updateField("siteAddress")}
              />
              <FormField
                label="GPS Coordinates"
                value={formA.gpsCoordinates}
                onChange={updateField("gpsCoordinates")}
              />
              <FormField
                label="Areas Inspected"
                value={formA.areasInspected}
                onChange={updateField("areasInspected")}
              />
              <FormField
                label="Structure Type"
                value={formA.structureType}
                onChange={updateField("structureType")}
              />
              <FormField
                label="Construction Type"
                value={formA.constructionType}
                onChange={updateField("constructionType")}
              />
            </>
          )}

          {!isPost && step === 2 && (
            <>
              <AssessmentSectionHeader>
                II. STRUCTURAL DAMAGE ASSESSMENT
              </AssessmentSectionHeader>
              <FormField
                label="Visible Irregularities"
                value={formA.visibleIrregularities}
                onChange={updateField("visibleIrregularities")}
              />
              <FormField
                label="Falling-Hazard Elements Present"
                value={formA.fallingHazard}
                onChange={updateField("fallingHazard")}
              />

              <p className="assessment-subsection-title">
                Crack / Damage Severity Observed
              </p>
              <SeverityMatrix
                rows={FORM_A_SEVERITY_ROWS}
                value={formA.damage}
                onChange={updateDamage}
              />
              <FormField
                label="Other Structural Condition Observed"
                hint="(optional)"
                value={formA.otherCondition}
                onChange={updateField("otherCondition")}
              />

              <FormField
                label="Site / Soil Condition Notes"
                hint="(optional)"
                type="textarea"
                value={formA.siteSoilNotes}
                onChange={updateField("siteSoilNotes")}
              />
              <FormField
                label="Proximity to mapped fault (PHIVOLCS), if known"
                value={formA.proximityFault}
                onChange={updateField("proximityFault")}
              />
              <FormField
                label="Engineer Comments"
                hint="(required if any item above is checked)"
                type="textarea"
                value={formA.engineerComments}
                onChange={updateField("engineerComments")}
              />
            </>
          )}

          {!isPost && step === 3 && (
            <>
              <AssessmentSectionHeader>III. RECOMMENDED ACTION</AssessmentSectionHeader>
              <div className="assessment-options">
                {RECOMMENDED_ACTIONS.map((action) => (
                  <RecommendedActionCard
                    key={action.key}
                    label={action.label}
                    selected={formA.recommendedAction === action.key}
                    onSelect={() => updateField("recommendedAction")(action.key)}
                  />
                ))}
              </div>

              <p className="assessment-note">
                Selecting &ldquo;Refer to OBO for Detailed Evaluation&rdquo; formally
                notifies the LGU Office of the Building Official to schedule a
                due-notice inspection under PD 1096. This finding is{" "}
                <strong>NOT</strong> a placard and carries no legal occupancy
                restriction on its own.
              </p>
            </>
          )}

          {/* ══════════════════ FORM B — POST-DISASTER ══════════════════ */}
          {isPost && step === 1 && (
            <>
              <AssessmentSectionHeader>I. IDENTIFICATION</AssessmentSectionHeader>
              <FormField
                label="Date and Time of Inspection"
                value={formB.dateTime}
                onChange={updateField("dateTime")}
              />
              <FormField
                label="Site Address"
                value={formB.siteAddress}
                onChange={updateField("siteAddress")}
              />
              <FormField
                label="Barangay / City / Province"
                value={formB.barangayCityProvince}
                onChange={updateField("barangayCityProvince")}
              />
              <FormField
                label="GPS Coordinates"
                value={formB.gpsCoordinates}
                onChange={updateField("gpsCoordinates")}
              />
              <FormField
                label="Disaster Event / Incident Reference"
                value={formB.disasterEventRef}
                onChange={updateField("disasterEventRef")}
              />
              <FormField
                label="Inspecting Engineer Name"
                value={formB.inspectingEngineer}
                readOnly
              />
              <FormField label="PRC License No." value={formB.prcLicense} readOnly />
              <FormField
                label="LGU OBO / LDRRMO"
                value={formB.lguOboLdrrmo}
                onChange={updateField("lguOboLdrrmo")}
              />
              <FormField
                label="Affiliation"
                value={formB.affiliation}
                onChange={updateField("affiliation")}
              />

              <div className="assessment-field">
                <span className="assessment-field__label">Previous Posting</span>
                <RadioPillGroup
                  options={PREVIOUS_POSTING_OPTIONS}
                  value={formB.previousPosting}
                  onChange={updateField("previousPosting")}
                />
              </div>

              <div className="assessment-field">
                <span className="assessment-field__label">Areas Inspected</span>
                <RadioPillGroup
                  options={AREAS_INSPECTED_OPTIONS}
                  value={formB.areasInspected}
                  onChange={updateField("areasInspected")}
                />
              </div>

              <div className="assessment-field">
                <span className="assessment-field__label">Facility / Structure Type</span>
                <CheckboxGroup
                  options={FACILITY_TYPE_OPTIONS}
                  value={formB.facilityType}
                  onChange={updateField("facilityType")}
                  otherValue={formB.facilityTypeOther}
                  onOtherChange={updateField("facilityTypeOther")}
                />
              </div>
            </>
          )}

          {isPost && step === 2 && (
            <>
              <AssessmentSectionHeader>
                II. STRUCTURAL DAMAGE ASSESSMENT
              </AssessmentSectionHeader>
              <SeverityMatrix
                rows={FORM_B_SEVERITY_ROWS}
                value={formB.damage}
                onChange={updateDamage}
              />
              <FormField
                label="Engineer Comments"
                type="textarea"
                value={formB.engineerComments}
                onChange={updateField("engineerComments")}
              />
              <p className="assessment-note">
                A Severe rating on any single item, or Moderate ratings across
                multiple items, are grounds for an Unsafe posting — per
                ATC-20 guidance and PD 1096&apos;s dangerous-building threshold.
              </p>
            </>
          )}

          {isPost && step === 3 && (
            <>
              <AssessmentSectionHeader>
                III. VERDICT (ENGINEER DETERMINATION)
              </AssessmentSectionHeader>
              <div className="assessment-options">
                {VERDICT_OPTIONS.map((option) => (
                  <VerdictCard
                    key={option.key}
                    label={option.label}
                    description={option.description}
                    color={option.color}
                    selected={formB.verdict === option.key}
                    onSelect={() => updateField("verdict")(option.key)}
                  />
                ))}
              </div>

              <FormField
                label="Use / Entry Restrictions"
                hint="(record exactly as posted)"
                type="textarea"
                value={formB.restrictions}
                onChange={updateField("restrictions")}
              />

              <div className="assessment-field">
                <span className="assessment-field__label">Further Actions Required</span>
                <CheckboxGroup
                  options={FURTHER_ACTIONS_OPTIONS}
                  value={formB.furtherActions}
                  onChange={updateField("furtherActions")}
                  otherValue={formB.furtherActionsOther}
                  onOtherChange={updateField("furtherActionsOther")}
                />
              </div>
            </>
          )}

          {isPost && step === 4 && (
            <>
              <AssessmentSectionHeader>
                IV. DISASTER REPORTING ROLL-UP
              </AssessmentSectionHeader>
              <p className="assessment-note">
                Supports the LGU/LDRRMO&apos;s Rapid Damage Assessment and
                Needs Analysis (RDANA) report, required within 72 hours of a
                disaster under RA 10121.
              </p>
              <FormField
                label="Lifeline / Critical Facility Affected"
                value={formB.lifelineAffected}
                onChange={updateField("lifelineAffected")}
              />
              <FormField
                label="Displacement Status (Y/N)"
                value={formB.displacementStatus}
                onChange={updateField("displacementStatus")}
              />
              <FormField
                label="Estimated Occupants Affected"
                value={formB.occupantsAffected}
                onChange={updateField("occupantsAffected")}
              />
              <FormField
                label="of which: (Children / Women / PWDs)"
                value={formB.occupantsBreakdown}
                onChange={updateField("occupantsBreakdown")}
              />
            </>
          )}
        </>
      )}

      {/* ══════════════════ FOOTER ══════════════════ */}
      {isReview && (
        <div className="detail-screen__footer">
          <button type="button" className="detail-screen__action-btn" onClick={handleFinish}>
            Finish Assessment
          </button>
          <button
            type="button"
            className="detail-screen__action-btn detail-screen__action-btn--outline"
            onClick={() => setStep(TOTAL_STEPS)}
          >
            Go Back
          </button>
        </div>
      )}

      {isDataStep && (
        <div className="detail-screen__footer detail-screen__footer--row">
          <button
            type="button"
            className="detail-screen__action-btn detail-screen__action-btn--outline"
            onClick={isFirstStep ? handleCancel : () => setStep(step - 1)}
          >
            {isFirstStep ? "Cancel" : "Back"}
          </button>
          <button
            type="button"
            className="detail-screen__action-btn"
            onClick={isLastDataStep ? () => setStep("review") : () => setStep(step + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}