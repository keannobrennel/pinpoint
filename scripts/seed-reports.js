// scripts/seed-reports.js
//
// Standalone seed script — NOT part of the Next.js app, run directly with
// Node. Creates:
//   1. One test "responder" account (Firebase Auth + Firestore /users doc)
//      so you have someone to log in as who can actually hit the
//      Verify/Unverify button (role check requires responder/engineer/admin).
//   2. Eight mock reports in Firestore /reports covering every
//      status x phase combination the UI needs to render correctly.
//
// Requires the same FIREBASE_ADMIN_SDK service-account JSON your app
// already uses (see lib/firebase-admin.js) available as an env var.
//
// Run with (Node 20.9+, which this project already requires per package.json):
//   node --env-file=.env.local scripts/seed-reports.js
//
// Safe to re-run — it upserts by fixed IDs instead of creating duplicates.

const { cert, initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK);
const app = getApps().length
  ? getApps()[0]
  : initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore(app);
const auth = getAuth(app);

const TEST_RESPONDER = {
  email: "test.responder@pinpoint.dev",
  password: "TestPass123!",
  displayName: "Responder Test Account",
  role: "responder",
};

async function ensureTestUser() {
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(TEST_RESPONDER.email);
    console.log(`[seed] Test user already exists: ${userRecord.uid}`);
  } catch {
    userRecord = await auth.createUser({
      email: TEST_RESPONDER.email,
      password: TEST_RESPONDER.password,
      displayName: TEST_RESPONDER.displayName,
    });
    console.log(`[seed] Created test user: ${userRecord.uid}`);
  }

  await auth.setCustomUserClaims(userRecord.uid, { role: TEST_RESPONDER.role });
  await db.collection("users").doc(userRecord.uid).set(
    {
      uid: userRecord.uid,
      email: TEST_RESPONDER.email,
      displayName: TEST_RESPONDER.displayName,
      role: TEST_RESPONDER.role,
      createdAt: new Date().toISOString(),
    },
    { merge: true },
  );

  return userRecord.uid;
}

function baseAssessment(mode, severity) {
  const isPost = mode === "post_disaster";
  return {
    isValidHazard: true,
    mode,
    damageClassification: isPost ? "structural_crack" : "falling_hazard_element",
    isEssentialFacility: false,
    affectedStructureType: isPost ? "residential building" : "commercial building",
    visibleRiskIndicators: isPost
      ? ["diagonal shear cracks", "crack continues around corner"]
      : ["parapet appears detached from roofline"],
    confidenceLevel: "moderate",
    severityScore: severity,
    ...(isPost
      ? {
          suggestedPlacard: severity > 70 ? "unsafe" : severity > 40 ? "restricted_use" : "inspected",
          recommendedAction: severity > 70 ? "evacuate_immediately" : "needs_engineer_inspection",
        }
      : {
          suggestedFinding: severity > 45 ? "refer_to_obo" : "monitor_or_rescreen",
          recommendedAction: severity > 45 ? "refer_to_obo" : "monitor_or_rescreen",
        }),
    reasoning: "Seed data for local testing — not a real assessment.",
  };
}

// Each entry is upserted at reports/{id}, so re-running this script is safe.
function buildReports(reporterUid) {
  const now = Date.now();
  const hoursAgo = (h) => new Date(now - h * 60 * 60 * 1000).toISOString();

  return [
    {
      id: "seed-pending-pre",
      mode: "pre_disaster",
      status: "pending",
      verificationStatus: "unverified",
      city: "San Jose del Monte City",
      barangay: "Kaypian",
      description: "Loose parapet noticed above the sari-sari store, seems ready to fall.",
      aiAssessment: baseAssessment("pre_disaster", 40),
      reportedAt: hoursAgo(2),
    },
    {
      id: "seed-pending-post",
      mode: "post_disaster",
      status: "pending",
      verificationStatus: "unverified",
      city: "San Jose del Monte City",
      barangay: "Muzon",
      description: "Wide diagonal crack appeared on the perimeter wall after the earthquake.",
      aiAssessment: baseAssessment("post_disaster", 60),
      reportedAt: hoursAgo(5),
    },
    {
      id: "seed-auto-verified-post",
      mode: "post_disaster",
      status: "auto_verified",
      verificationStatus: "verified_true",
      isAutoVerified: true,
      city: "Norzagaray",
      barangay: "Poblacion",
      description: "Filed directly by field engineer during site walk-through.",
      aiAssessment: baseAssessment("post_disaster", 78),
      verifiedByName: "Engr. Emily Dimakatulog",
      verifiedByRole: "engineer",
      verifiedAt: hoursAgo(3),
      reportedAt: hoursAgo(3),
    },
    {
      id: "seed-responder-verified-pre",
      mode: "pre_disaster",
      status: "responder_verified",
      verificationStatus: "verified_true",
      city: "Norzagaray",
      barangay: "Bigte",
      description: "Soft-story ground floor confirmed during screening visit.",
      aiAssessment: baseAssessment("pre_disaster", 55),
      responderNote: "Confirmed on-site; referred to OBO for detailed evaluation.",
      verifiedByName: "Responder Test Account",
      verifiedByRole: "responder",
      verifiedAt: hoursAgo(1),
      reportedAt: hoursAgo(6),
    },
    {
      id: "seed-responder-verified-post",
      mode: "post_disaster",
      status: "responder_verified",
      verificationStatus: "verified_true",
      city: "San Jose del Monte City",
      barangay: "Tungkong Mangga",
      description: "Exposed rebar visible on the bridge support column.",
      aiAssessment: baseAssessment("post_disaster", 82),
      responderNote: "Access restricted pending structural engineer sign-off.",
      verifiedByName: "Responder Test Account",
      verifiedByRole: "responder",
      verifiedAt: hoursAgo(4),
      reportedAt: hoursAgo(8),
    },
    {
      id: "seed-verified-false-pre",
      mode: "pre_disaster",
      status: "verified_false",
      verificationStatus: "verified_false",
      city: "Angat",
      barangay: "San Roque",
      description: "Reported crack turned out to be cosmetic paint peeling only.",
      aiAssessment: baseAssessment("pre_disaster", 10),
      responderNote: "Site visit found no structural issue. Closed as false report.",
      verifiedByName: "Responder Test Account",
      verifiedByRole: "responder",
      verifiedAt: hoursAgo(10),
      archivedAt: hoursAgo(10),
      archivedReason: "verified_false",
      reportedAt: hoursAgo(12),
    },
    {
      id: "seed-verified-false-post",
      mode: "post_disaster",
      status: "verified_false",
      verificationStatus: "verified_false",
      city: "Angat",
      barangay: "Marungko",
      description: "Reported collapse was actually a fallen tree branch, not the wall.",
      aiAssessment: baseAssessment("post_disaster", 15),
      responderNote: "Not a structural hazard. Closed as false report.",
      verifiedByName: "Responder Test Account",
      verifiedByRole: "responder",
      verifiedAt: hoursAgo(20),
      archivedAt: hoursAgo(20),
      archivedReason: "verified_false",
      reportedAt: hoursAgo(22),
    },
    {
      id: "seed-pending-pre-2",
      mode: "pre_disaster",
      status: "pending",
      verificationStatus: "unverified",
      city: "Norzagaray",
      barangay: "Partida",
      description: "Hairline cracking near the school's ground floor columns.",
      aiAssessment: baseAssessment("pre_disaster", 25),
      reportedAt: hoursAgo(1),
    },
  ];
}

async function seedReports(reporterUid) {
  const reports = buildReports(reporterUid);
  const batch = db.batch();

  for (const r of reports) {
    const { id, ...data } = r;
    const ref = db.collection("reports").doc(id);
    batch.set(
      ref,
      {
        submittedBy: reporterUid,
        imageUrl: null,
        location: { lat: 14.8136, lng: 121.0453 },
        zoneId: null,
        priorityScore: data.aiAssessment.severityScore,
        isAutoVerified: false,
        responderNote: null,
        verifiedBy: null,
        verifiedByName: null,
        verifiedByRole: null,
        verifiedAt: null,
        archivedAt: null,
        archivedReason: null,
        engineerAssessment: null,
        ...data,
      },
      { merge: true },
    );
  }

  await batch.commit();
  console.log(`[seed] Wrote ${reports.length} reports.`);
}

async function main() {
  const reporterUid = await ensureTestUser();
  await seedReports(reporterUid);
  console.log("\n[seed] Done. Log in with:");
  console.log(`  email:    ${TEST_RESPONDER.email}`);
  console.log(`  password: ${TEST_RESPONDER.password}`);
}

main().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});