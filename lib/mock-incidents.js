// lib/mock-incidents.js
// Temporary in-memory mock incident data, keyed by id — stands in for the
// Firestore `incidents` collection until that's wired up. Shared by
// Incident Details, the Assessment wizard, the Assessment Summary page,
// and the PDF export route so they all agree on the same incident data
// for a given id.
//
// id "1" — post-disaster, exercises Form B (4 steps + Review + Finished).
// id "2" — pre-disaster, exercises Form A (3 steps + Review + Finished).

export const MOCK_INCIDENTS = {
  "1": {
    id: "1",
    name: "Cracked Walls in San Jose",
    location: "San Jose del Monte, Bulacan",
    phase: "post-disaster",
    status: "for_review",
    verifiedOn: "June 29, 2026 | 10 AM",
    verifiedBy: "Responder 01",
    incidentNumber: "01",
    reportsIncluded: 18,
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  },
  "2": {
    id: "2",
    name: "Leaning Perimeter Wall in Norzagaray",
    location: "Norzagaray, Bulacan",
    phase: "pre-disaster",
    status: "for_review",
    verifiedOn: "June 30, 2026 | 9 AM",
    verifiedBy: "Responder 02",
    incidentNumber: "02",
    reportsIncluded: 6,
    description:
      "Visible lean on the northeast perimeter wall flagged by three separate resident reports. No recent seismic or storm event on record — routine hazard screening, not a post-disaster inspection.",
  },
};

export function getMockIncident(id) {
  return MOCK_INCIDENTS[id] ?? MOCK_INCIDENTS["1"];
}

// Mock "completed assessment" form data, keyed by incident id — stands in
// for a persisted assessment doc. Used by the Assessment Summary page and
// the PDF export route, which (unlike the wizard) have no live form state
// to read from. Shapes match INITIAL_FORM_A / INITIAL_FORM_B in the wizard.
const MOCK_ASSESSMENT_FORMS = {
  "1": {
    dateTime: "June 30, 2026 | 10 AM",
    siteAddress: "San Jose del Monte, Bulacan – 3023",
    barangayCityProvince: "San Jose del Monte, Bulacan",
    gpsCoordinates: "1212.21, 232.54",
    disasterEventRef: "Incident #01",
    inspectingEngineer: "Engr. Emily Dimakatulog",
    prcLicense: "0123456789",
    lguOboLdrrmo: "San Jose del Monte Office",
    affiliation: "LGU Engineering Office",
    previousPosting: "none",
    areasInspected: "exterior_interior",
    facilityType: ["residential"],
    facilityTypeOther: "",
    damage: { collapse: "none", leaning: "none", racking: "moderate", fallingHazard: "minor", groundMovement: "none" },
    engineerComments: "Moderate racking damage to two columns on the east wall.",
    verdict: "restricted",
    restrictions: "Ground floor only. No entry to second floor pending shoring.",
    furtherActions: ["detailed_eval"],
    furtherActionsOther: "",
    lifelineAffected: "None",
    displacementStatus: "N",
    occupantsAffected: "4",
    occupantsBreakdown: "1 child",
  },
  "2": {
    dateTime: "June 30, 2026 | 9 AM",
    screeningEngineer: "Engr. Emily Dimakatulog",
    prcLicense: "0123456789",
    obo: "Norzagaray Office",
    siteAddress: "Norzagaray, Bulacan",
    gpsCoordinates: "1210.05, 230.88",
    areasInspected: "Exterior Only",
    structureType: "Residential",
    constructionType: "Concrete Frame",
    visibleIrregularities: "Plan irregularity (L-shape wing)",
    fallingHazard: "Loose parapet",
    damage: { visibleCracking: "minor", exposedRebar: "none", foundationSettlement: "minor" },
    otherCondition: "",
    siteSoilNotes: "Slight grade slope toward the wall.",
    proximityFault: "Not near a mapped fault",
    engineerComments: "Monitor lean; no immediate structural failure risk observed.",
    recommendedAction: "monitor",
  },
};

export function getMockAssessmentForm(id) {
  return MOCK_ASSESSMENT_FORMS[id] ?? MOCK_ASSESSMENT_FORMS["1"];
}