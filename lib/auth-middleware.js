import { adminAuth } from "./firebase-admin";

/**
 * Verifies the Firebase ID token from the Authorization header.
 * @param {Request} request
 * @returns {Promise<{uid: string, role: string, email: string} | null>}
 */
export async function verifyAuth(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split("Bearer ")[1];

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      role: decoded.role ?? "citizen",
      email: decoded.email,
    };
  } catch {
    return null;
  }
}

/**
 * Returns a 401 response — use this in API routes when auth fails.
 */
export function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
