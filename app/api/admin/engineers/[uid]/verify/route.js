import { adminDb } from "@/lib/firebase-admin";
import { verifyCallerRole } from "@/lib/verify-admin";

/**
 * PATCH /api/admin/engineers/[uid]/verify
 *
 * Admin verifies an engineer's credential.
 * Sets credentialVerificationStatus to "verified" and records who verified it.
 * Admin-only.
 */
export async function PATCH(request, { params }) {
  let caller;
  try {
    caller = await verifyCallerRole(request, ["admin"]);
  } catch (err) {
    return Response.json(
      { error: err.message ?? "Unauthorized" },
      { status: err.status ?? 401 },
    );
  }

  const { uid } = params;

  if (!uid) {
    return Response.json({ error: "uid is required" }, { status: 400 });
  }

  try {
    const snap = await adminDb.collection("users").doc(uid).get();

    if (!snap.exists) {
      return Response.json({ error: "Engineer not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    await adminDb.collection("users").doc(uid).update({
      credentialVerificationStatus: "verified",
      verifiedBy: caller.uid,
      verifiedAt: now,
      updatedAt: now,
    });

    return Response.json(
      {
        uid,
        credentialVerificationStatus: "verified",
        message: "Engineer credential verified",
      },
      { status: 200 },
    );
  } catch (err) {
    return Response.json(
      { error: err.message ?? "Failed to verify credential" },
      { status: 500 },
    );
  }
}
