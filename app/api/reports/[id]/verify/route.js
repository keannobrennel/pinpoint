import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";

// PATCH /api/reports/[id]/verify — responder or engineer marks a report
// as verified true or false after visiting/reviewing the site.
export async function PATCH(request, { params }) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (
    user.role !== "responder" &&
    user.role !== "engineer" &&
    user.role !== "admin"
  ) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json();
  const { verificationStatus, responderNote } = body;

  if (
    verificationStatus !== "verified_true" &&
    verificationStatus !== "verified_false"
  ) {
    return new Response(
      JSON.stringify({
        error: "verificationStatus must be 'verified_true' or 'verified_false'",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const reportRef = adminDb.collection("reports").doc(params.id);
  const doc = await reportRef.get();

  if (!doc.exists) {
    return new Response(JSON.stringify({ error: "Report not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const existing = doc.data();

  if (existing.isAutoVerified) {
    return new Response(
      JSON.stringify({
        error:
          "This report was auto-verified at submission and cannot be re-verified.",
      }),
      { status: 409, headers: { "Content-Type": "application/json" } },
    );
  }

  if (
    existing.verificationStatus === "verified_true" ||
    existing.verificationStatus === "verified_false"
  ) {
    return new Response(
      JSON.stringify({
        error: "This report has already been verified and cannot be changed.",
      }),
      { status: 409, headers: { "Content-Type": "application/json" } },
    );
  }

  const now = new Date().toISOString();

  // Look up the verifier's profile so report cards can display
  // "Verified by <name>, <role>" without an extra read per card.
  const verifierDoc = await adminDb.collection("users").doc(user.uid).get();
  const verifierName = verifierDoc.exists
    ? verifierDoc.data().displayName
    : "Unknown";

  const update = {
    verificationStatus,
    verifiedBy: user.uid,
    verifiedByName: verifierName,
    verifiedByRole: user.role,
    verifiedAt: now,
    responderNote: responderNote ?? null,
  };

  if (verificationStatus === "verified_false") {
    update.status = "verified_false";
    update.archivedAt = now;
    update.archivedReason = "verified_false";
  } else {
    update.status = "responder_verified";
  }

  await reportRef.update(update);

  return new Response(JSON.stringify({ success: true, ...update }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
