// app/api/reports/[id]/verify/route.js

import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";

// PATCH /api/reports/[id]/verify — responder or engineer marks a report
// as verified, false, or reverts it back to unverified/pending.
//
// verificationStatus accepts:
//   "verified_true"  — mark verified (status -> "responder_verified")
//   "verified_false" — mark false (status -> "verified_false", archived, PERMANENT)
//   "unverified"      — revert back to pending (status -> "pending") — this
//                        is the "Unverify" action; toggles freely with
//                        "verified_true" but can never undo "verified_false".
export async function PATCH(request, { params }) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  const routeParams = await params;
  const id = routeParams.id;
  if (!id || typeof id !== "string") {
    return new Response(JSON.stringify({ error: "Missing report id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

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

  const VALID_STATUSES = ["verified_true", "verified_false", "unverified"];
  if (!VALID_STATUSES.includes(verificationStatus)) {
    return new Response(
      JSON.stringify({
        error:
          "verificationStatus must be 'verified_true', 'verified_false', or 'unverified'",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const reportRef = adminDb.collection("reports").doc(id);
  const doc = await reportRef.get();

  if (!doc.exists) {
    return new Response(JSON.stringify({ error: "Report not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const existing = doc.data();

  // Auto-verified reports (submitted by staff) are never touched by this
  // endpoint — unchanged from original behavior.
  if (existing.isAutoVerified) {
    return new Response(
      JSON.stringify({
        error:
          "This report was auto-verified at submission and cannot be re-verified.",
      }),
      { status: 409, headers: { "Content-Type": "application/json" } },
    );
  }

  // A report marked "verified_false" is a permanent, final determination —
  // it can never be reopened through this endpoint, regardless of the
  // requested new value. Everything else (pending <-> verified_true) is
  // freely toggleable, since that's the actual Verify/Unverify UI flow.
  if (existing.verificationStatus === "verified_false") {
    return new Response(
      JSON.stringify({
        error:
          "This report was marked false and cannot be changed.",
      }),
      { status: 409, headers: { "Content-Type": "application/json" } },
    );
  }

  const now = new Date().toISOString();

  let update;

  if (verificationStatus === "unverified") {
    // "Unverify" — revert back to the original pending state.
    update = {
      verificationStatus: "unverified",
      status: "pending",
      verifiedBy: null,
      verifiedByName: null,
      verifiedByRole: null,
      verifiedAt: null,
      responderNote: null,
    };
  } else {
    // Look up the verifier's profile so report cards can display
    // "Verified by <name>, <role>" without an extra read per card.
    const verifierDoc = await adminDb.collection("users").doc(user.uid).get();
    const verifierName = verifierDoc.exists
      ? verifierDoc.data().displayName
      : "Unknown";

    update = {
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
  }

  await reportRef.update(update);

  return new Response(JSON.stringify({ success: true, ...update }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}