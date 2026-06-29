import { adminDb } from "@/lib/firebase-admin";
import { verifyCallerRole } from "@/lib/verifiy-admin";

/**
 * PATCH /api/admin/engineers/[uid]/reject
 * Body: { reason: string }
 *
 * Admin rejects an engineer's credential.
 * Sets credentialVerificationStatus to "rejected" and stores rejection reason.
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

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { reason } = body ?? {};

  if (!reason || typeof reason !== "string") {
    return Response.json(
      { error: "reason is required and must be a string" },
      { status: 400 },
    );
  }

  try {
    const snap = await adminDb.collection("users").doc(uid).get();

    if (!snap.exists) {
      return Response.json({ error: "Engineer not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    await adminDb.collection("users").doc(uid).update({
      credentialVerificationStatus: "rejected",
      credentialRejectionReason: reason,
      verifiedBy: caller.uid,
      verifiedAt: now,
      updatedAt: now,
    });

    return Response.json(
      {
        uid,
        credentialVerificationStatus: "rejected",
        message: "Engineer credential rejected",
      },
      { status: 200 },
    );
  } catch (err) {
    return Response.json(
      { error: err.message ?? "Failed to reject credential" },
      { status: 500 },
    );
  }
}
