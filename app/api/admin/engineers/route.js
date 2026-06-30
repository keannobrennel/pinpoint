import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { verifyCallerRole } from "@/lib/verify-admin";

/**
 * POST /api/admin/engineers
 * Body: { email, password, fullName, licenseType, licenseNumber, issuingBody, licenseExpiryDate, credentialFileUrl }
 *
 * Creates a Firebase Auth account + matching users/{uid} profile with engineer role.
 * Credential verification status starts as "pending".
 * Admin-only.
 */
export async function POST(request) {
  try {
    await verifyCallerRole(request, ["admin"]);
  } catch (err) {
    return Response.json(
      { error: err.message ?? "Unauthorized" },
      { status: err.status ?? 401 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    email,
    password,
    fullName,
    licenseType,
    licenseNumber,
    issuingBody,
    licenseExpiryDate,
    credentialFileUrl,
  } = body ?? {};

  if (!email || typeof email !== "string") {
    return Response.json({ error: "email is required" }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return Response.json(
      { error: "password is required and must be at least 8 characters" },
      { status: 400 },
    );
  }
  if (!fullName || typeof fullName !== "string") {
    return Response.json({ error: "fullName is required" }, { status: 400 });
  }
  if (!licenseNumber || typeof licenseNumber !== "string") {
    return Response.json({ error: "licenseNumber is required" }, { status: 400 });
  }

  let userRecord;
  try {
    userRecord = await adminAuth.createUser({ email, password });
  } catch (err) {
    const status = err.code === "auth/email-already-exists" ? 409 : 500;
    return Response.json(
      { error: err.message ?? "Failed to create account" },
      { status },
    );
  }

  const now = new Date().toISOString();

  try {
    await adminDb
      .collection("users")
      .doc(userRecord.uid)
      .set({
        uid: userRecord.uid,
        email,
        role: "engineer",
        fullName: fullName || "",
        licenseType: licenseType || "",
        licenseNumber,
        issuingBody: issuingBody || "",
        licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : null,
        credentialVerificationStatus: "pending",
        credentialFileUrl: credentialFileUrl || "",
        credentialUploadedAt: now,
        credentialRejectionReason: "",
        verifiedBy: null,
        verifiedAt: null,
        enabled: true,
        lastLoginAt: null,
        createdAt: now,
      });
  } catch (err) {
    await adminAuth.deleteUser(userRecord.uid).catch(() => {});
    return Response.json(
      { error: "Failed to create user profile, account creation rolled back" },
      { status: 500 },
    );
  }

  return Response.json(
    {
      uid: userRecord.uid,
      email,
      fullName,
      licenseNumber,
      credentialVerificationStatus: "pending",
    },
    { status: 201 },
  );
}

/**
 * GET /api/admin/engineers
 * Query params: ?status=pending|verified|rejected|expired&enabled=true|false
 *
 * Returns list of all engineers with their credential status.
 * Admin-only.
 */
export async function GET(request) {
  try {
    await verifyCallerRole(request, ["admin"]);
  } catch (err) {
    return Response.json(
      { error: err.message ?? "Unauthorized" },
      { status: err.status ?? 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status"); // pending, verified, rejected, expired
  const enabledFilter = searchParams.get("enabled"); // true or false

  try {
    let query = adminDb.collection("users").where("role", "==", "engineer");

    if (statusFilter) {
      query = query.where("credentialVerificationStatus", "==", statusFilter);
    }

    if (enabledFilter !== null) {
      const enabled = enabledFilter === "true";
      query = query.where("enabled", "==", enabled);
    }

    const snap = await query.get();

    const engineers = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: data.uid,
        email: data.email,
        fullName: data.fullName || "",
        licenseNumber: data.licenseNumber,
        licenseType: data.licenseType || "",
        issuingBody: data.issuingBody || "",
        licenseExpiryDate: data.licenseExpiryDate?.toDate?.() || null,
        credentialVerificationStatus: data.credentialVerificationStatus,
        credentialUploadedAt: data.credentialUploadedAt,
        verifiedAt: data.verifiedAt,
        enabled: data.enabled,
        lastLoginAt: data.lastLoginAt,
        createdAt: data.createdAt,
      };
    });

    return Response.json({ engineers }, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err.message ?? "Failed to fetch engineers" },
      { status: 500 },
    );
  }
}
