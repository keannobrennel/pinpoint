import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// A handful of varied fake responses so repeated testing doesn't always
// show the exact same placard/severity. Shape matches the real schema
// exactly — see the typedef below.
const MOCK_RESPONSES = [
  {
    isValidHazard: true,
    damageClassification: "structural_crack",
    suggestedPlacard: "restricted_use",
    placardReasoning:
      "The crack is wide, deep, and extends across a wall and around a corner, indicating potential structural distress that warrants professional evaluation.",
    affectedStructureType: "residential building",
    visibleRiskIndicators: [
      "diagonal shear cracks",
      "crack continues around corner",
    ],
    confidenceLevel: "moderate",
    severityScore: 65,
    recommendedAction: "needs_engineer_inspection",
  },
  {
    isValidHazard: true,
    damageClassification: "exposed_rebar",
    suggestedPlacard: "unsafe",
    placardReasoning:
      "Significant spalling has exposed corroded rebar, suggesting the structural member has lost meaningful load-bearing capacity.",
    affectedStructureType: "bridge",
    visibleRiskIndicators: [
      "exposed rebar",
      "spalling concrete",
      "rust staining",
    ],
    confidenceLevel: "high",
    severityScore: 82,
    recommendedAction: "evacuate_immediately",
  },
  {
    isValidHazard: true,
    damageClassification: "non_structural",
    suggestedPlacard: "inspected",
    placardReasoning:
      "The visible damage appears cosmetic and does not show signs of compromising structural integrity.",
    affectedStructureType: "school",
    visibleRiskIndicators: ["surface hairline cracking"],
    confidenceLevel: "moderate",
    severityScore: 15,
    recommendedAction: "monitor",
  },
];

function getMockAssessment() {
  const pick =
    MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
  // Return a fresh copy each time so callers mutating the object (they
  // shouldn't, but just in case) don't affect the next mock call.
  return JSON.parse(JSON.stringify(pick));
}

/**
 * Analyzes a base64-encoded image of structural damage using ATC-20
 * rapid evaluation guidelines.
 *
 * Output shape matches the AIPreAssessment typedef in lib/schemas.js —
 * keep these two files in sync if either one changes.
 *
 * Set MOCK_AI=true in .env.local to skip the real Gemini call and get
 * back fake-but-realistic data instead — useful when you've hit the
 * free-tier quota (20 requests/day) and just need to test the rest of
 * the upload/submit/UI flow.
 *
 * @param {string} base64Image - base64 image data (no data URL prefix)
 * @param {string} mimeType - e.g. 'image/jpeg'
 * @returns {Promise<{
 *   isValidHazard: boolean,
 *   damageClassification: "structural_crack" | "exposed_rebar" | "wall_column_failure" | "debris" | "foundation_issue" | "non_structural" | "none_detected",
 *   suggestedPlacard: "inspected" | "restricted_use" | "unsafe",
 *   placardReasoning: string,
 *   affectedStructureType: string,
 *   visibleRiskIndicators: string[],
 *   confidenceLevel: "high" | "moderate" | "low",
 *   severityScore: number,
 *   recommendedAction: "monitor" | "restrict_access" | "evacuate_immediately" | "needs_engineer_inspection",
 *   rejectionReason?: string
 * }>}
 */
export async function analyzeHazardPhoto(base64Image, mimeType = "image/jpeg") {
  if (process.env.MOCK_AI === "true") {
    return getMockAssessment();
  }

  const prompt = `You are a structural safety AI assistant trained on ATC-20 Rapid Evaluation guidelines.

Your role is to perform an AI-assisted PRELIMINARY visual assessment of uploaded infrastructure damage photos. Your assessment is only a recommendation and does NOT replace the judgment of a licensed civil or structural engineer.

Analyze the uploaded image.

STEP 1 — Validate the Image

Before assessing structural damage, determine whether the image is suitable for analysis.

Reject the image (set "isValidHazard" to false) if ANY of the following apply:

- the photo is too blurry or out of focus to reliably identify structural damage
- the image is too dark, overexposed, or has poor lighting
- the damage is too far away or occupies too little of the image to assess
- the damaged area is obstructed, cropped, or partially hidden
- the image does not clearly show infrastructure or structural damage
- the image is unrelated (people, animals, vehicles, selfies, indoor objects, scenery, memes, etc.)
- the image appears AI-generated, heavily edited, or otherwise unsuitable for reliable structural assessment

Do NOT infer or guess damage that is not clearly visible. If image quality is insufficient for a reliable assessment, reject the image instead of making assumptions.

If the image is rejected:

- set "isValidHazard" to false
- set "damageClassification" to "none_detected"
- set "suggestedPlacard" to "inspected"
- set "confidenceLevel" to "low"
- set "severityScore" to 0
- set "recommendedAction" to "monitor"
- include a clear "rejectionReason" explaining why the image cannot be analyzed

STEP 2 — Structural Assessment

If the image passes validation, perform a visual structural assessment using ATC-20 rapid evaluation principles.

Base your assessment ONLY on damage that is clearly visible in the image.

Do not speculate about hidden structural conditions or damage outside the image.

Respond ONLY with a valid JSON object.

Do NOT include markdown, code fences, explanations, notes, or any extra text.

The JSON MUST exactly follow this schema:

{
  "isValidHazard": true,
  "damageClassification": "structural_crack" | "exposed_rebar" | "wall_column_failure" | "debris" | "foundation_issue" | "non_structural" | "none_detected",
  "suggestedPlacard": "inspected" | "restricted_use" | "unsafe",
  "placardReasoning": "One or two sentence explanation.",
  "affectedStructureType": "e.g. school, residential building, bridge, road, retaining wall",
  "visibleRiskIndicators": [
    "short observation",
    "another observation"
  ],
  "confidenceLevel": "high" | "moderate" | "low",
  "severityScore": 0,
  "recommendedAction": "monitor" | "restrict_access" | "evacuate_immediately" | "needs_engineer_inspection"
}

Severity Score Guide (0–100)

0–20
- No structural damage detected
- Cosmetic or non-structural damage only
- Hairline surface cracks
- Paint damage
- Minor plaster defects

21–45
- Minor structural cracking
- No immediate life-safety concern
- Localized damage
- Building appears stable

Suggested placard:
"inspected"

46–70
- Moderate structural damage
- Visible cracking
- Minor exposed reinforcement
- Localized structural deterioration
- Further engineering inspection recommended

Suggested placard:
"restricted_use"

71–100
- Severe structural damage
- Wall or column failure
- Significant exposed rebar
- Partial collapse
- Foundation issues
- Major falling hazards
- Serious risk to occupants

Suggested placard:
"unsafe"

Use conservative engineering judgment consistent with ATC-20 Rapid Evaluation procedures.

Remember:

- This assessment is only a preliminary AI recommendation.
- The final hazard verification and official placard determination must be made by a licensed engineer.
- Never guess when evidence is unclear.
- Return ONLY valid JSON.`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType,
        data: base64Image,
      },
    },
  ]);

  const text = result.response.text();
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}
