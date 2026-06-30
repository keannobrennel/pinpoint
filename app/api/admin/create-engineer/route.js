import { verifyCallerRole } from "@/lib/verify-admin";
import { createUserAccount } from "@/lib/admin-account";

/**
 * POST /api/admin/create-engineer
 * Body: { email: string, password: string }
 *
 * Compatibility wrapper around the canonical create-user flow.
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

  try {
    const result = await createUserAccount({
      email,
      password,
      role: "engineer",
    });

    return Response.json(result, { status: 201 });
  } catch (err) {
    const status = err.code === "auth/email-already-exists" ? 409 : err.status ?? 500;
    return Response.json({ error: err.message ?? "Failed to create account" }, { status });
  }
}
