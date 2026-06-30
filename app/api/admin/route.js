import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";

// POST /api/admin — create an engineer account (admin only)
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
  const { email, password, displayName } = body;

  if (!email || !password) {
    return new Response(
      JSON.stringify({ error: "Missing email or password" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const newUser = await adminAuth.createUser({
    email,
    password,
    displayName: displayName ?? "",
  });

  // Set engineer role as custom claim
  await adminAuth.setCustomUserClaims(newUser.uid, { role: "engineer" });

  // Create user profile in Firestore
  await adminDb
    .collection("users")
    .doc(newUser.uid)
    .set({
      email,
      displayName: displayName ?? "",
      role: "engineer",
      createdAt: new Date().toISOString(),
      createdBy: user.uid,
    });

  return new Response(
    JSON.stringify({ uid: newUser.uid, email, role: "engineer" }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    },
  );
}
