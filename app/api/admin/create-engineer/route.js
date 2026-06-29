import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { verifyCallerRole } from "@/lib/verify-admin";

/**
 * POST /api/admin/create-engineer
 * Body: { email: string, password: string }
 *
 * Creates a Firebase Auth account and a matching Firestore users/{uid}
 * profile with role: "engineer". Admin-only.
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

  const { email, password } = body ?? {};

  if (!email || typeof email !== "string") {
    return Response.json({ error: "email is required" }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return Response.json(
      { error: "password is required and must be at least 8 characters" },
      { status: 400 },
    );
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
    await adminDb.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      role: "engineer",
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
    { uid: userRecord.uid, email, role: "engineer" },
    { status: 201 },
  );
}
