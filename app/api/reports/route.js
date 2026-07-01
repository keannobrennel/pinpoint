import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";
import { analyzeHazardPhoto } from "@/lib/gemini";
import { calculatePriorityScore } from "@/lib/triage";

// POST /api/reports — submit a new hazard report
export async function POST(request) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  const body = await request.json();
  const {
    base64Image,
    mimeType,
    location,
    city,
    barangay,
    zoneId,
    description,
    mode, // "pre_disaster" | "post_disaster"
  } = body;

  if (!base64Image || !location) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const reportMode = mode === "pre_disaster" ? "pre_disaster" : "post_disaster";

  // Run Gemini Vision analysis using the mode-appropriate framework
  // (FEMA P-154 for pre-disaster screening, ATC-20 for post-disaster).
  const aiAssessment = await analyzeHazardPhoto(
    base64Image,
    mimeType,
    reportMode,
  );

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

  // Upload image to Firebase Storage
  const imageBuffer = Buffer.from(base64Image, "base64");
  const fileName = `reports/${user.uid}/${Date.now()}.jpg`;
  const bucket = adminStorage.bucket();
  const file = bucket.file(fileName);

  await file.save(imageBuffer, {
    metadata: { contentType: mimeType ?? "image/jpeg" },
    public: true,
  });

  const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

  // Get report count in zone for corroboration score
  let reportCount = 0;
  if (zoneId) {
    const zoneReportsSnap = await adminDb
      .collection("reports")
      .where("zoneId", "==", zoneId)
      .get();
    reportCount = zoneReportsSnap.size;
  }

  const priorityScore = calculatePriorityScore(
    aiAssessment,
    reportCount,
    new Date(),
  );

  const isAutoVerifier =
    user.role === "responder" ||
    user.role === "admin" ||
    user.role === "engineer";
  const now = new Date().toISOString();

  const report = {
    submittedBy: user.uid,
    mode: reportMode,
    imageUrl,
    location,
    city: city ?? null,
    barangay: barangay ?? null,
    zoneId: zoneId ?? null,
    description: description ?? "",
    aiAssessment,
    priorityScore,
    status: isAutoVerifier ? "auto_verified" : "pending",
    verificationStatus: isAutoVerifier ? "verified_true" : "unverified",
    verifiedBy: isAutoVerifier ? user.uid : null,
    verifiedByName: isAutoVerifier ? (user.displayName ?? user.email) : null,
    verifiedByRole: isAutoVerifier ? user.role : null,
    verifiedAt: isAutoVerifier ? now : null,
    responderNote: null,
    isAutoVerified: isAutoVerifier,
    archivedAt: null,
    archivedReason: null,
    engineerAssessment: null,
    reportedAt: now,
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

  let query = adminDb.collection("reports").orderBy("priorityScore", "desc");

  if (user.role === "public") {
    // Public users only ever see their own reports.
    query = query.where("submittedBy", "==", user.uid);
  } else if (user.role === "responder") {
    // Responders see everything except archived/false reports.
    query = query.where("status", "!=", "verified_false");
  }
  // engineer/admin: no filter, see everything including archived.

  const snap = await query.get();

  const reports = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return new Response(JSON.stringify(reports), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
