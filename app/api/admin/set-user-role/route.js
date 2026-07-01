import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { verifyCallerRole } from "@/lib/verify-admin";
import { VALID_ROLES } from "@/lib/roles";

export async function POST(request) {
  try {
    await verifyCallerRole(request, ["admin"]);

    const { uid, role } = await request.json();

    if (!uid || !role || !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const userRef = adminDb.collection("users").doc(uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    await userRef.set({ role, updatedAt: new Date().toISOString() }, { merge: true });
    await adminAuth.setCustomUserClaims(uid, { role });

    return NextResponse.json({ success: true, uid, role });
  } catch (err) {
    const status = err.status || 500;
    const message = err.message || "Failed to set user role";
    return NextResponse.json({ error: message }, { status });
  }
}