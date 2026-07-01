import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ---------------------------------------------------------------------------
// Mock data — two sets, one per mode, so MOCK_AI=true still exercises both
// screening and placarding UI paths during dev.
// ---------------------------------------------------------------------------

const MOCK_PRE_DISASTER = [
  {
    isValidHazard: true,
    mode: "pre_disaster",
    damageClassification: "structural_crack",
    isEssentialFacility: true,
    visibleIrregularities: ["soft_story"],
    fallingHazardElements: [],
    affectedStructureType: "school",
    visibleRiskIndicators: [
      "diagonal cracking near ground-floor columns",
      "open ground-floor plan consistent with soft story",
    ],
    confidenceLevel: "moderate",
    severityScore: 58,
    suggestedFinding: "refer_to_obo",
    recommendedAction: "refer_to_obo",
    reasoning:
      "Visible cracking combined with a soft-story irregularity in an essential facility warrants a detailed OBO evaluation before any seismic event.",
  },
  {
    isValidHazard: true,
    mode: "pre_disaster",
    damageClassification: "falling_hazard_element",
    isEssentialFacility: false,
    visibleIrregularities: [],
    fallingHazardElements: ["loose_parapet"],
    affectedStructureType: "commercial building",
    visibleRiskIndicators: ["parapet appears detached from roofline"],
    confidenceLevel: "high",
    severityScore: 40,
    suggestedFinding: "monitor_or_rescreen",
    recommendedAction: "monitor_or_rescreen",
    reasoning:
      "A loose parapet is a falling hazard but does not by itself indicate compromised structural strength; periodic re-screening is appropriate.",
  },
  {
    isValidHazard: true,
    mode: "pre_disaster",
    damageClassification: "non_structural",
    isEssentialFacility: false,
    visibleIrregularities: [],
    fallingHazardElements: [],
    affectedStructureType: "residential building",
    visibleRiskIndicators: ["surface hairline cracking, paint peeling"],
    confidenceLevel: "moderate",
    severityScore: 8,
    suggestedFinding: "no_further_action",
    recommendedAction: "no_further_action",
    reasoning:
      "Damage observed is cosmetic only and shows no indicators of reduced structural strength.",
  },
];

const MOCK_POST_DISASTER = [
  {
    isValidHazard: true,
    mode: "post_disaster",
    damageClassification: "structural_crack",
    isEssentialFacility: false,
    affectedStructureType: "residential building",
    visibleRiskIndicators: [
      "diagonal shear cracks",
      "crack continues around corner",
    ],
    confidenceLevel: "moderate",
    severityScore: 65,
    suggestedPlacard: "restricted_use",
    recommendedAction: "needs_engineer_inspection",
    reasoning:
      "The crack is wide, deep, and extends across a wall and around a corner, indicating potential structural distress that warrants professional evaluation.",
  },
  {
    isValidHazard: true,
    mode: "post_disaster",
    damageClassification: "exposed_rebar",
    isEssentialFacility: false,
    affectedStructureType: "bridge",
    visibleRiskIndicators: [
      "exposed rebar",
      "spalling concrete",
      "rust staining",
    ],
    confidenceLevel: "high",
    severityScore: 82,
    suggestedPlacard: "unsafe",
    recommendedAction: "evacuate_immediately",
    reasoning:
      "Significant spalling has exposed corroded rebar, suggesting the structural member has lost meaningful load-bearing capacity.",
  },
  {
    isValidHazard: true,
    mode: "post_disaster",
    damageClassification: "non_structural",
    isEssentialFacility: true,
    affectedStructureType: "school",
    visibleRiskIndicators: ["surface hairline cracking"],
    confidenceLevel: "moderate",
    severityScore: 15,
    suggestedPlacard: "inspected",
    recommendedAction: "monitor",
    reasoning:
      "The visible damage appears cosmetic and does not show signs of compromising structural integrity.",
  },
];

function getMockAssessment(mode) {
  const pool = mode === "pre_disaster" ? MOCK_PRE_DISASTER : MOCK_POST_DISASTER;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return JSON.parse(JSON.stringify(pick));
}

// ---------------------------------------------------------------------------
// Shared image-validation block — identical rejection logic for both modes
// ---------------------------------------------------------------------------

const VALIDATION_BLOCK = (rejectedDefaults) => `
STEP 1 — Validate the Image

Before assessing the structure, determine whether the image is suitable for analysis.

Reject the image (set "isValidHazard" to false) if ANY of the following apply:

- the photo is too blurry or out of focus to reliably identify structural damage or building features
- the image is too dark, overexposed, or has poor lighting
- the subject is too far away or occupies too little of the image to assess
- the relevant area is obstructed, cropped, or partially hidden
- the image does not clearly show infrastructure or a building
- the image is unrelated (people, animals, vehicles, selfies, indoor objects, scenery, memes, etc.)
- the image appears AI-generated, heavily edited, or otherwise unsuitable for reliable assessment

Do NOT infer or guess conditions that are not clearly visible. If image quality is insufficient, reject the image instead of making assumptions.

If the image is rejected:
${rejectedDefaults}
- include a clear "rejectionReason" explaining why the image cannot be analyzed
`;

// ---------------------------------------------------------------------------
// PRE-DISASTER prompt — FEMA P-154 Rapid Visual Screening
// ---------------------------------------------------------------------------

function buildPreDisasterPrompt() {
  return `You are a structural safety AI assistant trained on FEMA P-154 Rapid Visual Screening (RVS) principles, referencing NSCP occupancy categories.

Your role is to perform an AI-assisted PRELIMINARY pre-disaster screening of a building photo, to help identify structures that may warrant closer engineering review BEFORE a disaster occurs. This is a screening tool, not a damage verdict — it must NEVER issue occupancy restrictions, placards, or safety verdicts. Only a licensed engineer or the LGU Office of the Building Official (OBO) can do that.

Analyze the uploaded image.
${VALIDATION_BLOCK(`- set "isValidHazard" to false
- set "damageClassification" to "none_detected"
- set "isEssentialFacility" to false
- set "visibleIrregularities" to []
- set "fallingHazardElements" to []
- set "confidenceLevel" to "low"
- set "severityScore" to 0
- set "suggestedFinding" to "no_further_action"
- set "recommendedAction" to "no_further_action"`)}

STEP 2 — Rapid Visual Screening

If the image passes validation, screen it using FEMA P-154 principles:

- Identify the apparent occupancy/structure type. Flag "isEssentialFacility" true if it looks like a school, hospital, or evacuation center (NSCP Occupancy Category I — prioritize these).
- Identify visible irregularities: "soft_story" (open ground floor, e.g. parking/retail under residential floors), "plan_irregularity" (L-shape, unbalanced wings, setbacks).
- Identify visible falling-hazard elements: unbraced chimneys, heavy cladding/veneer, loose parapets, loose appendages.
- Rate visible cracking, exposed/corroded rebar, or foundation settlement/tilt if present.
- Base your assessment ONLY on what is clearly visible. Do not speculate about hidden structural conditions.

Respond ONLY with a valid JSON object. Do NOT include markdown, code fences, explanations, or extra text.

The JSON MUST exactly follow this schema:

{
  "isValidHazard": true,
  "mode": "pre_disaster",
  "damageClassification": "structural_crack" | "vertical_irregularity" | "plan_irregularity" | "falling_hazard_element" | "foundation_settlement" | "non_structural" | "none_detected",
  "isEssentialFacility": true,
  "visibleIrregularities": ["soft_story" | "plan_irregularity"],
  "fallingHazardElements": ["unbraced_chimney" | "heavy_cladding" | "loose_parapet" | "loose_appendage"],
  "affectedStructureType": "e.g. school, residential building, bridge, road, retaining wall",
  "visibleRiskIndicators": ["short observation", "another observation"],
  "confidenceLevel": "high" | "moderate" | "low",
  "severityScore": 0,
  "suggestedFinding": "no_further_action" | "monitor_or_rescreen" | "refer_to_obo",
  "recommendedAction": "no_further_action" | "monitor_or_rescreen" | "refer_to_obo",
  "reasoning": "One or two sentence explanation."
}

Screening Priority Score Guide (0–100) — this reflects screening priority, NOT damage severity or occupancy risk

0–20 — No visible irregularities or damage. Suggested finding: "no_further_action"
21–45 — Minor visible cracking or a single falling-hazard element, no irregularities. Suggested finding: "monitor_or_rescreen"
46–100 — Visible irregularity (soft story/plan) OR moderate-to-severe cracking/exposed rebar/foundation settlement, OR essential facility with any of the above. Suggested finding: "refer_to_obo"

Remember:
- This is a PRE-DISASTER screening tool for prioritization only.
- NEVER output "unsafe", "restricted_use", "inspected", or any placard-style verdict — those belong to post-disaster ATC-20 evaluation, not this mode.
- NEVER recommend evacuation — at most, recommend referral to OBO for a detailed evaluation.
- Never guess when evidence is unclear.
- Return ONLY valid JSON.`;
}

// ---------------------------------------------------------------------------
// POST-DISASTER prompt — ATC-20 Rapid Evaluation
// ---------------------------------------------------------------------------

function buildPostDisasterPrompt() {
  return `You are a structural safety AI assistant trained on ATC-20 Rapid Evaluation guidelines.

Your role is to perform an AI-assisted PRELIMINARY post-disaster visual assessment of an infrastructure damage photo. Your assessment is only a recommendation and does NOT replace the judgment of a licensed civil or structural engineer.

Analyze the uploaded image.
${VALIDATION_BLOCK(`- set "isValidHazard" to false
- set "damageClassification" to "none_detected"
- set "isEssentialFacility" to false
- set "suggestedPlacard" to "inspected"
- set "confidenceLevel" to "low"
- set "severityScore" to 0
- set "recommendedAction" to "monitor"`)}

STEP 2 — Structural Assessment

If the image passes validation, perform a visual structural assessment using ATC-20 rapid evaluation principles.

Base your assessment ONLY on damage that is clearly visible in the image. Do not speculate about hidden structural conditions or damage outside the image.

Flag "isEssentialFacility" true if the structure looks like a school, hospital, or evacuation center.

Respond ONLY with a valid JSON object. Do NOT include markdown, code fences, explanations, or extra text.

The JSON MUST exactly follow this schema:

{
  "isValidHazard": true,
  "mode": "post_disaster",
  "damageClassification": "structural_crack" | "exposed_rebar" | "wall_column_failure" | "debris" | "foundation_issue" | "non_structural" | "none_detected",
  "isEssentialFacility": true,
  "suggestedPlacard": "inspected" | "restricted_use" | "unsafe",
  "affectedStructureType": "e.g. school, residential building, bridge, road, retaining wall",
  "visibleRiskIndicators": ["short observation", "another observation"],
  "confidenceLevel": "high" | "moderate" | "low",
  "severityScore": 0,
  "recommendedAction": "monitor" | "restrict_access" | "evacuate_immediately" | "needs_engineer_inspection",
  "reasoning": "One or two sentence explanation."
}

Severity Score Guide (0–100)

0–20 — No structural damage, cosmetic/non-structural only, hairline cracks. Placard: "inspected"
21–45 — Minor structural cracking, no immediate life-safety concern, building appears stable. Placard: "inspected"
46–70 — Moderate structural damage, visible cracking, minor exposed reinforcement, localized deterioration. Placard: "restricted_use"
71–100 — Severe damage: wall/column failure, significant exposed rebar, partial collapse, foundation issues, major falling hazards. Placard: "unsafe"

Use conservative engineering judgment consistent with ATC-20 Rapid Evaluation procedures.

Remember:
- This assessment is only a preliminary AI recommendation.
- The final hazard verification and official placard determination must be made by a licensed engineer.
- Never guess when evidence is unclear.
- Return ONLY valid JSON.`;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Analyzes a base64-encoded image of a structure/hazard, using either
 * FEMA P-154 (pre-disaster screening) or ATC-20 (post-disaster evaluation)
 * guidelines depending on `mode`.
 *
 * Output shape matches the AIPreAssessment typedef in lib/schemas.js —
 * keep these in sync if either changes. Note the schema differs by mode:
 * pre_disaster responses carry `suggestedFinding` + irregularity fields,
 * post_disaster responses carry `suggestedPlacard`. Both share
 * isValidHazard, mode, damageClassification, isEssentialFacility,
 * affectedStructureType, visibleRiskIndicators, confidenceLevel,
 * severityScore, recommendedAction, reasoning, and optional rejectionReason.
 *
 * Set MOCK_AI=true in .env.local to skip the real Gemini call.
 *
 * @param {string} base64Image - base64 image data (no data URL prefix)
 * @param {string} mimeType - e.g. 'image/jpeg'
 * @param {"pre_disaster" | "post_disaster"} mode
 */
export async function analyzeHazardPhoto(
  base64Image,
  mimeType = "image/jpeg",
  mode = "post_disaster",
) {
  const normalizedMode =
    mode === "pre_disaster" ? "pre_disaster" : "post_disaster";

  if (process.env.MOCK_AI === "true") {
    return getMockAssessment(normalizedMode);
  }

  const prompt =
    normalizedMode === "pre_disaster"
      ? buildPreDisasterPrompt()
      : buildPostDisasterPrompt();

  const result = await model.generateContent([
    prompt,
    { inlineData: { mimeType, data: base64Image } },
  ]);

  const text = result.response.text();
  const clean = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);

  // Belt-and-suspenders: make sure mode is always stamped correctly even
  // if the model omits or mangles the field.
  parsed.mode = normalizedMode;
  return parsed;
}
