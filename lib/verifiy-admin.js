import { adminAuth, adminDb } from "@/lib/firebase-admin";

/**
 * Verifies a Firebase ID token from the Authorization header and confirms
 * the caller's Firestore role is in allowedRoles. Throws an object with a
 * `status` field on failure so route handlers can respond consistently.
 *
 * Usage in a route handler:
 *   const { uid, role } = await verifyCallerRole(request, ["admin"]);
 *
 * @param {Request} request
 * @param {string[]} allowedRoles
 * @returns {Promise<{ uid: string, role: string }>}
 */
export async function verifyCallerRole(request, allowedRoles) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    throw { status: 401, message: "Missing Authorization header" };
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    throw { status: 401, message: "Invalid or expired token" };
  }

  const userSnap = await adminDb.collection("users").doc(decoded.uid).get();

  if (!userSnap.exists) {
    throw { status: 403, message: "No user profile found" };
  }

  const role = userSnap.data().role === "citizen" ? "public" : userSnap.data().role;

  if (!allowedRoles.includes(role)) {
    throw { status: 403, message: "Insufficient role" };
  }

  return { uid: decoded.uid, role };
}
