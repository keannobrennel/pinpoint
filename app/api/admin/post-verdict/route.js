import { adminDb } from "@/lib/firebase-admin";
import { verifyCallerRole } from "@/lib/verify-admin";

const VALID_PLACARDS = ["inspected", "restricted_use", "unsafe"];

/**
 * POST /api/admin/post-verdict
 * Body: { zoneId: string, verdict: "inspected" | "restricted_use" | "unsafe", alertBannerMessage?: string }
 *
 * Posts (or overwrites) the official, public-facing ATC-20 verdict for a
 * zone. This is the only write path that should ever set officialVerdict —
 * the public map reads this field directly. Admin-only.
 */
export async function POST(request) {
  let caller;
  try {
    caller = await verifyCallerRole(request, ["admin"]);
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

  const { zoneId, verdict, alertBannerMessage } = body ?? {};

  if (!zoneId || typeof zoneId !== "string") {
    return Response.json({ error: "zoneId is required" }, { status: 400 });
  }
  if (!VALID_PLACARDS.includes(verdict)) {
    return Response.json(
      { error: `verdict must be one of: ${VALID_PLACARDS.join(", ")}` },
      { status: 400 },
    );
  }

  const zoneRef = adminDb.collection("zones").doc(zoneId);
  const zoneSnap = await zoneRef.get();

  if (!zoneSnap.exists) {
    return Response.json({ error: "Zone not found" }, { status: 404 });
  }

  const now = new Date().toISOString();

  const update = {
    officialVerdict: verdict,
    verdictPostedBy: caller.uid,
    verdictPostedAt: now,
    updatedAt: now,
  };

  if (typeof alertBannerMessage === "string") {
    update.alertBannerMessage = alertBannerMessage;
  }

  await zoneRef.update(update);

  return Response.json({ zoneId, officialVerdict: verdict }, { status: 200 });
}
