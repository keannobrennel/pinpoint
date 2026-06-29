import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
/**
 * Analyzes a base64-encoded image of structural damage using ATC-20
 * rapid evaluation guidelines.
 *
 * Output shape matches the AIPreAssessment typedef in lib/schemas.js —
 * keep these two files in sync if either one changes.
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
