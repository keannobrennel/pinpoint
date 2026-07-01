import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { verifyCallerRole } from "@/lib/verify-admin";
import { normalizeRole } from "@/lib/roles";

/**
 * GET /api/admin/users
 * Query params: ?enabled=true|false
 *
 * Returns all Firestore user profiles.
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
  const enabledFilter = searchParams.get("enabled");
  const roleFilter = searchParams.get("role");

  try {
    const authResult = await adminAuth.listUsers();
    const profileSnap = await adminDb.collection("users").get();

    const profileByUid = {};
    profileSnap.forEach((doc) => {
      profileByUid[doc.id] = doc.data();
    });

    const toISO = (ts) => ts?.toDate?.().toISOString() ?? ts ?? null;
    const users = authResult.users.map((user) => {
      const profile = profileByUid[user.uid] ?? {};
      const rawRole = user.customClaims?.role ?? profile.role ?? "public";
      const role = normalizeRole(rawRole);

      return {
        uid: user.uid,
        email: user.email ?? profile.email ?? "",
        displayName: profile.displayName || profile.fullName || user.displayName || "",
        role,
        enabled: user.disabled !== true,
        lastLoginAt: toISO(user.metadata.lastSignInTime),
        createdAt: toISO(user.metadata.creationTime),
      };
    });

    let filteredUsers = users;

    if (roleFilter) {
      filteredUsers = filteredUsers.filter((user) => user.role === roleFilter);
    }

    if (enabledFilter !== null) {
      const enabled = enabledFilter === "true";
      filteredUsers = filteredUsers.filter((user) => user.enabled === enabled);
    }

    return Response.json({ users: filteredUsers }, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err.message ?? "Failed to fetch users" },
      { status: 500 },
    );
  }
}