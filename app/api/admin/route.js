import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";

const VALID_ROLES = ["public", "responder", "engineer", "admin"];

// POST /api/admin — create an account (admin only)
export async function POST(request) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json();
  const { email, password, displayName, role = "engineer" } = body;

  if (!email || !password) {
    return new Response(
      JSON.stringify({ error: "Missing email or password" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (!VALID_ROLES.includes(role)) {
    return new Response(JSON.stringify({ error: "Invalid role" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const newUser = await adminAuth.createUser({
    email,
    password,
    displayName: displayName ?? "",
  });

  await adminAuth.setCustomUserClaims(newUser.uid, { role });

  // Create user profile in Firestore
  await adminDb
    .collection("users")
    .doc(newUser.uid)
    .set({
      uid: newUser.uid,
      email,
      displayName: displayName ?? "",
      role,
      createdAt: new Date().toISOString(),
      createdBy: user.uid,
    });

  return new Response(
    JSON.stringify({ uid: newUser.uid, email, role }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    },
  );
}
