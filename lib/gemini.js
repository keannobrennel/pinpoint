import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Analyzes a base64-encoded image of structural damage.
 * @param {string} base64Image - base64 image data (no data URL prefix)
 * @param {string} mimeType - e.g. 'image/jpeg'
 * @returns {Promise<AIPreAssessment>}
 */
export async function analyzeHazardPhoto(base64Image, mimeType = "image/jpeg") {
  const prompt = `You are a structural safety AI assistant trained on ATC-20 rapid evaluation guidelines.

Analyze this photo of a reported infrastructure hazard or structural damage.

Respond ONLY with a JSON object in this exact format:
{
  "isValidHazard": true or false,
  "damageClassification": "none" | "minor" | "moderate" | "severe" | "destroyed",
  "suggestedPlacard": "inspected" | "restricted" | "unsafe",
  "severityScore": a number from 0 to 10,
  "summary": "one sentence description of the damage observed",
  "confidence": a number from 0 to 1
}

If the photo does not show any infrastructure or structural damage, set isValidHazard to false and severityScore to 0.`;

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
