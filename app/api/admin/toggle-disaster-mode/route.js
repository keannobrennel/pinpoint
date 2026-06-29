import { adminDb } from "@/lib/firebase-admin";
import { verifyCallerRole } from "@/lib/verify-admin";

/**
 * POST /api/admin/toggle-disaster-mode
 * Body: { zoneId: string, disasterMode: boolean }
 *
 * Sets the disasterMode flag on a zone document. Admin-only.
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

  const { zoneId, disasterMode } = body ?? {};

  if (!zoneId || typeof zoneId !== "string") {
    return Response.json({ error: "zoneId is required" }, { status: 400 });
  }
  if (typeof disasterMode !== "boolean") {
    return Response.json(
      { error: "disasterMode must be a boolean" },
      { status: 400 },
    );
  }

  const zoneRef = adminDb.collection("zones").doc(zoneId);
  const zoneSnap = await zoneRef.get();

  if (!zoneSnap.exists) {
    return Response.json({ error: "Zone not found" }, { status: 404 });
  }

  await zoneRef.update({
    disasterMode,
    updatedAt: new Date().toISOString(),
  });

  return Response.json({ zoneId, disasterMode }, { status: 200 });
}
