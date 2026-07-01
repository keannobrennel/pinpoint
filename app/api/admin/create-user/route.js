import { verifyCallerRole } from "@/lib/verify-admin";
import { createUserAccount } from "@/lib/admin-account";
import { isValidRole } from "@/lib/roles";

/**
 * POST /api/admin/create-user
 * Body: { email, password, role }
 * Admin-only: creates Auth user, sets custom claim, and writes Firestore profile
 */
export async function POST(request) {
  try {
    await verifyCallerRole(request, ["admin"]);
  } catch (err) {
    return Response.json({ error: err.message ?? "Unauthorized" }, { status: err.status ?? 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, password, role, displayName } = body ?? {};

  if (!email || typeof email !== "string") {
    return Response.json({ error: "email is required" }, { status: 400 });
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    return Response.json({ error: "password is required and must be at least 6 characters" }, { status: 400 });
  }

  if (!role || typeof role !== "string" || !isValidRole(role)) {
    return Response.json({ error: "role is required and must be one of valid roles" }, { status: 400 });
  }

  try {
    const result = await createUserAccount({
      email,
      password,
      role,
      displayName: displayName || email,
    });

    return Response.json(result, { status: 201 });
  } catch (err) {
    const status = err.code === "auth/email-already-exists" ? 409 : err.status ?? 500;
    return Response.json({ error: err.message ?? "Failed to create account" }, { status });
  }
}
