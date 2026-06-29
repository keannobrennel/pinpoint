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
    visibleRiskIndicators: ["diagonal shear cracks", "crack continues around corner"],
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
    visibleRiskIndicators: ["exposed rebar", "spalling concrete", "rust staining"],
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
  const pick = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
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
    console.log("[gemini] MOCK_AI is on — skipping real Gemini call.");
    return getMockAssessment();
  }

  const prompt = `You are a structural safety AI assistant trained on ATC-20 rapid evaluation guidelines.

Analyze this photo of a reported infrastructure hazard or structural damage.

Respond ONLY with a JSON object in this exact format, with no preamble or markdown formatting:
{
  "isValidHazard": true or false,
  "damageClassification": "structural_crack" | "exposed_rebar" | "wall_column_failure" | "debris" | "foundation_issue" | "non_structural" | "none_detected",
  "suggestedPlacard": "inspected" | "restricted_use" | "unsafe",
  "placardReasoning": "one or two sentence plain-language explanation for the placard choice",
  "affectedStructureType": "e.g. school, residential building, bridge, road, retaining wall",
  "visibleRiskIndicators": ["short phrases, e.g. diagonal shear cracks", "spalling concrete", "exposed rebar"],
  "confidenceLevel": "high" | "moderate" | "low",
  "severityScore": a number from 0 to 100,
  "recommendedAction": "monitor" | "restrict_access" | "evacuate_immediately" | "needs_engineer_inspection",
  "rejectionReason": "only include this field if isValidHazard is false — plain-language reason, e.g. 'photo does not show structural damage'"
}

Scoring guide for severityScore:
- 0-20: none_detected or cosmetic non_structural issues
- 21-45: minor structural_crack, no immediate risk, suggestedPlacard "inspected"
- 46-70: moderate damage (visible cracking, minor exposed_rebar), suggestedPlacard "restricted_use"
- 71-100: severe damage (wall_column_failure, major exposed_rebar, debris, foundation_issue), suggestedPlacard "unsafe"

If the photo does not show any infrastructure or structural damage at all, set isValidHazard to false, damageClassification to "none_detected", severityScore to 0, and include rejectionReason.`;

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