// lib/assessment-review.js
// Shared option lists + review-section builders for the Structural
// Assessment flow. Single source of truth for three consumers that must
// stay in sync: the wizard's own "Review Assessment" step, the standalone
// Assessment Summary (/assessment/view) page, and the PDF export route.
// Previously this logic was duplicated (and drifted) across those files.

export const RECOMMENDED_ACTIONS = [
  { key: "none", label: "No Further Action" },
  { key: "monitor", label: "Monitor / Re-screen Later" },
  { key: "refer", label: "Refer to OBO for Detailed Evaluation" },
];

export const FORM_A_SEVERITY_ROWS = [
  { id: "visibleCracking", label: "Visible structural cracking" },
  { id: "exposedRebar", label: "Exposed / corroded rebar" },
  { id: "foundationSettlement", label: "Foundation settlement / tilt" },
];

export const PREVIOUS_POSTING_OPTIONS = [
  { key: "none", label: "None" },
  { key: "green", label: "Green" },
  { key: "yellow", label: "Yellow" },
  { key: "red", label: "Red" },
];

export const AREAS_INSPECTED_OPTIONS = [
  { key: "exterior_only", label: "Exterior Only" },
  { key: "exterior_interior", label: "Exterior and Interior" },
];

export const FACILITY_TYPE_OPTIONS = [
  { key: "school", label: "School" },
  { key: "hospital", label: "Hospital" },
  { key: "road_bridge", label: "Road / Bridge" },
  { key: "water_supply", label: "Water Supply System" },
  { key: "market", label: "Market" },
  { key: "residential", label: "Residential" },
  { key: "government", label: "Government Bldg." },
  { key: "other", label: "Other" },
];

export const FORM_B_SEVERITY_ROWS = [
  { id: "collapse", label: "Collapse, partial collapse, or off foundation" },
  { id: "leaning", label: "Building or story leaning" },
  { id: "racking", label: "Racking damage to walls / columns" },
  { id: "fallingHazard", label: "Falling hazard (chimney, parapet, cladding)" },
  { id: "groundMovement", label: "Ground / slope movement or cracking" },
];

export const VERDICT_OPTIONS = [
  {
    key: "inspected",
    label: "INSPECTED (Green)",
    description: "Safe to occupy without restrictions",
    color: "green",
  },
  {
    key: "restricted",
    label: "RESTRICTED USE (Yellow)",
    description: "Limited occupancy; hazards present",
    color: "amber",
  },
  {
    key: "unsafe",
    label: "UNSAFE (Red)",
    description: "Entry prohibited",
    color: "red",
  },
];

export const FURTHER_ACTIONS_OPTIONS = [
  { key: "barricade", label: "Barricade affected area" },
  { key: "detailed_eval", label: "Detailed structural evaluation required" },
  { key: "utility_shutoff", label: "Utility shutoff" },
  { key: "repair_vacate_demo", label: "Repair / vacate / demolition order" },
  { key: "monitor_only", label: "Monitor only" },
  { key: "other", label: "Other" },
];

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

// Builds the section/row shape AssessmentReviewCard expects, from a Form A
// (pre-disaster) form object — same shape used by the wizard's own state
// and by any mock/persisted "completed" Form A assessment.
export function buildFormAReviewSections(form) {
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

// Same, for a Form B (post-disaster) form object.
export function buildFormBReviewSections(form) {
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
        { label: "Est. Occupants Affected", value: form.occupantsAffected || "—" },
        { label: "of which: Children / Women / PWDs", value: form.occupantsBreakdown || "—" },
      ],
    },
  ];
}

// Convenience wrapper for consumers (view page, PDF route) that just have
// a phase and a form object and want the right section builder called.
export function buildReviewSections(phase, form) {
  return phase === "post-disaster" ? buildFormBReviewSections(form) : buildFormAReviewSections(form);
}