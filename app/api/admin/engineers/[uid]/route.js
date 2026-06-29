import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { verifyCallerRole } from "@/lib/verifiy-admin";

/**
 * GET /api/admin/engineers/[uid]
 *
 * Returns a single engineer's full profile.
 * Admin-only.
 */
export async function GET(request, { params }) {
  try {
    await verifyCallerRole(request, ["admin"]);
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

    const data = snap.data();

    // Ensure this is an engineer
    if (data.role !== "engineer") {
      return Response.json(
        { error: "User is not an engineer" },
        { status: 400 },
      );
    }

    return Response.json(
      {
        uid: data.uid,
        email: data.email,
        fullName: data.fullName || "",
        licenseType: data.licenseType || "",
        licenseNumber: data.licenseNumber,
        issuingBody: data.issuingBody || "",
        licenseExpiryDate: data.licenseExpiryDate?.toDate?.() || null,
        credentialVerificationStatus: data.credentialVerificationStatus,
        credentialFileUrl: data.credentialFileUrl || "",
        credentialUploadedAt: data.credentialUploadedAt,
        credentialRejectionReason: data.credentialRejectionReason || "",
        verifiedBy: data.verifiedBy || null,
        verifiedAt: data.verifiedAt,
        enabled: data.enabled,
        lastLoginAt: data.lastLoginAt,
        createdAt: data.createdAt,
      },
      { status: 200 },
    );
  } catch (err) {
    return Response.json(
      { error: err.message ?? "Failed to fetch engineer" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/admin/engineers/[uid]
 * Body: { fullName, licenseType, licenseNumber, issuingBody, licenseExpiryDate, enabled }
 *
 * Updates an engineer's profile information.
 * Admin-only.
 */
export async function PUT(request, { params }) {
  try {
    await verifyCallerRole(request, ["admin"]);
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

  const { fullName, licenseType, licenseNumber, issuingBody, licenseExpiryDate, enabled } = body ?? {};

  try {
    const snap = await adminDb.collection("users").doc(uid).get();

    if (!snap.exists) {
      return Response.json({ error: "Engineer not found" }, { status: 404 });
    }

    const update = {};

    if (fullName !== undefined) update.fullName = fullName;
    if (licenseType !== undefined) update.licenseType = licenseType;
    if (licenseNumber !== undefined) update.licenseNumber = licenseNumber;
    if (issuingBody !== undefined) update.issuingBody = issuingBody;
    if (licenseExpiryDate !== undefined) {
      update.licenseExpiryDate = licenseExpiryDate ? new Date(licenseExpiryDate) : null;
    }
    if (enabled !== undefined) update.enabled = enabled;

    update.updatedAt = new Date().toISOString();

    await adminDb.collection("users").doc(uid).update(update);

    return Response.json(
      { uid, message: "Engineer updated successfully" },
      { status: 200 },
    );
  } catch (err) {
    return Response.json(
      { error: err.message ?? "Failed to update engineer" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/engineers/[uid]
 *
 * Soft-deletes (disables) an engineer account.
 * Note: We don't hard-delete for audit trail purposes; instead, set enabled: false.
 * Admin-only.
 */
export async function DELETE(request, { params }) {
  try {
    await verifyCallerRole(request, ["admin"]);
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

    // Soft delete: disable the account
    await adminDb.collection("users").doc(uid).update({
      enabled: false,
      disabledAt: new Date().toISOString(),
    });

    // Optionally disable the Firebase Auth account as well
    await adminAuth.updateUser(uid, { disabled: true }).catch(() => {});

    return Response.json(
      { uid, message: "Engineer disabled" },
      { status: 200 },
    );
  } catch (err) {
    return Response.json(
      { error: err.message ?? "Failed to delete engineer" },
      { status: 500 },
    );
  }
}
