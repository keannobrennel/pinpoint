import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";
import { analyzeHazardPhoto } from "@/lib/gemini";
import { calculatePriorityScore } from "@/lib/triage";

// POST /api/reports — submit a new hazard report
export async function POST(request) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  const body = await request.json();
  const { base64Image, mimeType, location, zoneId, description } = body;

  if (!base64Image || !location) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Run Gemini Vision analysis
  const aiAssessment = await analyzeHazardPhoto(base64Image, mimeType);

  if (!aiAssessment.isValidHazard) {
    return new Response(
      JSON.stringify({
        error: "Photo does not show a valid hazard",
        aiAssessment,
      }),
      {
        status: 422,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Get report count in zone for corroboration score
  const zoneReportsSnap = await adminDb
    .collection("reports")
    .where("zoneId", "==", zoneId)
    .get();

  const reportCount = zoneReportsSnap.size;

  const priorityScore = calculatePriorityScore(
    aiAssessment,
    reportCount,
    new Date(),
  );

  const report = {
    submittedBy: user.uid,
    location,
    zoneId: zoneId ?? null,
    description: description ?? "",
    aiAssessment,
    priorityScore,
    status: "pending",
    engineerVerdict: null,
    reportedAt: new Date().toISOString(),
  };

  const docRef = await adminDb.collection("reports").add(report);

  return new Response(JSON.stringify({ id: docRef.id, ...report }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

// GET /api/reports — fetch all reports (engineers/admin only)
export async function GET(request) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (user.role === "citizen") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const snap = await adminDb
    .collection("reports")
    .orderBy("priorityScore", "desc")
    .get();

  const reports = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return new Response(JSON.stringify(reports), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
