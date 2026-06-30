import { adminAuth, adminDb } from "./firebase-admin";

export async function verifyAuth(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split("Bearer ")[1];

  try {
    const decoded = await adminAuth.verifyIdToken(token);

    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
    const data = userDoc.exists ? userDoc.data() : {};

    return {
      uid: decoded.uid,
      role: data.role ?? "public",
      email: decoded.email,
      displayName: data.displayName ?? null,
    };
  } catch {
    return null;
  }
}

export function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
