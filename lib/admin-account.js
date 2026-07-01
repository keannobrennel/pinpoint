import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { isValidRole, normalizeRole } from "@/lib/roles";

export async function createUserAccount({
  email,
  password,
  role,
  displayName = "",
  createdBy,
}) {
  const normalizedRole = normalizeRole(role);

  if (!isValidRole(normalizedRole)) {
    const error = new Error("role is required and must be one of valid roles");
    error.status = 400;
    throw error;
  }

  const userRecord = await adminAuth.createUser({
    email,
    password,
    displayName,
  });

  const now = new Date().toISOString();
  const profile = {
    uid: userRecord.uid,
    email,
    displayName: displayName ?? "",
    role: normalizedRole,
    createdAt: now,
  };

  if (createdBy) {
    profile.createdBy = createdBy;
  }

  try {
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: normalizedRole });
    await adminDb.collection("users").doc(userRecord.uid).set(profile);
  } catch (err) {
    await adminAuth.deleteUser(userRecord.uid).catch(() => {});
    throw err;
  }

  return { uid: userRecord.uid, email, role: normalizedRole };
}